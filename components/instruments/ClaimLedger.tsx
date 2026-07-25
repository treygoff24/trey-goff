'use client'

import { memo, useEffect, useMemo, useState } from 'react'
import { useLedger } from '@/components/instruments/LedgerProvider'
import { Spectrum } from '@/components/instruments/Spectrum'
import { INSTRUMENT_SENTINEL } from '@/components/instruments/sentinel'
import {
  clearFilters,
  clearFlash,
  openDossier,
  setQuery,
  setRange,
  toggleVerdict,
  useLedgerStore,
} from '@/components/instruments/ledger-store'
import { isFiltered, matchesFilters } from '@/components/instruments/use-filtered-rows'
import {
  LEDGER_STATES,
  sectionAnchor,
  stateLabel,
  toSeconds,
  verdictColor,
  type LedgerRow,
} from '@/components/instruments/ledger-model'

/** Half-width of the window a timestamp button scopes to, in seconds. */
const STAMP_WINDOW = 450

const TYPE_LABELS: Record<string, string> = {
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
        <p className="mt-2 text-sm leading-relaxed text-text-2">{claim.claim}</p>
        <p className="mt-2 text-sm leading-relaxed">
          <span className="font-mono text-xs tracking-[0.12em] uppercase" style={{ color }}>
            {claim.verdictLabel ?? 'not yet worked'}
          </span>
          {claim.rationale && <span className="ml-2 text-text-3">{claim.rationale}</span>}
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-x-3 gap-y-2 font-mono text-[11px] text-text-3 md:flex-col md:gap-y-1">
        <span>{claim.speakers.join(' · ')}</span>
        <span className="flex flex-wrap gap-2">
          {claim.timestamps.map((stamp) => (
            <button
              key={stamp}
              type="button"
              className="underline decoration-dotted underline-offset-4 hover:text-text-1"
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
    <label className="flex-1">
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
    element?.scrollIntoView({ block: 'center' })
    const timer = setTimeout(clearFlash, 2000)
    return () => clearTimeout(timer)
  }, [flash])

  useEffect(() => {
    if (!filters.claim || flash) return
    document.getElementById(filters.claim)?.scrollIntoView({ block: 'center' })
  }, [filters.claim, flash])

  const filtered = isFiltered(filters)

  return (
    <section
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

      <div className="z-10 -mx-4 mb-6 border-y border-border-1 bg-bg-0/95 px-4 py-3 backdrop-blur lg:sticky lg:top-24">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="claim-ledger-heading" className="tg-instrument-label">
            The ledger
          </h2>
          <SearchBox />
          {filtered && (
            <button type="button" className="tg-action-secondary" onClick={clearFilters}>
              Clear
            </button>
          )}
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
        const shown = section.rows.filter((row) => visible.has(row.claim.id)).length
        return (
          <section
            key={section.id}
            id={sectionAnchor(section.id)}
            hidden={shown === 0}
            aria-labelledby={`${sectionAnchor(section.id)}-heading`}
            className="mt-10 scroll-mt-44"
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
                  counts={section.counts}
                  mini
                  label={`Verdict mix for section ${section.id}`}
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
