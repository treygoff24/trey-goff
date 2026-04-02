import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  getTrustedClientIp,
  isJsonContentType,
  parseSubscribePostBody,
  SUBSCRIBE_MAX_BODY_BYTES,
} from '@/lib/subscribe-request'

describe('getTrustedClientIp', () => {
  function req(headers: Record<string, string>) {
    const lower = Object.fromEntries(
      Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
    )
    return {
      headers: { get: (k: string) => lower[k.toLowerCase()] ?? null },
    } as unknown as import('next/server').NextRequest
  }

  test('prefers x-vercel-forwarded-for', () => {
    assert.equal(
      getTrustedClientIp(
        req({
          'x-vercel-forwarded-for': '203.0.113.1',
          'x-forwarded-for': '7.7.7.7',
        }),
      ),
      '203.0.113.1',
    )
  })

  test('uses x-real-ip when Vercel header absent', () => {
    assert.equal(getTrustedClientIp(req({ 'x-real-ip': ' 198.51.100.2 ' })), '198.51.100.2')
  })

  test('falls back to first x-forwarded-for hop', () => {
    assert.equal(
      getTrustedClientIp(req({ 'x-forwarded-for': '198.51.100.3, 10.0.0.1' })),
      '198.51.100.3',
    )
  })

  test('returns unknown when no headers', () => {
    assert.equal(getTrustedClientIp(req({})), 'unknown')
  })
})

describe('isJsonContentType', () => {
  test('accepts application/json with charset', () => {
    const r = {
      headers: { get: () => 'application/json; charset=utf-8' },
    } as unknown as import('next/server').NextRequest
    assert.equal(isJsonContentType(r), true)
  })

  test('rejects text/plain', () => {
    const r = {
      headers: { get: () => 'text/plain' },
    } as unknown as import('next/server').NextRequest
    assert.equal(isJsonContentType(r), false)
  })

  test('rejects missing content-type', () => {
    const r = { headers: { get: () => null } } as unknown as import('next/server').NextRequest
    assert.equal(isJsonContentType(r), false)
  })
})

describe('parseSubscribePostBody', () => {
  test('rejects oversized body', () => {
    const big = 'a'.repeat(SUBSCRIBE_MAX_BODY_BYTES + 1)
    const r = parseSubscribePostBody(big)
    assert.equal(r.ok, false)
    if (!r.ok) assert.equal(r.status, 413)
  })

  test('rejects invalid JSON', () => {
    const r = parseSubscribePostBody('{')
    assert.equal(r.ok, false)
    if (!r.ok) assert.equal(r.status, 400)
  })

  test('accepts valid email', () => {
    const r = parseSubscribePostBody(JSON.stringify({ email: 'hi@example.com' }))
    assert.equal(r.ok, true)
    if (r.ok) assert.equal(r.email, 'hi@example.com')
  })
})
