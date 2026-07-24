import { gateway, Output, streamText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { editionCatalog } from '@/lib/edition/manifest'
import {
  buildEditionSystemPrompt,
  buildEditionUserPrompt,
  EDITION_MODEL,
} from '@/lib/edition/prompt'
import { EDITION_MAX_BODY_BYTES, parseEditionRequestBody } from '@/lib/edition/request'
import { editionSchema } from '@/lib/edition/schema'
import { createRateLimiter } from '@/lib/rate-limit'
import { isEditionEnabled } from '@/lib/site-config'
import { getTrustedClientIp, isJsonContentType } from '@/lib/subscribe-request'

export const maxDuration = 30

// Best-effort abuse damping only. Serverless instances do not share this state;
// the hard spend boundary is the Gateway budget plus the production-off flag.
const editionRateLimit = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 60 * 1000,
  dailyCap: 200,
})

async function readBodyWithLimit(
  request: NextRequest,
): Promise<{ ok: true; body: string } | { ok: false }> {
  if (!request.body) return { ok: true, body: '' }

  const reader = request.body.getReader()
  const decoder = new TextDecoder()
  let bytes = 0
  let body = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    bytes += value.byteLength
    if (bytes > EDITION_MAX_BODY_BYTES) {
      await reader.cancel()
      return { ok: false }
    }
    body += decoder.decode(value, { stream: true })
  }

  return { ok: true, body: body + decoder.decode() }
}

export async function POST(request: NextRequest) {
  if (!isEditionEnabled) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!isJsonContentType(request)) {
    return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 })
  }

  const contentLength = request.headers.get('content-length')
  if (contentLength !== null && Number(contentLength) > EDITION_MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 })
  }

  const rawBody = await readBodyWithLimit(request)
  if (!rawBody.ok) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 })
  }

  const parsed = parseEditionRequestBody(rawBody.body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }

  try {
    const rateLimit = editionRateLimit.check(getTrustedClientIp(request))
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'The composing room needs a little time before another sitting.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfter || 60) },
        },
      )
    }

    const result = streamText({
      model: gateway(EDITION_MODEL),
      output: Output.object({ schema: editionSchema }),
      // The catalog makes the system prompt ~28k tokens, identical on every
      // request, so it dominates cost. Caching it cuts a compose from ~$0.15 to
      // ~$0.026 on a warm cache. Anthropic only accepts a cache breakpoint on a
      // system message part, which is why the system prompt moves into
      // `messages` here rather than staying on the `system` option.
      //
      // `allowSystemInMessages` is safe in this exact shape and nowhere else:
      // the system content is a server-built constant, and visitor input only
      // ever reaches the `user` message below, already JSON-wrapped and labeled
      // untrusted. Never interpolate request data into a system message.
      allowSystemInMessages: true,
      messages: [
        {
          role: 'system',
          content: buildEditionSystemPrompt(editionCatalog),
          // Default 5-minute TTL. A 1h TTL is available but costs a 2x write
          // multiplier against 1.25x, so it only wins above a ~53% hit rate
          // where 5m wins above ~22%. 5m is the safer bet until traffic says
          // otherwise: its worst case is a 23% premium, the 1h worst case 93%.
          providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } },
        },
        { role: 'user', content: buildEditionUserPrompt(parsed.intent) },
      ],
      // No temperature: Opus 4.8 does not accept one and the gateway warns and
      // drops it. Composition variety comes from the visitor's intent, not sampling.
      maxOutputTokens: 1800,
      maxRetries: 1,
      abortSignal: request.signal,
      onError: ({ error }) => {
        console.error(
          'Edition stream error:',
          error instanceof Error ? error.message : 'Unknown error',
        )
      },
    })

    return result.toTextStreamResponse({ headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Edition error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'The composing room went quiet. The usual paths are still open.' },
      { status: 502 },
    )
  }
}
