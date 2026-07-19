'use client'

import { parsePartialJson } from 'ai'
import Link from 'next/link'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { EditorialIndexRow } from '@/components/site/EditorialIndexRow'
import { EditionProse } from '@/components/edition/EditionProse'
import {
  EDITION_KIND_LABELS,
  resolveCatalogItem,
  resolveEditionSections,
  sanitizeModelText,
  type EditionClientCatalogItem,
} from '@/lib/edition/catalog'
import { editionSchema } from '@/lib/edition/schema'

const STARTING_POINTS = [
  'Writing about Próspera',
  'Evaluating the engineering',
  'Policy & governance work',
  'Just curious',
]

type EditionStatus = 'idle' | 'streaming' | 'complete' | 'rate-limited' | 'error'

interface PartialEdition {
  intent?: unknown
  opening?: unknown
  sections?: unknown
  closing?: unknown
}

interface EditionExperienceProps {
  catalog: readonly EditionClientCatalogItem[]
}

function asPartialEdition(value: unknown): PartialEdition | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as PartialEdition)
    : undefined
}

function FallbackPaths({ catalog }: EditionExperienceProps) {
  const paths = [
    ['essays', 'writing'],
    ['projects', 'projects'],
    ['library', 'library'],
    ['about', 'about'],
  ] as const

  return (
    <div className="mt-8 border-t border-border-2">
      {paths.flatMap(([kind, slug]) => {
        const item = resolveCatalogItem(catalog, kind, slug)
        return item ? (
          <EditorialIndexRow
            key={`${kind}:${slug}`}
            href={item.href}
            meta={item.meta}
            title={item.title}
            description={item.summary}
          />
        ) : (
          []
        )
      })}
    </div>
  )
}

function LiveStatus({ status, retryAfter }: { status: EditionStatus; retryAfter: string | null }) {
  const message =
    status === 'rate-limited'
      ? `The Edition needs a little time before another sitting.${retryAfter ? ` Try again in about ${retryAfter} seconds.` : ''}`
      : ''

  return (
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </p>
  )
}

export function EditionExperience({ catalog }: EditionExperienceProps) {
  const [answer, setAnswer] = useState('')
  const [submittedIntent, setSubmittedIntent] = useState('')
  const [composition, setComposition] = useState<PartialEdition>({})
  const [status, setStatus] = useState<EditionStatus>('idle')
  const [composedAt, setComposedAt] = useState('')
  const [retryAfter, setRetryAfter] = useState<string | null>(null)
  const intentRef = useRef<HTMLHeadingElement>(null)
  const rateLimitHeadingRef = useRef<HTMLHeadingElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => abortControllerRef.current?.abort()
  }, [])

  useEffect(() => {
    if (status === 'rate-limited') {
      requestAnimationFrame(() => rateLimitHeadingRef.current?.focus())
    }
  }, [status])

  const sections = resolveEditionSections(catalog, composition.sections)
  const displayedIntent =
    sanitizeModelText(composition.intent, 140) || `You came looking for ${submittedIntent}.`
  const footerIntent = displayedIntent.replace(/^you\s+/i, '').replace(/[.!?…]+$/u, '')

  async function compose(intent: string) {
    const trimmed = intent.trim()
    if (!trimmed) return
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setSubmittedIntent(trimmed)
    setComposition({})
    setStatus('streaming')
    setComposedAt('')
    setRetryAfter(null)
    requestAnimationFrame(() => intentRef.current?.focus())

    try {
      const response = await fetch('/api/edition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: trimmed }),
        signal: controller.signal,
      })

      if (response.status === 429) {
        setRetryAfter(response.headers.get('Retry-After'))
        setStatus('rate-limited')
        return
      }
      if (!response.ok || !response.body) throw new Error('Edition request failed')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let text = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        const partial = await parsePartialJson(text)
        const partialComposition = asPartialEdition(partial.value)
        if (partialComposition) setComposition(partialComposition)
      }

      text += decoder.decode()
      const finalValue = await parsePartialJson(text)
      const parsed = editionSchema.safeParse(finalValue.value)
      if (!parsed.success) throw new Error('Edition response was incomplete')

      setComposition(parsed.data)
      setComposedAt(
        new Intl.DateTimeFormat('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }).format(new Date()),
      )
      setStatus('complete')
    } catch {
      if (!controller.signal.aborted) setStatus('error')
    } finally {
      if (abortControllerRef.current === controller) abortControllerRef.current = null
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void compose(answer)
  }

  function reset() {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setAnswer('')
    setSubmittedIntent('')
    setComposition({})
    setStatus('idle')
    setComposedAt('')
    setRetryAfter(null)
  }

  if (status === 'idle') {
    return (
      <>
        <LiveStatus status={status} retryAfter={retryAfter} />
        <div className="mx-auto flex min-h-[78svh] w-full max-w-4xl flex-col items-center justify-center px-6 pb-24 pt-40 text-center sm:pt-36">
          <header className="tg-rise w-full">
            <p className="tg-eyebrow text-warm">The Edition</p>
            <h1 className="mt-7 font-newsreader text-[clamp(3rem,7vw,5.4rem)] font-medium leading-[0.98] tracking-[-0.035em] text-text-1 text-balance">
              What brought you here?
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-base leading-7 text-text-2 sm:text-lg sm:leading-8">
              Tell me what you&apos;re looking for. I&apos;ll set the most useful pages on the desk.
            </p>
          </header>

          <div className="mt-12 w-full max-w-2xl border-y border-border-2 py-8">
            <div className="flex flex-wrap justify-center gap-3" aria-label="Suggested answers">
              {STARTING_POINTS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => void compose(item)}
                  className="min-h-11 rounded-full border border-border-1 bg-surface-1/50 px-4 py-2.5 text-sm text-text-1 transition-colors hover:border-warm hover:text-warm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-warm"
                >
                  {item}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="mx-auto mt-7 max-w-xl text-left">
              <label
                htmlFor="edition-intent"
                className="font-mono text-xs uppercase tracking-[0.16em] text-text-3"
              >
                Or say it your way
              </label>
              <div className="mt-3 flex gap-3 border-b border-border-2 pb-3 focus-within:border-warm">
                <input
                  id="edition-intent"
                  name="intent"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  maxLength={500}
                  autoComplete="off"
                  placeholder="I came to understand…"
                  className="min-w-0 flex-1 bg-transparent py-2 text-base text-text-1 outline-none placeholder:text-text-3"
                />
                <button type="submit" className="tg-action shrink-0" disabled={!answer.trim()}>
                  Compose →
                </button>
              </div>
            </form>
          </div>

          <p className="mt-7 max-w-lg text-sm leading-6 text-text-2">
            Composed live from what&apos;s actually on this site, by a language model. ~15 seconds.
          </p>
          <Link
            href="/writing"
            className="mt-4 font-mono text-xs uppercase tracking-[0.14em] text-warm"
          >
            Or browse the usual way →
          </Link>
        </div>
      </>
    )
  }

  if (status === 'rate-limited') {
    return (
      <>
        <LiveStatus status={status} retryAfter={retryAfter} />
        <section className="tg-page max-w-4xl">
          <p className="tg-eyebrow text-warm">The Edition</p>
          <h1
            ref={rateLimitHeadingRef}
            tabIndex={-1}
            className="mt-6 font-newsreader text-[clamp(2.7rem,6vw,4.5rem)] leading-tight text-text-1 outline-none"
          >
            The composing room is full for a little while.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-text-2">
            The Edition needs a little time before another sitting. Nothing else is closed; the
            usual paths are waiting below.
          </p>
          {retryAfter && (
            <p className="mt-3 text-sm text-text-2">Try again in about {retryAfter} seconds.</p>
          )}
          <FallbackPaths catalog={catalog} />
          <button type="button" onClick={reset} className="tg-action-secondary mt-8">
            Try again later
          </button>
        </section>
      </>
    )
  }

  const progress = status === 'complete' ? 100 : Math.min(88, 14 + sections.length * 20)

  return (
    <>
      <LiveStatus status={status} retryAfter={retryAfter} />
      <section className="tg-page max-w-5xl">
        <header className="border-b border-border-2 pb-10">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-warm">Your edition</p>
          <h1
            ref={intentRef}
            tabIndex={-1}
            className="mt-5 max-w-3xl font-newsreader text-[clamp(1.9rem,4.5vw,3.4rem)] leading-tight text-text-1 outline-none"
          >
            {displayedIntent}
          </h1>
          <div className="mt-8 h-px overflow-hidden bg-border-1" aria-hidden="true">
            <div
              className="h-full bg-warm transition-[width] duration-700 ease-out motion-reduce:transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>

        {sanitizeModelText(composition.opening, 500) && (
          <EditionProse
            text={composition.opening}
            maxLength={500}
            className="tg-rise my-14 max-w-3xl font-newsreader text-[clamp(1.5rem,3vw,2.2rem)] leading-[1.45] text-text-1"
          />
        )}

        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {sections.length > 0
            ? `${sections.length} edition section${sections.length === 1 ? '' : 's'} set.`
            : 'Composing your edition.'}
        </div>

        <div>
          {sections.map((section, index) => (
            <section
              key={`${section.kind}:${index}`}
              className="tg-rise border-t border-border-2 py-10"
            >
              <div className="mb-6 grid gap-3 md:grid-cols-[minmax(8rem,0.3fr)_1fr] md:gap-10">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-warm">
                  {EDITION_KIND_LABELS[section.kind]}
                </p>
                {section.lede && (
                  <EditionProse
                    text={section.lede}
                    maxLength={200}
                    className="max-w-2xl leading-7 text-text-2"
                  />
                )}
              </div>
              <div>
                {section.items.map((item) => (
                  <EditorialIndexRow
                    key={`${item.type}:${item.slug}`}
                    href={item.href}
                    meta={item.meta}
                    title={item.title}
                    description={item.summary}
                    tags={item.tags}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {status === 'streaming' && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border-1 py-8">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-2">
              Setting the next section…
            </p>
            <button type="button" onClick={reset} className="tg-action-secondary">
              Compose again
            </button>
          </div>
        )}

        {status === 'error' && (
          <section className="border-t border-border-2 py-10">
            <p className="font-newsreader text-2xl text-text-1">
              The type slipped before the page was finished.
            </p>
            <p className="mt-3 max-w-2xl leading-7 text-text-2">
              I&apos;ve left every section that made it to the page. These four doors do not depend
              on the composing room.
            </p>
            <FallbackPaths catalog={catalog} />
          </section>
        )}

        {status === 'complete' && (
          <footer className="border-t border-border-2 py-12">
            {sanitizeModelText(composition.closing, 300) && (
              <EditionProse
                text={composition.closing}
                maxLength={300}
                className="mb-7 max-w-2xl leading-7 text-text-2"
              />
            )}
            <p className="max-w-3xl font-newsreader text-xl leading-8 text-text-1">
              Composed {composedAt} for a visitor who {footerIntent}. Everything above is real:
              every link, every essay.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={reset} className="tg-action">
                Compose again
              </button>
              <Link href="/writing" className="tg-action-secondary">
                Browse the usual way →
              </Link>
            </div>
          </footer>
        )}
      </section>
    </>
  )
}
