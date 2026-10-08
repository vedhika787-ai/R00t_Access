/**
 * Rate Limiter: In-memory sliding window token bucket with Upstash Redis support
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Checks and increments rate limit for an identifier (e.g. IP or userId)
 * @param identifier Unique key (e.g. `user_123` or `ip_1.2.3.4`)
 * @param limit Maximum requests allowed within duration
 * @param windowSeconds Window length in seconds
 */
export async function rateLimit(
  identifier: string,
  limit: number = 60,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  // Cleanup old entries
  if (memoryStore.size > 10000) {
    memoryStore.forEach((record, key) => {
      if (record.resetAt < now) {
        memoryStore.delete(key);
      }
    });
  }

  const existing = memoryStore.get(identifier);

  if (!existing || existing.resetAt < now) {
    const record: RateLimitRecord = {
      count: 1,
      resetAt: now + windowMs,
    };
    memoryStore.set(identifier, record);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: record.resetAt,
    };
  }

  if (existing.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: existing.resetAt,
    };
  }

  existing.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - existing.count,
    reset: existing.resetAt,
  };
}
