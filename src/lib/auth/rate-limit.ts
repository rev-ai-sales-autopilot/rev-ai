/**
 * Simple in-memory sliding-window rate limiter for sensitive authentication & bootstrap routes.
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const attemptsMap = new Map<string, RateLimitRecord>();

/**
 * Checks and increments rate limit attempts for a given key.
 * @param key Identifier (e.g. IP address or user ID)
 * @param maxAttempts Maximum allowed attempts in window (default 5)
 * @param windowMs Window duration in milliseconds (default 15 minutes)
 * @returns { allowed: boolean, remaining: number }
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = attemptsMap.get(key);

  if (!record || now > record.resetTime) {
    attemptsMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: maxAttempts - record.count };
}
