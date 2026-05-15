import { connectToDatabase } from "@/lib/db";
import { RateLimitBucketModel } from "@/lib/models/comparison-brain";

interface RateLimitOptions {
  limit: number;
  windowMs: number;
  scope?: string;
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
  windowMs: 60_000,
  scope: "compare"
} satisfies RateLimitOptions;

export const shouldBuyRateLimit = {
  limit: 20,
  windowMs: 60_000,
  scope: "watch_purchase"
} satisfies RateLimitOptions;

export const tradeoffRateLimit = {
  limit: 60,
  windowMs: 60_000,
  scope: "compare_tradeoff"
} satisfies RateLimitOptions;

export function resolveClientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  return forwardedFor || realIp || "anonymous";
}

function checkInMemoryRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
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

export async function checkRateLimit(
  key: string,
  options: RateLimitOptions = compareRateLimit
): Promise<RateLimitResult> {
  let connection = null;

  try {
    connection = await connectToDatabase();
  } catch {
    return checkInMemoryRateLimit(key, options);
  }

  if (!connection) {
    return checkInMemoryRateLimit(key, options);
  }

  const now = new Date();
  const resetAt = new Date(now.getTime() + options.windowMs);
  const scope = options.scope ?? "default";
  const bucketKey = `${scope}:${key}`;

  const bucket = await RateLimitBucketModel.findOneAndUpdate(
    {
      key: bucketKey,
      $or: [{ resetAt: { $gt: now } }, { resetAt: { $exists: false } }]
    },
    {
      $setOnInsert: {
        key: bucketKey,
        scope,
        count: 0,
        resetAt
      },
      $set: {
        lastSeenAt: now,
        scope
      },
      $inc: {
        count: 1
      }
    },
    {
      upsert: true,
      new: true
    }
  ).lean<{
    count: number;
    resetAt: Date | string;
  }>();

  if (!bucket) {
    return checkInMemoryRateLimit(key, options);
  }

  const bucketResetAt = new Date(bucket.resetAt).getTime();

  if (bucket.count > options.limit) {
    return {
      limited: true,
      remaining: 0,
      resetAt: bucketResetAt
    };
  }

  return {
    limited: false,
    remaining: Math.max(0, options.limit - bucket.count),
    resetAt: bucketResetAt
  };
}

export function resetRateLimitForTests(): void {
  buckets.clear();
}
