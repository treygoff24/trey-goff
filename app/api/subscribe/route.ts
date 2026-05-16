import { NextRequest, NextResponse } from 'next/server'
import { isNewsletterEnabled } from '@/lib/site-config'
import {
  getTrustedClientIp,
  isJsonContentType,
  parseSubscribePostBody,
  SUBSCRIBE_MAX_BODY_BYTES,
} from '@/lib/subscribe-request'

const BUTTONDOWN_API_KEY = process.env.BUTTONDOWN_API_KEY
const RATE_LIMIT_MAX_REQUESTS = 5
const RATE_LIMIT_WINDOW_MS = 60000

interface ButtondownError {
  detail?: string
  email?: string[]
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

type LimitedBodyReadResult =
  | { ok: true; body: string }
  | { ok: false; status: number; error: string }

// WARNING: In-memory rate limiting is best-effort only. This Map resets on
// serverless cold starts and is not shared across instances. For production-grade
// protection, use distributed rate limiting (e.g. Upstash/Redis).
const rateLimitMap = new Map<string, RateLimitEntry>()

function pruneExpiredRateLimits(now: number) {
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now >= entry.resetAt) {
      rateLimitMap.delete(ip)
    }
  }
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  pruneExpiredRateLimits(now)
  const entry = rateLimitMap.get(ip)

  if (entry && now >= entry.resetAt) {
    rateLimitMap.delete(ip)
  }

  const current = rateLimitMap.get(ip)
  if (!current) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true }
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000)
    return { allowed: false, retryAfter }
  }

  current.count++
  return { allowed: true }
}

async function readRequestBodyWithLimit(request: NextRequest): Promise<LimitedBodyReadResult> {
  if (!request.body) {
    return { ok: true, body: '' }
  }

  const reader = request.body.getReader()
  const decoder = new TextDecoder()
  let bytesRead = 0
  let body = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    bytesRead += value.byteLength
    if (bytesRead > SUBSCRIBE_MAX_BODY_BYTES) {
      return { ok: false, status: 413, error: 'Request body too large' }
    }

    body += decoder.decode(value, { stream: true })
  }

  body += decoder.decode()
  return { ok: true, body }
}

export async function POST(request: NextRequest) {
  if (!isNewsletterEnabled) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!BUTTONDOWN_API_KEY) {
    console.error('BUTTONDOWN_API_KEY not configured')
    return NextResponse.json({ error: 'Newsletter service not configured' }, { status: 500 })
  }

  if (!isJsonContentType(request)) {
    return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 })
  }

  const contentLength = request.headers.get('content-length')
  if (contentLength !== null && Number(contentLength) > SUBSCRIBE_MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 })
  }

  try {
    const clientIP = getTrustedClientIp(request)
    const rateLimit = checkRateLimit(clientIP)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter || 60),
          },
        },
      )
    }

    const rawBody = await readRequestBodyWithLimit(request)

    if (!rawBody.ok) {
      return NextResponse.json({ error: rawBody.error }, { status: rawBody.status })
    }

    const parsed = parseSubscribePostBody(rawBody.body)

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }

    const { email } = parsed

    const response = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Token ${BUTTONDOWN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        tags: ['website'],
      }),
    })

    if (response.status === 201) {
      return NextResponse.json(
        { message: 'Success! Check your inbox to confirm.' },
        { status: 200 },
      )
    }

    if (response.status === 400) {
      const errorData: ButtondownError = await response.json()

      if (errorData.email?.some((e) => e.includes('already subscribed'))) {
        return NextResponse.json(
          { message: 'Success! Check your inbox to confirm.' },
          { status: 200 },
        )
      }

      return NextResponse.json(
        { error: 'Unable to process subscription. Please try again.' },
        { status: 400 },
      )
    }

    if (response.status === 429) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      )
    }

    return NextResponse.json(
      { error: 'Unable to process subscription. Please try again.' },
      { status: 500 },
    )
  } catch (error) {
    console.error('Subscribe error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Unable to process subscription. Please try again.' },
      { status: 500 },
    )
  }
}
