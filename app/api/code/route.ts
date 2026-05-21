import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { CodeSubmission } from '@/models/CodeSubmission';
import { analyzeCode } from '@/lib/gemini';
import { getCachedReview, cacheReview } from '@/lib/cache';
import { withAuth, AuthenticatedRequest } from '@/middleware/withAuth';
import { rateLimit } from '@/middleware/rateLimit';
import logger from '@/lib/logger';

// Apply rate limiting: 10 requests per minute
const rateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  maxRequests: 10,
});

async function handlePOST(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { code, language, filename = 'snippet' } = body;

    // Validate input
    if (!code || !language) {
      return NextResponse.json(
        { success: false, error: 'Code and language are required' },
        { status: 400 }
      );
    }

    // Get user ID from authenticated user or default to anonymous
    const userId = request.user?.userId || 'anonymous';
    logger.info(`Submitting code for user: ${userId}`);

    // Check cache first
    const cachedReview = await getCachedReview({ code, language });
    if (cachedReview) {
      const submission = await CodeSubmission.create({
        userId,
        code,
        language,
        filename,
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
        },
        { status: 201 }
      );
    }

    // Create submission
    const submission = await CodeSubmission.create({
      userId,
      code,
      language,
      filename,
      status: 'processing',
    });

    // Start AI analysis (async - don't wait for it)
    analyzeCodeAndSave(submission._id.toString(), code, language);

    logger.info(`New submission created: ${submission._id} for user: ${userId}`);

    return NextResponse.json(
      {
        success: true,
        data: submission,
        message: 'Code submitted for review',
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
  return await rateLimiter(request, () => withAuth(handlePOST)(request));
}

async function analyzeCodeAndSave(
  submissionId: string,
  code: string,
  language: string
) {
  try {
    await dbConnect();

    logger.info(`Starting AI analysis for submission ${submissionId}`);

    // Perform AI analysis
    const aiReview = await analyzeCode(code, language);

    // Cache the result
    await cacheReview({ code, language }, aiReview);

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
    
    // Update submission status to failed
    await CodeSubmission.findByIdAndUpdate(submissionId, {
      status: 'failed',
    });
    
    throw error;
  }
}

export async function GET() {
  try {
    await dbConnect();

    const submissions = await CodeSubmission.find()
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
