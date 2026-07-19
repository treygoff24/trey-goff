import { randomUUID } from 'node:crypto'

interface Conversation {
  active: boolean
  eventCursor: number
  expiresAt: number
  lastInactiveAt: number
  turns: number
}

interface ConversationStoreOptions {
  maxConcurrentStreams?: number
  maxEntries?: number
  maxTurns?: number
  ttlMs?: number
  now?: () => number
}

export type BeginConversationResult =
  | { ok: true; conversationId: string; eventCursor: number; turn: number; isNew: boolean }
  | { ok: false; reason: 'busy' | 'closed' | 'capacity' | 'unknown' }

export class ConversationStore {
  private readonly conversations = new Map<string, Conversation>()
  private activeStreams = 0
  private readonly maxConcurrentStreams: number
  private readonly maxEntries: number
  private readonly maxTurns: number
  private readonly ttlMs: number
  private readonly now: () => number

  constructor(options: ConversationStoreOptions = {}) {
    this.maxConcurrentStreams = options.maxConcurrentStreams ?? 8
    this.maxEntries = options.maxEntries ?? 256
    this.maxTurns = options.maxTurns ?? 10
    this.ttlMs = options.ttlMs ?? 4 * 60 * 60 * 1000
    this.now = options.now ?? Date.now
  }

  begin(requestedId?: string): BeginConversationResult {
    this.prune()
    if (this.activeStreams >= this.maxConcurrentStreams) {
      return { ok: false, reason: 'capacity' }
    }

    const conversationId = requestedId ?? randomUUID()
    const existing = this.conversations.get(conversationId)
    if (requestedId && !existing) return { ok: false, reason: 'unknown' }
    if (!existing && !this.makeRoom()) return { ok: false, reason: 'capacity' }

    const conversation = existing ?? {
      active: false,
      eventCursor: 0,
      expiresAt: this.now() + this.ttlMs,
      lastInactiveAt: this.now(),
      turns: 0,
    }

    if (conversation.active) return { ok: false, reason: 'busy' }
    if (conversation.turns >= this.maxTurns) return { ok: false, reason: 'closed' }

    conversation.active = true
    conversation.turns += 1
    conversation.expiresAt = this.now() + this.ttlMs
    this.activeStreams += 1
    this.conversations.set(conversationId, conversation)

    return {
      ok: true,
      conversationId,
      eventCursor: conversation.eventCursor,
      turn: conversation.turns,
      isNew: !existing,
    }
  }

  finish(conversationId: string, eventCursor?: number): void {
    const conversation = this.conversations.get(conversationId)
    if (!conversation?.active) return
    conversation.active = false
    conversation.expiresAt = this.now() + this.ttlMs
    conversation.lastInactiveAt = this.now()
    if (eventCursor !== undefined) conversation.eventCursor = eventCursor
    this.activeStreams -= 1
  }

  private prune(): void {
    const now = this.now()
    for (const [id, conversation] of this.conversations) {
      if (!conversation.active && conversation.expiresAt <= now) this.conversations.delete(id)
    }
  }

  private makeRoom(): boolean {
    if (this.conversations.size < this.maxEntries) return true

    let oldest: [string, Conversation] | undefined
    for (const entry of this.conversations) {
      if (!entry[1].active && (!oldest || entry[1].lastInactiveAt < oldest[1].lastInactiveAt)) {
        oldest = entry
      }
    }
    if (!oldest) return false
    this.conversations.delete(oldest[0])
    return true
  }
}
