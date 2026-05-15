import { beforeEach, describe, expect, it, vi } from "vitest";

const connectToDatabaseMock = vi.fn();
const findOneAndUpdateMock = vi.fn();

vi.mock("@/lib/db", () => ({
  connectToDatabase: connectToDatabaseMock
}));

vi.mock("@/lib/models/comparison-brain", () => ({
  RateLimitBucketModel: {
    findOneAndUpdate: findOneAndUpdateMock
  }
}));

describe("checkRateLimit", () => {
  beforeEach(() => {
    connectToDatabaseMock.mockReset();
    findOneAndUpdateMock.mockReset();
    vi.resetModules();
  });

  it("falls back to in-memory limiting when no shared datastore is configured", async () => {
    connectToDatabaseMock.mockResolvedValue(null);

    const { checkRateLimit, compareRateLimit, resetRateLimitForTests } = await import("@/lib/security/rate-limit");

    resetRateLimitForTests();

    for (let index = 0; index < compareRateLimit.limit; index += 1) {
      const result = await checkRateLimit("203.0.113.210");

      expect(result.limited).toBe(false);
    }

    const limited = await checkRateLimit("203.0.113.210");

    expect(limited.limited).toBe(true);
    expect(findOneAndUpdateMock).not.toHaveBeenCalled();
  });

  it("falls back to in-memory limiting when the shared datastore lookup throws", async () => {
    connectToDatabaseMock.mockRejectedValue(new Error("mongo unavailable"));

    const { checkRateLimit, compareRateLimit, resetRateLimitForTests } = await import("@/lib/security/rate-limit");

    resetRateLimitForTests();

    for (let index = 0; index < compareRateLimit.limit; index += 1) {
      const result = await checkRateLimit("203.0.113.213");

      expect(result.limited).toBe(false);
    }

    const limited = await checkRateLimit("203.0.113.213");

    expect(limited.limited).toBe(true);
    expect(findOneAndUpdateMock).not.toHaveBeenCalled();
  });

  it("uses the shared bucket when a database connection is available", async () => {
    connectToDatabaseMock.mockResolvedValue({});
    findOneAndUpdateMock.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        count: 2,
        resetAt: new Date(Date.now() + 60_000).toISOString()
      })
    });

    const { checkRateLimit } = await import("@/lib/security/rate-limit");
    const result = await checkRateLimit("203.0.113.211");

    expect(result.limited).toBe(false);
    expect(findOneAndUpdateMock).toHaveBeenCalledTimes(1);
    expect(findOneAndUpdateMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        key: "compare:203.0.113.211"
      })
    );
  });

  it("returns a limited result when the shared bucket exceeds the configured limit", async () => {
    connectToDatabaseMock.mockResolvedValue({});
    findOneAndUpdateMock.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        count: 31,
        resetAt: new Date(Date.now() + 60_000).toISOString()
      })
    });

    const { checkRateLimit } = await import("@/lib/security/rate-limit");
    const result = await checkRateLimit("203.0.113.212");

    expect(result.limited).toBe(true);
    expect(result.remaining).toBe(0);
  });
});
