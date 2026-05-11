interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface RateLimitState {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitState>();

export const compareRateLimit = {
  limit: 30,
  windowMs: 60_000
} satisfies RateLimitOptions;

export function resolveClientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  return forwardedFor || realIp || "anonymous";
}

export function checkRateLimit(key: string, options: RateLimitOptions = compareRateLimit): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    buckets.set(key, {
      count: 1,
      resetAt
    });

    return {
      limited: false,
      remaining: options.limit - 1,
      resetAt
    };
  }

  if (existing.count >= options.limit) {
    return {
      limited: true,
      remaining: 0,
      resetAt: existing.resetAt
    };
  }

  existing.count += 1;

  return {
    limited: false,
    remaining: options.limit - existing.count,
    resetAt: existing.resetAt
  };
}

export function resetRateLimitForTests(): void {
  buckets.clear();
}
