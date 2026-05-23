/**
 * 简易 in-memory IP rate limit。
 * - 每 IP 每分钟 ≤ 3 次
 * - 每 IP 每天 ≤ 30 次
 *
 * 局限：
 *  - 单实例计数。Vercel serverless 多实例时各自独立，意味着每个实例放 3/min。
 *    对低流量作品集场景足够；要严格限流请改用 Upstash Redis：
 *      import { Ratelimit } from "@upstash/ratelimit";
 *      import { Redis } from "@upstash/redis";
 *      const minute = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(3, "60 s") });
 *      const day    = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(30, "24 h") });
 */

type Bucket = { count: number; resetAt: number };

const minuteBuckets = new Map<string, Bucket>();
const dayBuckets = new Map<string, Bucket>();

const MINUTE_LIMIT = 3;
const DAY_LIMIT = 30;
const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * 60_000;

function check(buckets: Map<string, Bucket>, ip: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || b.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (b.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: b.resetAt };
  }
  b.count++;
  return { allowed: true, remaining: limit - b.count, resetAt: b.resetAt };
}

/** 偶尔清理过期 key，避免内存无限增长 */
function gc() {
  const now = Date.now();
  for (const m of [minuteBuckets, dayBuckets]) {
    for (const [k, v] of m) if (v.resetAt < now) m.delete(k);
  }
}

export type LimitResult = {
  ok: boolean;
  scope?: "minute" | "day";
  retryInSec?: number;
  remaining?: { minute: number; day: number };
};

export function limit(ip: string): LimitResult {
  if (Math.random() < 0.02) gc(); // 2% 概率清理

  const min = check(minuteBuckets, ip, MINUTE_LIMIT, MINUTE_MS);
  if (!min.allowed) {
    return {
      ok: false,
      scope: "minute",
      retryInSec: Math.ceil((min.resetAt - Date.now()) / 1000),
    };
  }
  const day = check(dayBuckets, ip, DAY_LIMIT, DAY_MS);
  if (!day.allowed) {
    // 回滚刚才加的分钟计数，避免双扣
    const mb = minuteBuckets.get(ip);
    if (mb) mb.count = Math.max(0, mb.count - 1);
    return {
      ok: false,
      scope: "day",
      retryInSec: Math.ceil((day.resetAt - Date.now()) / 1000),
    };
  }
  return {
    ok: true,
    remaining: { minute: min.remaining, day: day.remaining },
  };
}

export function getClientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    "unknown"
  );
}
