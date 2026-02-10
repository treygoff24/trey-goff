import { NextRequest, NextResponse } from 'next/server'

const BUTTONDOWN_API_KEY = process.env.BUTTONDOWN_API_KEY
const MAX_EMAIL_LENGTH = 320
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

// WARNING: In-memory rate limiting is best-effort only. This Map resets on
// serverless cold starts and is not shared across instances. For production-grade
// protection, use distributed rate limiting (e.g. Upstash/Redis).
const rateLimitMap = new Map<string, RateLimitEntry>()

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
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

setInterval(() => {
  const now = Date.now()
  const entries = Array.from(rateLimitMap.entries())
  for (const [ip, entry] of entries) {
    if (now >= entry.resetAt) {
      rateLimitMap.delete(ip)
    }
  }
}, RATE_LIMIT_WINDOW_MS)

export async function POST(request: NextRequest) {
  // Validate API key exists
  if (!BUTTONDOWN_API_KEY) {
    console.error('BUTTONDOWN_API_KEY not configured')
    return NextResponse.json(
      { error: 'Newsletter service not configured' },
      { status: 500 }
    )
  }

  try {
    const clientIP = getClientIP(request)
    const rateLimit = checkRateLimit(clientIP)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter || 60),
          },
        }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (email.length > MAX_EMAIL_LENGTH) {
      return NextResponse.json(
        { error: 'Email address is too long' },
        { status: 400 }
      )
    }

    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Call Buttondown API
    const response = await fetch(
      'https://api.buttondown.email/v1/subscribers',
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${BUTTONDOWN_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          tags: ['website'],
        }),
      }
    )

    if (response.status === 201) {
      return NextResponse.json(
        { message: 'Success! Check your inbox to confirm.' },
        { status: 200 }
      )
    }

    if (response.status === 400) {
      const errorData: ButtondownError = await response.json()

      if (errorData.email?.some((e) => e.includes('already subscribed'))) {
        return NextResponse.json(
          { message: 'Success! Check your inbox to confirm.' },
          { status: 200 }
        )
      }

      return NextResponse.json(
        { error: 'Unable to process subscription. Please try again.' },
        { status: 400 }
      )
    }

    if (response.status === 429) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Unable to process subscription. Please try again.' },
      { status: 500 }
    )
  } catch (error) {
    console.error('Subscribe error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Unable to process subscription. Please try again.' },
      { status: 500 }
    )
  }
}
