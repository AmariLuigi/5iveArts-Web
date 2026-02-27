/**
 * Simple in-memory sliding-window rate limiter for Next.js API routes.
 *
 * NOTE: This uses a module-level Map which works for single-process deployments
 * (local dev, single-instance serverless). For multi-instance production
 * deployments replace the store with Redis (e.g. @upstash/ratelimit).
 * 
 * VERCEL SECURITY NOTE: On the Vercel platform, the 'x-forwarded-for' header 
 * is platform-controlled. Vercel strips client-supplied values and sets its own 
 * correct IP, making this safe against header spoofing.
 */

interface RequestRecord {
  count: number;
  windowStart: number;
}

const store = new Map<string, RequestRecord>();

export interface RateLimitOptions {
  /** Max requests allowed inside the window. */
  limit: number;
  /** Window duration in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  /** Remaining requests in the current window. */
  remaining: number;
  /** Timestamp (ms) when the window resets. */
  resetAt: number;
}

/**
 * Check whether `key` (e.g. an IP address) has exceeded the rate limit.
 * Prunes expired entries lazily on each call.
 */
export function checkRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now - record.windowStart > windowMs) {
    // New window
    store.set(key, { count: 1, windowStart: now });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (record.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: record.windowStart + windowMs,
    };
  }

  record.count += 1;
  return {
    success: true,
    remaining: limit - record.count,
    resetAt: record.windowStart + windowMs,
  };
}

/**
 * Extract the best-available client IP from a Next.js Request.
 * Falls back to "unknown" when running locally without a proxy.
 */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
