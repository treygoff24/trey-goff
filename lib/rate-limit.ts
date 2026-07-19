// Shared in-memory rate limiter for API routes. Best-effort only: the Map
// resets on serverless cold starts and is not shared across instances. The
// hard spend boundary for AI routes is the Gateway budget cap plus feature
// flags that default off in production — this limiter is abuse damping.

interface WindowEntry {
  count: number
  resetAt: number
}

export interface RateLimiterConfig {
  /** Max requests per key per window. */
  maxRequests: number
  /** Window length in milliseconds. */
  windowMs: number
  /** Optional cap on total requests across all keys per UTC day. */
  dailyCap?: number
}

export interface RateLimitResult {
  allowed: boolean
  /** Seconds until the caller may retry; set when not allowed. */
  retryAfter?: number
}

export interface RateLimiter {
  check(key: string): RateLimitResult
}

const DAY_MS = 86_400_000

export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  const windows = new Map<string, WindowEntry>()
  let day = { start: 0, total: 0 }

  return {
    check(key: string): RateLimitResult {
      const now = Date.now()

      for (const [k, entry] of windows.entries()) {
        if (now >= entry.resetAt) windows.delete(k)
      }

      if (config.dailyCap !== undefined) {
        const dayStart = now - (now % DAY_MS)
        if (day.start !== dayStart) day = { start: dayStart, total: 0 }
        if (day.total >= config.dailyCap) {
          return { allowed: false, retryAfter: Math.ceil((dayStart + DAY_MS - now) / 1000) }
        }
      }

      const current = windows.get(key)
      if (!current) {
        windows.set(key, { count: 1, resetAt: now + config.windowMs })
        day.total++
        return { allowed: true }
      }

      if (current.count >= config.maxRequests) {
        return { allowed: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) }
      }

      current.count++
      day.total++
      return { allowed: true }
    },
  }
}
