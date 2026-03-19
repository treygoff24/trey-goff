import type { NextRequest } from 'next/server'

export const SUBSCRIBE_MAX_BODY_BYTES = 4096

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

export const MAX_EMAIL_LENGTH = 320

/**
 * Prefer platform-provided client IP on Vercel, then fall back conservatively.
 */
export function getTrustedClientIp(request: NextRequest): string {
  const vercelForwarded = request.headers.get('x-vercel-forwarded-for')
  if (vercelForwarded) {
    const ip = vercelForwarded.split(',')[0]?.trim()
    if (ip) return ip
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp?.trim()) return realIp.trim()

  const xff = request.headers.get('x-forwarded-for')
  if (xff) {
    const ip = xff.split(',')[0]?.trim()
    if (ip) return ip
  }

  return 'unknown'
}

export function isJsonContentType(request: NextRequest): boolean {
  const ct = request.headers.get('content-type')
  if (!ct) return false
  const base = ct.split(';')[0]?.trim().toLowerCase()
  return base === 'application/json'
}

export type ParseSubscribeBodyResult =
  | { ok: true; email: string }
  | { ok: false; status: number; error: string }

export function parseSubscribePostBody(rawBody: string): ParseSubscribeBodyResult {
  if (rawBody.length > SUBSCRIBE_MAX_BODY_BYTES) {
    return { ok: false, status: 413, error: 'Request body too large' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawBody) as unknown
  } catch {
    return { ok: false, status: 400, error: 'Invalid JSON' }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, status: 400, error: 'Invalid request body' }
  }

  const email = (parsed as { email?: unknown }).email

  if (!email || typeof email !== 'string') {
    return { ok: false, status: 400, error: 'Email is required' }
  }

  if (email.length > MAX_EMAIL_LENGTH) {
    return { ok: false, status: 400, error: 'Email address is too long' }
  }

  if (!EMAIL_REGEX.test(email)) {
    return { ok: false, status: 400, error: 'Invalid email format' }
  }

  return { ok: true, email }
}
