import { headers } from "next/headers";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
};

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, retryAfterMs: 0 };
}

/**
 * Fixed-window rate limit via the Upstash Redis REST API, shared across
 * instances. INCR + PEXPIRE NX sets the window on the first hit only.
 */
async function redisRateLimit(
  url: string,
  token: string,
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const redisKey = `ratelimit:${key}`;
  const response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", redisKey],
      ["PEXPIRE", redisKey, windowMs, "NX"],
      ["PTTL", redisKey],
    ]),
    signal: AbortSignal.timeout(2_000),
  });
  if (!response.ok) throw new Error(`Redis responded with ${response.status}`);

  const results = (await response.json()) as Array<{ result?: number }>;
  const count = Number(results[0]?.result ?? 0);
  const ttl = Number(results[2]?.result ?? windowMs);

  if (count > limit) {
    return { ok: false, remaining: 0, retryAfterMs: ttl > 0 ? ttl : windowMs };
  }
  return { ok: true, remaining: limit - count, retryAfterMs: 0 };
}

/**
 * Fixed-window rate limiter. Uses Upstash Redis when UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are set (shared across instances/serverless);
 * otherwise, or if Redis is unreachable, falls back to a per-instance
 * in-memory limiter.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      return await redisRateLimit(url, token, key, limit, windowMs);
    } catch (error) {
      console.error("Redis rate limiter failed; using in-memory fallback", error);
    }
  }
  return memoryRateLimit(key, limit, windowMs);
}

export async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headerList.get("x-real-ip") ?? "unknown";
}
