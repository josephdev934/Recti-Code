import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  interval: number; // Time window in ms
  maxRequests: number; // Max requests per window
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(config: RateLimitConfig) {
  return async function rateLimitMiddleware(
    req: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown';
    const now = Date.now();
    
    const userLimit = rateLimitStore.get(ip);
    
    if (!userLimit) {
      // First request from this IP
      rateLimitStore.set(ip, {
        count: 1,
        resetTime: now + config.interval,
      });
      return await handler();
    }
    
    // Reset if window expired
    if (now > userLimit.resetTime) {
      rateLimitStore.set(ip, {
        count: 1,
        resetTime: now + config.interval,
      });
      return await handler();
    }
    
    // Check if limit exceeded
    if (userLimit.count >= config.maxRequests) {
      const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
    
    // Increment counter
    userLimit.count++;
    rateLimitStore.set(ip, userLimit);
    
    return await handler();
  };
}
