import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { CodeSubmission } from '@/models/CodeSubmission';
import { analyzeCode, AiReviewError, QuotaExceededError } from '@/lib/gemini';
import { getCachedReview, cacheReview } from '@/lib/cache';
import { getOptionalUser } from '@/middleware/withAuth';
import { rateLimit } from '@/middleware/rateLimit';
import logger from '@/lib/logger';
import { AIReview, ExplanationLevel, EXPLANATION_LEVELS, ReviewFocus, REVIEW_FOCUSES } from '@/types';

// Apply rate limiting: 10 requests per minute
const rateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  maxRequests: 10,
});

const MAX_CODE_LENGTH = 50_000;

const unauthorized = (error = 'Unauthorized: Please sign in') =>
  NextResponse.json({ success: false, error }, { status: 401 });

async function handlePOST(request: NextRequest) {
  try {
    const { user, invalid } = getOptionalUser(request);
    if (invalid) {
      return unauthorized('Unauthorized: Invalid or expired token');
    }

    const body = await request.json().catch(() => null);
    const { code, language, filename = 'snippet' } = body ?? {};
    const focus: ReviewFocus = REVIEW_FOCUSES.includes(body?.focus) ? body.focus : 'all';
    const level: ExplanationLevel = EXPLANATION_LEVELS.includes(body?.level) ? body.level : 'intermediate';

    // Validate input
    if (typeof code !== 'string' || typeof language !== 'string' || !code.trim() || !language) {
      return NextResponse.json(
        { success: false, error: 'Code and language are required' },
        { status: 400 }
      );
    }
    if (code.length > MAX_CODE_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Code is too long (max ${MAX_CODE_LENGTH} characters)` },
        { status: 400 }
      );
    }
    const safeFilename = typeof filename === 'string' && filename.trim() ? filename.trim() : 'snippet';

    // Guest: review the code but don't touch the database; the result only lives in the response
    if (!user) {
      logger.info('Guest review requested');

      let review = await getCachedReview({ code, language, focus, level });
      if (!review) {
        try {
          const fresh: AIReview = await analyzeCode(code, language, focus, level);
          await cacheReview({ code, language, focus, level }, fresh);
          review = fresh;
        } catch (error) {
          logger.error('Guest AI review failed:', error);
          if (error instanceof QuotaExceededError) {
            return NextResponse.json(
              { success: false, error: error.message },
              { status: 429 }
            );
          }
          if (error instanceof AiReviewError) {
            return NextResponse.json(
              { success: false, error: error.message },
              { status: 502 }
            );
          }
          return NextResponse.json(
            { success: false, error: 'AI review failed. Please try again.' },
            { status: 502 }
          );
        }
      }

      const now = new Date().toISOString();
      return NextResponse.json(
        {
          success: true,
          data: {
            userId: 'guest',
            code,
            language,
            filename: safeFilename,
            focus,
            status: 'completed',
            aiResponse: review,
            createdAt: now,
            updatedAt: now,
          },
          message: 'Review completed (not saved - sign in to keep your reviews)',
          saved: false,
        },
        { status: 200 }
      );
    }

    // Signed in: persist the submission
    await dbConnect();
    const userId = user.userId;
    logger.info(`Submitting code for user: ${userId}`);

    // Check cache first
    const cachedReview = await getCachedReview({ code, language, focus, level });
    if (cachedReview) {
      const submission = await CodeSubmission.create({
        userId,
        code,
        language,
        filename: safeFilename,
        focus,
        status: 'completed',
        aiResponse: cachedReview,
      });

      logger.info(`Cache hit - returned cached review for submission ${submission._id}`);

      return NextResponse.json(
        {
          success: true,
          data: submission,
          message: 'Code review retrieved from cache',
          cached: true,
          saved: true,
        },
        { status: 201 }
      );
    }

    // Create submission
    const submission = await CodeSubmission.create({
      userId,
      code,
      language,
      filename: safeFilename,
      focus,
      status: 'processing',
    });

    // Start AI analysis (async - don't wait for it)
    analyzeCodeAndSave(submission._id.toString(), code, language, focus, level).catch(() => {
      // Already logged and marked failed inside; avoids an unhandled promise rejection
    });

    logger.info(`New submission created: ${submission._id} for user: ${userId}`);

    return NextResponse.json(
      {
        success: true,
        data: submission,
        message: 'Code submitted for review',
        saved: true,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error submitting code:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit code' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return await rateLimiter(request, () => handlePOST(request));
}

async function analyzeCodeAndSave(
  submissionId: string,
  code: string,
  language: string,
  focus: ReviewFocus,
  level: ExplanationLevel
) {
  try {
    await dbConnect();

    logger.info(`Starting AI analysis for submission ${submissionId}`);

    // Perform AI analysis
    const aiReview = await analyzeCode(code, language, focus, level);

    // Cache the result
    await cacheReview({ code, language, focus, level }, aiReview);

    // Update submission with AI review
    const updated = await CodeSubmission.findByIdAndUpdate(
      submissionId,
      {
        status: 'completed',
        aiResponse: aiReview,
      },
      { new: true }
    );

    logger.info(`AI review completed for submission ${submissionId}`);

    return updated;
  } catch (error) {
    logger.error(`AI review failed for submission ${submissionId}:`, error);

    // Update submission status to failed, with a reason the user can read
    const errorMessage =
      error instanceof QuotaExceededError || error instanceof AiReviewError
        ? error.message
        : 'The AI review failed. Please try again.';
    await CodeSubmission.findByIdAndUpdate(submissionId, {
      status: 'failed',
      errorMessage,
    });

    throw error;
  }
}

// Saved history belongs to the signed-in user only
export async function GET(request: NextRequest) {
  try {
    const { user } = getOptionalUser(request);
    if (!user) return unauthorized();

    await dbConnect();

    const submissions = await CodeSubmission.find({ userId: user.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    logger.error('Error fetching submissions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
