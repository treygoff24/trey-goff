import { NextRequest, NextResponse } from 'next/server'
import { isResidentEnabled } from '@/lib/site-config'
import { createRateLimiter } from '@/lib/rate-limit'
import { getTrustedClientIp, isJsonContentType } from '@/lib/subscribe-request'
import { ConversationStore } from '@/lib/resident/conversations'
import { isSameOrigin, parseResidentRequest } from '@/lib/resident/request'
import { streamEveAsSse } from '@/lib/resident/sse'

export const dynamic = 'force-dynamic'

// Best-effort abuse damping only: conversations and counters are per serverless
// instance. A cold start or a different instance forgets a conversation; the client
// starts a fresh one. The hard spend boundary is the Gateway budget plus the feature flag.
const conversationRateLimit = createRateLimiter({ maxRequests: 6, windowMs: 60 * 60 * 1000 })
const conversations = new ConversationStore()

const errors = {
  busy: ['This conversation is already answering.', 409],
  capacity: ['The Resident has too many letters open just now. Please try again shortly.', 503],
  closed: ['Ten exchanges is enough for one visit. Thank you for the correspondence.', 409],
  unknown: ['This conversation has expired. Refresh the page to begin another.', 400],
} as const

export async function POST(request: NextRequest) {
  if (!isResidentEnabled) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!isSameOrigin(request.headers.get('origin'), request.url)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }
  if (!isJsonContentType(request)) {
    return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 })
  }

  const parsed = await parseResidentRequest(request)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status })

  const { message, conversationId: requestedId } = parsed.value
  if (!requestedId) {
    const limited = conversationRateLimit.check(getTrustedClientIp(request))
    if (!limited.allowed) {
      return NextResponse.json(
        { error: 'Six new conversations an hour is the limit. Please come back later.' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfter ?? 3600) } },
      )
    }
  }

  const turn = conversations.begin(requestedId)
  if (!turn.ok) {
    const [error, status] = errors[turn.reason]
    return NextResponse.json({ error, code: `conversation_${turn.reason}` }, { status })
  }

  const agentUrl = process.env.RESIDENT_AGENT_URL
  const secret = process.env.RESIDENT_AGENT_SECRET
  if (!agentUrl || !secret) {
    conversations.finish(turn.conversationId)
    return NextResponse.json(
      { error: 'The Resident is away. Its journal remains.' },
      { status: 503 },
    )
  }

  try {
    const abort = new AbortController()
    const timeToFirstByte = setTimeout(() => abort.abort(), 20_000)
    let upstream: Response
    try {
      upstream = await fetch(new URL('/resident/chat', agentUrl), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationId: turn.conversationId,
          startIndex: turn.eventCursor,
        }),
        cache: 'no-store',
        signal: abort.signal,
      })
    } finally {
      clearTimeout(timeToFirstByte)
    }

    if (!upstream.ok || !upstream.body) {
      conversations.finish(turn.conversationId)
      return NextResponse.json(
        { error: 'The Resident is away. Its journal remains.' },
        { status: 503 },
      )
    }

    return new Response(
      streamEveAsSse(
        upstream.body,
        turn.eventCursor,
        (cursor) => conversations.finish(turn.conversationId, cursor),
        { idleTimeoutMs: 60_000 },
      ),
      {
        headers: {
          'Cache-Control': 'no-store, no-transform',
          'Content-Type': 'text/event-stream; charset=utf-8',
          'X-Accel-Buffering': 'no',
          'X-Resident-Conversation-Id': turn.conversationId,
          'X-Resident-Turn': String(turn.turn),
        },
      },
    )
  } catch {
    conversations.finish(turn.conversationId)
    return NextResponse.json(
      { error: 'The Resident is away. Its journal remains.' },
      { status: 503 },
    )
  }
}
