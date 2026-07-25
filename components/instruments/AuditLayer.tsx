'use client'

import { useCallback, useMemo, useRef, type ReactNode } from 'react'
import { MARK_KINDS, type MarkKind } from '@/lib/instruments/types'
import { setAudit, useLedgerStore } from '@/components/instruments/ledger-store'
import { useAudit } from '@/components/instruments/AuditProvider'
import { AnnotationCard } from '@/components/instruments/MarginNotes'
import { attr, type InstrumentNodeProps } from '@/components/instruments/annotation-props'
import { INSTRUMENT_SENTINEL } from '@/components/instruments/sentinel'

/** What each kind of self-audit is called in the interface, and what it claims. */
const KIND_COPY: Record<MarkKind, { label: string; gloss: string }> = {
  killed: {
    label: 'Killed',
    gloss: 'A claim the piece went looking for and found false, left in and struck through.',
  },
  'his-read': {
    label: 'His read',
    gloss: 'An inference rather than a finding, marked as the author’s own reading.',
  },
  'counter-evidence': {
    label: 'Counter-evidence',
    gloss: 'Evidence that cuts against the piece’s own thesis, stated by the piece.',
  },
  refused: {
    label: 'Refused',
    gloss: 'Material the author declines to use, and the reason for declining it.',
  },
}

export function markKindColor(kind: MarkKind): string {
  return `var(--color-mark-${kind})`
}

/**
 * A marked passage. The mark is always in the markup — the audit is part of the document, not
 * a view of it — and the control decides how loudly it reads. A mark carrying a note gets a
 * marker beside it, which pins the note in the margin the same way a footnote does.
 */
export function MarkSpan(props: InstrumentNodeProps) {
  const { marks, lit, open, toggleNote, closeNote } = useAudit()
  const audit = useLedgerStore((state) => state.filters.audit)
  const id = attr(props, 'data-mark-id') ?? ''
  const kind = (attr(props, 'data-mark-kind') ?? 'killed') as MarkKind
  const last = attr(props, 'data-annotation-last') === 'true'
  const markerRef = useRef<HTMLButtonElement>(null)

  const mark = useMemo(() => marks.find((candidate) => candidate.id === id), [marks, id])
  const isOpen = open.has(id)

  const onClose = useCallback(() => {
    closeNote(id)
    markerRef.current?.focus()
  }, [closeNote, id])

  return (
    <mark
      className="instrument-mark"
      data-mark-id={id}
      data-mark-kind={kind}
      data-audit={audit ? 'on' : 'off'}
      data-lit={lit.has(kind) ? 'true' : 'false'}
      style={{ '--mark-color': markKindColor(kind) } as React.CSSProperties}
      data-instrument={INSTRUMENT_SENTINEL}
    >
      {props.children as ReactNode}
      {last && mark?.note && (
        <>
          <button
            ref={markerRef}
            type="button"
            id={`mark-${id}`}
            className="tg-mark-marker"
            aria-expanded={isOpen}
            aria-label={`${KIND_COPY[kind].label}: why this passage is marked`}
            onClick={() => toggleNote(id)}
          >
            <span aria-hidden="true">※</span>
          </button>
          {isOpen && (
            <AnnotationCard
              id={id}
              tone={markKindColor(kind)}
              kicker={KIND_COPY[kind].label}
              body={mark.note}
              marker={markerRef.current}
              onClose={onClose}
            />
          )}
        </>
      )}
    </mark>
  )
}

/**
 * The audit control. One switch lights every marked passage at once; the four kind chips then
 * raise one kind above the others without turning the rest off, because the reader who wants
 * only the counter-evidence still benefits from seeing how much else is marked around it.
 *
 * The master switch is the one part of this that is shareable: it lives in the query string as
 * `?audit=1`, so a link can hand someone the piece with its own audit already lit.
 */
export default function AuditLayer() {
  const { marks, lit, toggleKind, setAllKinds } = useAudit()
  const audit = useLedgerStore((state) => state.filters.audit)

  const counts = useMemo(() => {
    const tally = Object.fromEntries(MARK_KINDS.map((kind) => [kind, 0])) as Record<
      MarkKind,
      number
    >
    for (const mark of marks) tally[mark.kind] += 1
    return tally
  }, [marks])

  const present = MARK_KINDS.filter((kind) => counts[kind] > 0)

  const onToggleAll = useCallback(() => {
    const next = !audit
    setAudit(next)
    setAllKinds(false)
  }, [audit, setAllKinds])

  return (
    <section
      className="instrument-block tg-audit"
      aria-labelledby="audit-heading"
      data-instrument={INSTRUMENT_SENTINEL}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="audit-heading" className="tg-instrument-label">
          The self-audit
        </h2>
        <button
          type="button"
          className="tg-audit-switch"
          aria-pressed={audit}
          onClick={onToggleAll}
          data-on={audit ? 'true' : 'false'}
        >
          {audit ? 'Marks lit' : `Light all ${marks.length} marks`}
        </button>
      </div>

      <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-text-2">
        {marks.length} passages in this piece argue against it, qualify it, or record something the
        author looked for and did not find. They are marked in the prose either way; the switch
        decides how loudly.
      </p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {present.map((kind) => {
          const on = lit.has(kind)
          return (
            <li key={kind}>
              <button
                type="button"
                className="tg-audit-chip"
                aria-pressed={on}
                title={KIND_COPY[kind].gloss}
                onClick={() => {
                  if (!audit) setAudit(true)
                  toggleKind(kind)
                }}
                style={{ color: markKindColor(kind) }}
                data-on={on ? 'true' : 'false'}
              >
                <span aria-hidden="true" className="tg-audit-dot" />
                {KIND_COPY[kind].label}
                <span className="tg-audit-count">{counts[kind]}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {present.map((kind) => (
          <div key={kind}>
            <dt
              className="font-mono text-[11px] tracking-[0.14em] uppercase"
              style={{ color: markKindColor(kind) }}
            >
              {KIND_COPY[kind].label}
            </dt>
            <dd className="mt-1 text-sm leading-relaxed text-text-3">{KIND_COPY[kind].gloss}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
