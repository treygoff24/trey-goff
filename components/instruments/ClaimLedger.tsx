'use client'

import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useLedger } from '@/components/instruments/LedgerProvider'
import { Spectrum } from '@/components/instruments/Spectrum'
import { INSTRUMENT_SENTINEL } from '@/components/instruments/sentinel'
import {
  clearFilters,
  clearFlash,
  focusClaim,
  openDossier,
  setQuery,
  setRange,
  toggleVerdict,
  useLedgerStore,
} from '@/components/instruments/ledger-store'
import { isFiltered, matchesFilters } from '@/components/instruments/use-filtered-rows'
import type { ClaimType } from '@/lib/instruments/types'
import {
  LEDGER_STATES,
  emptyCounts,
  sectionAnchor,
  stateLabel,
  toSeconds,
  verdictColor,
  type LedgerRow,
} from '@/components/instruments/ledger-model'

/** Half-width of the window a timestamp button scopes to, in seconds. */
const STAMP_WINDOW = 450

const TYPE_LABELS: Record<ClaimType, string> = {
  A: 'Type A — person X said Y',
  B: 'Type B — document or event Z exists',
  C: 'Type C — direct assertion about the world',
  'A/B': 'Type A/B — said-Y and event-exists',
}

interface RowProps {
  row: LedgerRow
  hidden: boolean
  flashed: boolean
  hasDossier: boolean
  span: number
}

const ClaimRow = memo(function ClaimRow({ row, hidden, flashed, hasDossier, span }: RowProps) {
  const { claim, state } = row
  const color = verdictColor(state)

  return (
    <article
      id={claim.id}
      hidden={hidden}
      tabIndex={-1}
      data-flash={flashed ? 'true' : undefined}
      className="tg-claim grid gap-x-6 gap-y-2 border-t border-border-1 py-5 md:grid-cols-[6.5rem_minmax(0,1fr)_11rem]"
    >
      <div className="flex items-center gap-2 md:flex-col md:items-start md:gap-1">
        <span className="flex items-center gap-2 font-mono text-sm text-text-2">
          <span
            aria-hidden="true"
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          {claim.id}
        </span>
        <span className="font-mono text-[11px] text-text-3" title={TYPE_LABELS[claim.type]}>
          Type {claim.type}
        </span>
      </div>

      <div>
        <h4 className="font-newsreader text-lg leading-snug font-medium text-text-1">
          {claim.title}
        </h4>
        <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-text-2">{claim.claim}</p>
        <p className="mt-2 max-w-[68ch] text-sm leading-relaxed">
          <span className="font-mono text-xs tracking-[0.12em] uppercase" style={{ color }}>
            {claim.verdictLabel ?? 'unverified'}
          </span>
          {claim.rationale && <span className="ml-2 text-text-3">{claim.rationale}</span>}
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-x-3 gap-y-2 font-mono text-xs text-text-3 md:flex-col md:gap-y-1">
        <span>{claim.speakers.join(' · ')}</span>
        <span className="flex flex-wrap gap-2">
          {claim.timestamps.map((stamp) => (
            <button
              key={stamp}
              type="button"
              className="inline-flex min-h-6 items-center underline decoration-dotted underline-offset-4 hover:text-text-1"
              onClick={() => {
                const at = toSeconds(stamp)
                setRange([Math.max(0, at - STAMP_WINDOW), Math.min(span, at + STAMP_WINDOW)])
              }}
            >
              {stamp}
            </button>
          ))}
        </span>
        {claim.dossier && hasDossier ? (
          <button
            type="button"
            className="text-left underline decoration-dotted underline-offset-4"
            style={{ color: 'var(--instrument-accent)' }}
            onClick={() => openDossier(claim.dossier!)}
          >
            dossier: {claim.dossier.replace(/-/g, ' ')}
          </button>
        ) : (
          claim.finding && (
            <span title="Working file cited by this verdict; not published with the ledger">
              {claim.finding.replace(/^findings\//, '')}
            </span>
          )
        )}
      </div>
    </article>
  )
})

function VerdictChips() {
  const { model } = useLedger()
  const verdicts = useLedgerStore((state) => state.filters.verdicts)

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by verdict">
      {LEDGER_STATES.map((state) => {
        const on = verdicts.includes(state)
        return (
          <button
            key={state}
            type="button"
            aria-pressed={on}
            onClick={() => toggleVerdict(state)}
            className="flex items-center gap-2 rounded-xs border px-3 py-1.5 font-mono text-[11px] tracking-[0.1em] uppercase"
            style={{
              color: verdictColor(state),
              borderColor: on ? verdictColor(state) : 'var(--color-border-1)',
              backgroundColor: on ? 'var(--color-surface-2)' : 'transparent',
            }}
          >
            <span
              aria-hidden="true"
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: verdictColor(state) }}
            />
            {stateLabel(state)}
            <span className="text-text-3">{model.counts[state]}</span>
          </button>
        )
      })}
    </div>
  )
}

function SearchBox() {
  const query = useLedgerStore((state) => state.filters.query)
  const [draft, setDraft] = useState(query)

  // The store drives the input when state arrives from the URL; typing drives the store,
  // debounced, so a keystroke never re-runs the filter across all 434 rows.
  useEffect(() => setDraft(query), [query])
  useEffect(() => {
    if (draft === query) return
    const timer = setTimeout(() => setQuery(draft), 140)
    return () => clearTimeout(timer)
  }, [draft, query])

  return (
    <label className="block w-full">
      <span className="sr-only">Search the ledger</span>
      <input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Search claims, speakers, reasoning…"
        className="w-full rounded-xs border border-border-1 bg-surface-1 px-3 py-2 text-sm text-text-1 placeholder:text-text-3"
      />
    </label>
  )
}

export default function ClaimLedger() {
  const { model, dossiers } = useLedger()
  const filters = useLedgerStore((state) => state.filters)
  const flash = useLedgerStore((state) => state.flash)
  const hydrated = useLedgerStore((state) => state.hydrated)
  const routed = useRef<string | null>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const dossierSet = useMemo(() => new Set(dossiers), [dossiers])

  const visible = useMemo(
    () => new Set(model.rows.filter((row) => matchesFilters(row, filters)).map((r) => r.claim.id)),
    [model.rows, filters],
  )

  // Send the reader to whichever claim the URL or a cross-reference named, then let the
  // marking lapse so it does not follow them down the page.
  useEffect(() => {
    if (!flash) return
    const element = document.getElementById(flash)
    // A frame late on purpose: closing the dossier returns focus to whatever opened it, and
    // the reader should end up on the row they were sent to, not back inside a shut panel.
    const frame = requestAnimationFrame(() => {
      element?.focus({ preventScroll: true })
      element?.scrollIntoView({ block: 'start' })
    })
    const timer = setTimeout(clearFlash, 2000)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [flash])

  // A `?claim=` arriving from a shared link goes through the same reconciliation a
  // cross-reference does, so the row it names cannot be hidden by the link's own filters.
  useEffect(() => {
    if (!hydrated || !filters.claim || routed.current === filters.claim) return
    routed.current = filters.claim
    focusClaim(filters.claim, model.byId.get(filters.claim))
  }, [hydrated, filters.claim, model.byId])

  // The rows and section headings scroll clear of the pinned controls, so the offset has to be
  // whatever those controls currently measure — the bar grows a row when the chips wrap, and a
  // guessed constant lands the reader's claim underneath it.
  useEffect(() => {
    const bar = stickyRef.current
    const scope = sectionRef.current
    if (!bar || !scope) return

    const sync = () => {
      const top = Number.parseFloat(getComputedStyle(bar).top)
      if (Number.isFinite(top)) {
        scope.style.setProperty(
          '--instrument-sticky-offset',
          `${Math.round(top + bar.offsetHeight + 16)}px`,
        )
      } else {
        // Not pinned at this width; the stylesheet's own value covers the rail strip instead.
        scope.style.removeProperty('--instrument-sticky-offset')
      }
    }

    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(bar)
    window.addEventListener('resize', sync)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', sync)
    }
  }, [])

  const filtered = isFiltered(filters)

  return (
    <section
      ref={sectionRef}
      className="instrument-block not-prose"
      aria-labelledby="claim-ledger-heading"
      data-instrument={INSTRUMENT_SENTINEL}
    >
      <div className="mb-6">
        <Spectrum
          counts={model.counts}
          label={`The whole ledger: ${LEDGER_STATES.map((state) => `${model.counts[state]} ${stateLabel(state)}`).join(', ')}`}
        />
      </div>

      <div
        ref={stickyRef}
        className="z-10 -mx-4 mb-6 border-y border-border-1 bg-bg-0/95 px-4 py-3 backdrop-blur lg:sticky lg:top-24"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 id="claim-ledger-heading" className="tg-instrument-label">
            The ledger
          </h2>
          {filtered && (
            <button type="button" className="tg-action-secondary" onClick={clearFilters}>
              Clear
            </button>
          )}
          <div className="w-full sm:w-auto sm:flex-1">
            <SearchBox />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3">
          <VerdictChips />
          <p className="font-mono text-xs text-text-2" role="status" aria-live="polite">
            {filtered
              ? `${visible.size} of ${model.rows.length} claims`
              : `${model.rows.length} claims · ${model.worked} worked · ${model.rows.length - model.worked} still open`}
          </p>
        </div>
      </div>

      {model.sections.map((section) => {
        const shownRows = section.rows.filter((row) => visible.has(row.claim.id))
        const shown = shownRows.length
        // The mini-spectrum reports the rows actually on screen, so it can never disagree
        // with the "3 of 15" printed beside it.
        const counts = emptyCounts()
        for (const row of shownRows) counts[row.state] += 1
        return (
          <section
            key={section.id}
            id={sectionAnchor(section.id)}
            hidden={shown === 0}
            aria-labelledby={`${sectionAnchor(section.id)}-heading`}
            className="tg-ledger-section mt-10"
          >
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-border-2 pb-2">
              <h3
                id={`${sectionAnchor(section.id)}-heading`}
                className="flex items-baseline gap-3 font-newsreader text-xl font-medium text-text-1"
              >
                <span className="font-mono text-sm" style={{ color: 'var(--instrument-accent)' }}>
                  {section.id}
                </span>
                {section.title}
              </h3>
              <span className="flex items-center gap-3 font-mono text-xs text-text-3">
                <Spectrum
                  counts={counts}
                  mini
                  label={
                    filtered
                      ? `Verdict mix of the ${shown} visible claims in section ${section.id}`
                      : `Verdict mix for section ${section.id}`
                  }
                />
                {shown === section.rows.length
                  ? `${section.rows.length} claims`
                  : `${shown} of ${section.rows.length}`}
              </span>
            </div>

            {section.rows.map((row) => (
              <ClaimRow
                key={row.claim.id}
                row={row}
                hidden={!visible.has(row.claim.id)}
                flashed={flash === row.claim.id}
                hasDossier={row.claim.dossier !== null && dossierSet.has(row.claim.dossier)}
                span={model.span}
              />
            ))}
          </section>
        )
      })}

      {visible.size === 0 && (
        <p className="mt-10 border-t border-border-1 pt-6 text-sm text-text-2">
          Nothing in the ledger matches that.{' '}
          <button
            type="button"
            className="underline underline-offset-4"
            style={{ color: 'var(--instrument-accent)' }}
            onClick={clearFilters}
          >
            Clear the filters
          </button>
          .
        </p>
      )}
    </section>
  )
}
