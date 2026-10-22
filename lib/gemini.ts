import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@/config';
import { AIReview, CodeIssue, ExplanationLevel, ReviewFocus, Severity } from '@/types';

// Tried in order. Free-tier quotas are per model, so when one runs out the next can still answer.
// Override with GEMINI_MODELS="model-a,model-b" in .env.local.
const MODEL_NAMES = (process.env.GEMINI_MODELS || 'gemini-2.5-flash-lite,gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-3.8-flash')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);

type GeminiModel = ReturnType<GoogleGenerativeAI['getGenerativeModel']>;
const models = new Map<string, GeminiModel>();

/** Every configured Gemini model has hit its rate limit or quota (HTTP 429). */
export class QuotaExceededError extends Error {
  constructor() {
    super('The AI quota is used up for now. Please try again later.');
    this.name = 'QuotaExceededError';
  }
}

/** A failure we can explain to the user in plain words (the message is safe to show). */
export class AiReviewError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiReviewError';
  }
}

const statusOf = (error: unknown) => (error as { status?: number } | null)?.status;

// 429: out of quota. 404: model retired or not available to this key. Either way, try the next one.
function isSkippableModelError(error: unknown) {
  const status = statusOf(error);
  return status === 429 || status === 404;
}

// Brief outages on Google's side: worth a quick retry before giving up on a model
function isTransientError(error: unknown) {
  const status = statusOf(error);
  const message = String((error as Error | null)?.message ?? '');
  return (
    status === 500 ||
    status === 503 ||
    status === 504 ||
    /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|overloaded|UNAVAILABLE/i.test(message)
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Created on first use so that routes that never call the AI don't fail when the key is missing
export function getGeminiModel(name: string = MODEL_NAMES[0]) {
  if (!GEMINI_API_KEY) {
    // The detail is for whoever runs the server; users just see that the service isn't available
    console.error('GEMINI_API_KEY is not set. Add it to .env.local and restart the server.');
    throw new AiReviewError('The review service is not available right now. Please try again later.');
  }
  let model = models.get(name);
  if (!model) {
    model = new GoogleGenerativeAI(GEMINI_API_KEY).getGenerativeModel({
      model: name,
      // JSON mode: the model must return valid JSON, even when the fixes contain quotes and newlines.
      // The default output limit is small enough to cut a long review off mid-answer.
      generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 16384 },
    });
    models.set(name, model);
  }
  return model;
}

async function generateText(prompt: string): Promise<string> {
  let sawQuota = false;
  let sawOutage = false;
  let lastError: unknown;

  for (const name of MODEL_NAMES) {
    // up to 3 tries per model for short outages (waits 1s, then 3s)
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const chatSession = getGeminiModel(name).startChat({ history: [] });
        const result = await chatSession.sendMessage(prompt);

        if (result.response.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
          throw new AiReviewError(
            'The review was too long to finish. Try a shorter snippet, or pick a single focus (Security, Performance or Readability).'
          );
        }
        try {
          return result.response.text();
        } catch {
          // text() throws when Gemini blocks the answer
          throw new AiReviewError('Gemini declined to review this code. Try a different snippet.');
        }
      } catch (error) {
        if (error instanceof AiReviewError) throw error;
        lastError = error;

        if (isSkippableModelError(error)) {
          sawQuota = sawQuota || statusOf(error) === 429;
          console.warn(`Gemini model ${name} unavailable (quota or retired), trying next model`);
          break; // next model
        }
        if (isTransientError(error)) {
          sawOutage = true;
          if (attempt < 2) {
            await sleep(attempt === 0 ? 1000 : 3000);
            continue;
          }
          console.warn(`Gemini model ${name} kept failing, trying next model`);
          break; // next model
        }

        const status = statusOf(error);
        if (status === 400 || status === 401 || status === 403) {
          console.error('Gemini rejected the request:', error);
          throw new AiReviewError('The review service is not available right now. Please try again later.');
        }
        throw error;
      }
    }
  }

  console.error('No Gemini model could answer:', lastError);
  if (sawQuota) throw new QuotaExceededError();
  if (sawOutage) throw new AiReviewError('Gemini is busy right now. Please try again in a moment.');
  throw new AiReviewError('The AI review failed. Please try again.');
}

const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low'];

function toIssues(value: unknown): CodeIssue[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({
      issue: String(item.issue ?? '').trim(),
      fix: String(item.fix ?? ''),
      severity: SEVERITIES.includes(item.severity as Severity) ? (item.severity as Severity) : undefined,
      line: Number.isInteger(item.line) && (item.line as number) > 0 ? (item.line as number) : undefined,
    }))
    .filter((issue) => issue.issue.length > 0);
}

// Turns whatever the model sent into a review the UI can always render
function parseReview(text: string): AIReview {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

  let raw: unknown;
  try {
    raw = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        raw = JSON.parse(match[0]);
      } catch {
        // fall through to the error below
      }
    }
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new AiReviewError('The AI sent back an answer that could not be read. Please try again.');
  }

  const r = raw as Record<string, unknown>;
  const score = Number(r.overallScore);
  return {
    bugs: toIssues(r.bugs),
    performanceIssues: toIssues(r.performanceIssues),
    securityProblems: toIssues(r.securityProblems),
    bestPractices: toIssues(r.bestPractices),
    architectureSuggestions: toIssues(r.architectureSuggestions),
    overallScore: Number.isFinite(score) ? Math.min(10, Math.max(0, score)) : 5,
    explanation: typeof r.explanation === 'string' && r.explanation.trim() ? r.explanation.trim() : undefined,
    summary: typeof r.summary === 'string' && r.summary.trim() ? r.summary.trim() : 'No summary was provided.',
  };
}

const FOCUS_INSTRUCTIONS: Record<ReviewFocus, string> = {
  all: '',
  security:
    'REVIEW FOCUS: security only. Report only security problems (put them in "securityProblems") and return empty arrays for every other category.',
  performance:
    'REVIEW FOCUS: performance only. Report only performance issues (put them in "performanceIssues") and return empty arrays for every other category.',
  readability:
    'REVIEW FOCUS: readability and maintainability only. Report only best-practice and structure issues (put them in "bestPractices" and "architectureSuggestions") and return empty arrays for every other category.',
};

// The prompt asks the model to stay on the chosen focus, but models sometimes add other
// categories anyway, so enforce it here: only the category the user picked comes back.
function applyFocus(review: AIReview, focus: ReviewFocus): AIReview {
  const kept: Record<ReviewFocus, (keyof AIReview)[]> = {
    all: ['bugs', 'performanceIssues', 'securityProblems', 'bestPractices', 'architectureSuggestions'],
    security: ['securityProblems'],
    performance: ['performanceIssues'],
    readability: ['bestPractices', 'architectureSuggestions'],
  };
  const lists = kept.all;
  const result = { ...review };
  for (const key of lists) {
    (result as any)[key] = kept[focus].includes(key) && Array.isArray(review[key]) ? review[key] : [];
  }
  return result;
}

const LEVEL_INSTRUCTIONS: Record<ExplanationLevel, string> = {
  beginner:
    'Write the explanation for a beginner: plain words, no jargon (or explain any term you use), short sentences.',
  intermediate:
    'Write the explanation for a developer who knows the language but not this code.',
  expert:
    'Write the explanation for an expert: concise and technical, mention design choices and trade-offs.',
};

export async function analyzeCode(
  code: string,
  language: string,
  focus: ReviewFocus = 'all',
  level: ExplanationLevel = 'intermediate'
): Promise<AIReview> {
  const prompt = `
You are an expert code reviewer. You will do two separate jobs on the following ${language} code, in this order.
${FOCUS_INSTRUCTIONS[focus]}

CODE:
\`\`\`${language}
${code}
\`\`\`

JOB 1 - EXPLAIN: In "explanation", describe in plain language what this code does (2-5 sentences). This is only a description of the code's behaviour: do not criticise it or mention problems here. ${LEVEL_INSTRUCTIONS[level]}

JOB 2 - REVIEW: Now review the code, kept completely separate from the explanation above.

Please analyze this code for:
1. **Bugs**: Any potential bugs or errors
2. **Performance Issues**: Performance optimizations that could be made
3. **Security Problems**: Security vulnerabilities or concerns
4. **Best Practices**: Violations of coding best practices
5. **Architecture Suggestions**: Improvements to code structure and design

For EACH issue you find, you MUST provide:
- A clear description of the problem
- A severity: one of "critical", "high", "medium", "low"
- The 1-based line number in the code above where the problem is (omit "line" if it is not tied to one line)
- **Corrected code example** showing the fix

Format your response as a JSON object with the following structure:
{
  "explanation": "Plain-language description of what the code does",
  "bugs": [
    {
      "issue": "Description of the bug",
      "severity": "high",
      "line": 12,
      "fix": "Corrected code example"
    }
  ],
  "performanceIssues": [
    {
      "issue": "Description of performance issue",
      "severity": "medium",
      "line": 7,
      "fix": "Optimized code example"
    }
  ],
  "securityProblems": [
    {
      "issue": "Description of security problem",
      "severity": "critical",
      "line": 3,
      "fix": "Secure code example"
    }
  ],
  "bestPractices": [
    {
      "issue": "Description of best practice violation",
      "severity": "low",
      "line": 20,
      "fix": "Improved code example"
    }
  ],
  "architectureSuggestions": [
    {
      "issue": "Description of architecture suggestion",
      "severity": "low",
      "fix": "Refactored code example"
    }
  ],
  "overallScore": 0-10,
  "summary": "Overall verdict on the code quality in one or two sentences"
}

If a category has no issues, return an empty array [].
Respond ONLY with the JSON object, no additional text.
`;

  try {
    const text = await generateText(prompt);

    return applyFocus(parseReview(text), focus);
  } catch (error) {
    console.error('Error analyzing code:', error);
    throw error;
  }
}

// Used by the /api/test health check
export async function pingGemini(): Promise<string> {
  return generateText('Say "Hello" if you can read this');
}
