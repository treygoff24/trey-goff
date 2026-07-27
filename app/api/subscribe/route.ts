import { NextRequest, NextResponse } from 'next/server'
import { createRateLimiter } from '@/lib/rate-limit'
import { isNewsletterEnabled } from '@/lib/site-config'
import {
  getTrustedClientIp,
  isJsonContentType,
  parseSubscribePostBody,
  SUBSCRIBE_MAX_BODY_BYTES,
} from '@/lib/subscribe-request'

const BUTTONDOWN_API_KEY = process.env.BUTTONDOWN_API_KEY

interface ButtondownError {
  detail?: string
  email?: string[]
}

type LimitedBodyReadResult =
  | { ok: true; body: string }
  | { ok: false; status: number; error: string }

const subscribeRateLimit = createRateLimiter({ maxRequests: 5, windowMs: 60000 })

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
    const rateLimit = subscribeRateLimit.check(clientIP)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter),
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
