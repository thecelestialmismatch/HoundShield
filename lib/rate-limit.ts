export interface RateLimiterOptions {
  limit: number;
  windowMs: number;
}

const rateLimiters: Record<string, Map<string, { count: number; expiresAt: number }>> = {};

export function createRateLimiter(namespace: string, options: RateLimiterOptions) {
  if (!rateLimiters[namespace]) {
    rateLimiters[namespace] = new Map();
  }
  
  const store = rateLimiters[namespace];

  return function rateLimit(ip: string): { success: boolean; limit: number; remaining: number; reset: number } {
    const now = Date.now();
    const record = store.get(ip);

    if (!record) {
      store.set(ip, { count: 1, expiresAt: now + options.windowMs });
      return { success: true, limit: options.limit, remaining: options.limit - 1, reset: now + options.windowMs };
    }

    if (now > record.expiresAt) {
      record.count = 1;
      record.expiresAt = now + options.windowMs;
      return { success: true, limit: options.limit, remaining: options.limit - 1, reset: record.expiresAt };
    }

    record.count++;
    
    return {
      success: record.count <= options.limit,
      limit: options.limit,
      remaining: Math.max(0, options.limit - record.count),
      reset: record.expiresAt,
    };
  };
}
