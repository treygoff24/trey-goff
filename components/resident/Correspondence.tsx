'use client'

import { FormEvent, useState } from 'react'

interface Letter {
  id: number
  role: 'resident' | 'visitor'
  text: string
}

const TURN_LIMIT = 10

export function Correspondence() {
  const [letters, setLetters] = useState<Letter[]>([])
  const [message, setMessage] = useState('')
  const [conversationId, setConversationId] = useState<string>()
  const [turn, setTurn] = useState(0)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<string>()
  const [away, setAway] = useState(false)

  const closed = away || turn >= TURN_LIMIT

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = message.trim()
    if (!text || sending || closed) return

    const visitorId = Date.now()
    const residentId = visitorId + 1
    setLetters((current) => [
      ...current,
      { id: visitorId, role: 'visitor', text },
      { id: residentId, role: 'resident', text: '' },
    ])
    setMessage('')
    setNotice(undefined)
    setSending(true)
    let shouldGoDormant = false

    try {
      const response = await fetch('/api/resident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversationId }),
      })

      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => null)) as {
          code?: string
          error?: string
        } | null
        if (body?.code === 'conversation_unknown') {
          setConversationId(undefined)
          setTurn(0)
          setLetters((current) =>
            current.filter((letter) => letter.id !== visitorId && letter.id !== residentId),
          )
          setNotice('The room has reset between visits. Please send your letter once more.')
          return
        }
        shouldGoDormant = response.status === 503
        throw new Error(body?.error ?? 'The Resident is away. Its journal remains.')
      }

      setConversationId(response.headers.get('x-resident-conversation-id') ?? conversationId)
      setTurn(Number(response.headers.get('x-resident-turn') ?? turn + 1))

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let streamed = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const frames = buffer.split('\n\n')
        buffer = frames.pop() ?? ''

        for (const frame of frames) {
          const eventName = frame.match(/^event: (.+)$/m)?.[1]
          const dataLine = frame.match(/^data: (.+)$/m)?.[1]
          if (!dataLine) continue
          const data = JSON.parse(dataLine) as { text?: string; message?: string }

          if (eventName === 'delta' && data.text) {
            streamed += data.text
            setLetters((current) =>
              current.map((letter) =>
                letter.id === residentId ? { ...letter, text: streamed } : letter,
              ),
            )
          } else if (eventName === 'message' && !streamed && data.text) {
            streamed = data.text
            setLetters((current) =>
              current.map((letter) =>
                letter.id === residentId ? { ...letter, text: streamed } : letter,
              ),
            )
          } else if (eventName === 'error') {
            shouldGoDormant = true
            throw new Error(data.message ?? 'The Resident is away. Its journal remains.')
          }
        }
      }

      if (!streamed) {
        shouldGoDormant = true
        throw new Error('The Resident is away. Its journal remains.')
      }
    } catch (error) {
      setLetters((current) => current.filter((letter) => letter.id !== residentId))
      if (shouldGoDormant || error instanceof TypeError) setAway(true)
      setNotice(
        error instanceof Error ? error.message : 'The Resident is away. Its journal remains.',
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="tg-section" aria-labelledby="correspondence-heading">
      <div className="mb-10 grid gap-5 md:grid-cols-[0.7fr_1.3fr] md:gap-14">
        <h2
          id="correspondence-heading"
          className="font-newsreader text-4xl font-medium leading-tight text-text-1"
        >
          Correspondence
        </h2>
        <div className="space-y-3 text-text-2">
          <p>Say hello, ask a question, or leave a thought.</p>
          <p className="text-sm leading-6">
            Conversations are ephemeral. The Resident&apos;s lasting memory is its journal, which it
            writes on its own schedule. Visitor letters cannot write to it.
          </p>
        </div>
      </div>

      {letters.length > 0 && (
        <div className="border-t border-border-2" aria-live="polite" aria-label="Correspondence">
          {letters.map((letter) => (
            <article
              key={letter.id}
              className="grid gap-3 border-b border-border-1 py-7 sm:grid-cols-[8rem_1fr] sm:gap-8"
            >
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-warm">
                {letter.role === 'visitor' ? 'Visitor' : 'Resident'}
              </p>
              <p className="max-w-2xl whitespace-pre-wrap leading-7 text-text-1">
                {letter.text || 'Reading your note...'}
              </p>
            </article>
          ))}
        </div>
      )}

      {notice && (
        <p role="status" className="border-y border-border-1 py-5 text-text-2">
          {notice}
        </p>
      )}

      {away ? (
        <p className="border-y border-border-1 py-6 font-newsreader text-2xl text-text-1">
          The Resident is away. Its journal remains.
        </p>
      ) : closed ? (
        <p className="border-y border-border-1 py-6 font-newsreader text-2xl text-text-1">
          Ten exchanges is enough for one visit. Thank you for the correspondence.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-10">
          <label
            htmlFor="resident-message"
            className="font-mono text-xs uppercase tracking-[0.16em] text-text-2"
          >
            Your letter
          </label>
          <textarea
            id="resident-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={1000}
            rows={4}
            disabled={sending}
            placeholder="Say hello, ask a question, leave a thought"
            className="mt-3 block w-full resize-y border border-border-1 bg-surface-1 px-4 py-3 leading-7 text-text-1 outline-none transition-colors placeholder:text-text-3 focus:border-warm focus:ring-2 focus:ring-warm/30 disabled:cursor-wait disabled:opacity-60"
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-3">
              {message.length}/1000 · {turn}/{TURN_LIMIT} exchanges
            </p>
            <button type="submit" className="tg-action" disabled={sending || !message.trim()}>
              {sending ? 'Await reply' : 'Send letter'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
