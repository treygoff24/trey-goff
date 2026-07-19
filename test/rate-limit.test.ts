import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createRateLimiter } from '../lib/rate-limit'

describe('createRateLimiter', () => {
  it('allows up to maxRequests within a window, then blocks with retryAfter', () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 })
    assert.ok(limiter.check('a').allowed)
    assert.ok(limiter.check('a').allowed)
    assert.ok(limiter.check('a').allowed)
    const blocked = limiter.check('a')
    assert.strictEqual(blocked.allowed, false)
    assert.ok(blocked.retryAfter !== undefined && blocked.retryAfter > 0)
  })

  it('tracks keys independently', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 })
    assert.ok(limiter.check('a').allowed)
    assert.ok(limiter.check('b').allowed)
    assert.strictEqual(limiter.check('a').allowed, false)
  })

  it('enforces the daily cap across all keys', () => {
    const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000, dailyCap: 2 })
    assert.ok(limiter.check('a').allowed)
    assert.ok(limiter.check('b').allowed)
    const capped = limiter.check('c')
    assert.strictEqual(capped.allowed, false)
    assert.ok(capped.retryAfter !== undefined && capped.retryAfter > 0)
  })

  it('separate limiter instances do not share state', () => {
    const one = createRateLimiter({ maxRequests: 1, windowMs: 60_000 })
    const two = createRateLimiter({ maxRequests: 1, windowMs: 60_000 })
    assert.ok(one.check('a').allowed)
    assert.ok(two.check('a').allowed)
  })
})
