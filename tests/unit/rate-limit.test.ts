import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: vi.fn() }));

import { rateLimit } from "@/lib/rate-limit";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("rateLimit (in-memory)", () => {
  it("blocks after the limit is reached", async () => {
    const key = `mem:${Math.random()}`;
    expect((await rateLimit(key, 2, 60_000)).ok).toBe(true);
    expect((await rateLimit(key, 2, 60_000)).ok).toBe(true);
    const third = await rateLimit(key, 2, 60_000);
    expect(third.ok).toBe(false);
    expect(third.retryAfterMs).toBeGreaterThan(0);
  });
});

describe("rateLimit (redis)", () => {
  function stubRedis(count: number, ttl = 30_000) {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.com/");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "tok");
    return vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ result: count }, { result: 1 }, { result: ttl }])),
    );
  }

  it("allows requests within the limit", async () => {
    const spy = stubRedis(2);
    const result = await rateLimit("k", 5, 60_000);
    expect(result).toEqual({ ok: true, remaining: 3, retryAfterMs: 0 });
    expect(String(spy.mock.calls[0]![0])).toBe("https://redis.example.com/pipeline");
  });

  it("blocks requests over the limit using the key TTL", async () => {
    stubRedis(6, 12_000);
    const result = await rateLimit("k", 5, 60_000);
    expect(result).toEqual({ ok: false, remaining: 0, retryAfterMs: 12_000 });
  });

  it("falls back to memory when redis fails", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.com");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "tok");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await rateLimit(`fb:${Math.random()}`, 1, 60_000);
    expect(result.ok).toBe(true);
  });
});
