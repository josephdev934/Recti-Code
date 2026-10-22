export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const MONGODB_URI = process.env.MONGODB_URI || '';
export const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const DEV_JWT_SECRET = 'your-secret-key-change-in-production';
export const JWT_SECRET = process.env.JWT_SECRET || DEV_JWT_SECRET;

// A publicly known fallback secret lets anyone forge tokens, so never allow it in production
if (process.env.NODE_ENV === 'production' && JWT_SECRET === DEV_JWT_SECRET && process.env.NEXT_PHASE !== 'phase-production-build') {
  throw new Error('JWT_SECRET must be set in production');
}
export const REDIS_URL = process.env.REDIS_URL || '';
export const SENTRY_DSN = process.env.SENTRY_DSN || '';
