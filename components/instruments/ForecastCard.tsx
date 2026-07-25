'use client'

import type { ForecastStatus } from '@/lib/instruments/types'
import { useAudit } from '@/components/instruments/AuditProvider'
import { nodeId, type InstrumentNodeProps } from '@/components/instruments/annotation-props'
import { INSTRUMENT_SENTINEL } from '@/components/instruments/sentinel'

/**
 * What the card says about itself once the date arrives. The statuses are the schema's, not
 * prose: a card that can only ever read "prediction" is decoration, and one that can read
 * "resolved no" is a scoreboard.
 */
const STATUS_COPY: Record<ForecastStatus, { label: string; tone: string }> = {
  open: { label: 'Open', tone: 'var(--instrument-accent)' },
  'resolved-yes': { label: 'Resolved — it happened', tone: 'var(--color-chart-primary)' },
  'resolved-no': { label: 'Resolved — it did not', tone: 'var(--color-chart-counter)' },
  ambiguous: { label: 'Resolved — ambiguous', tone: 'var(--color-chart-context)' },
  withdrawn: { label: 'Withdrawn', tone: 'var(--color-chart-context)' },
}

function formatDay(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * A dated, two-sided prediction. Both sides are stated as the piece states them rather than
 * summarised, and the resolution date is a real date so the card can be scored rather than
 * admired. The two columns are independent lists, deliberately not paired rows: the items do
 * not correspond one to one and a table would claim they do.
 */
export default function ForecastCard(props: InstrumentNodeProps) {
  const { forecasts } = useAudit()
  const card = forecasts.get(nodeId(props) ?? '')
  if (!card) return null

  const status = STATUS_COPY[card.status]

  return (
    <section
      className="instrument-block tg-forecast"
      aria-labelledby={`forecast-${card.id}`}
      data-instrument={INSTRUMENT_SENTINEL}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p className="tg-instrument-label">Calling it now</p>
        <p
          className="font-mono text-[11px] tracking-[0.14em] uppercase"
          style={{ color: status.tone }}
        >
          {status.label}
        </p>
      </div>

      <h2
        id={`forecast-${card.id}`}
        className="mt-3 font-newsreader text-2xl leading-snug font-medium text-text-1"
      >
        {card.question}
      </h2>

      {/* The two sides are not symmetrical and should not look it. The falsification side is
          the one that costs the author something, so it carries the heavier rule and its own
          ground — weight rather than a red warning colour, which would read as an error state
          rather than as the condition under which the piece admits it was wrong. */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div
          className="border-t pt-4"
          style={{ borderColor: 'color-mix(in oklab, var(--color-chart-primary) 50%, transparent)' }}
        >
          <h3
            className="font-mono text-[11px] tracking-[0.14em] uppercase"
            style={{ color: 'var(--color-chart-primary)' }}
          >
            If this is right
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-text-2">{card.forCase}</p>
        </div>
        <div
          className="-mx-3 rounded-sm border-t-[3px] bg-surface-1 px-3 pt-4 pb-3"
          style={{ borderColor: 'var(--color-chart-counter)' }}
        >
          <h3
            className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase"
            style={{ color: 'var(--color-chart-counter)' }}
          >
            If this is wrong
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-text-1">{card.againstCase}</p>
        </div>
      </div>

      {card.resolution && (
        <p className="mt-6 border-t border-border-1 pt-4 text-sm leading-relaxed text-text-2">
          {card.resolution}
        </p>
      )}

      <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[11px] text-text-3">
        <div className="flex gap-2">
          <dt>Stated</dt>
          <dd className="text-text-2">
            <time dateTime={card.stated}>{formatDay(card.stated)}</time>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt>Resolves</dt>
          <dd className="text-text-2">
            <time dateTime={card.resolvesOn}>{formatDay(card.resolvesOn)}</time>
          </dd>
        </div>
        {card.resolvedOn && (
          <div className="flex gap-2">
            <dt>Resolved</dt>
            <dd className="text-text-2">
              <time dateTime={card.resolvedOn}>{formatDay(card.resolvedOn)}</time>
            </dd>
          </div>
        )}
        <div className="flex gap-2">
          <dt>Confidence</dt>
          <dd className="text-text-2">{Math.round(card.confidence * 100)}%</dd>
        </div>
      </dl>
    </section>
  )
}
