'use client'

import { useMemo } from 'react'
import type { TimelineChart } from '@/lib/instruments/types'
import {
  ChartFrame,
  emphasis,
  toneColor,
  type ChartEntry,
} from '@/components/instruments/chart-kit'

function formatMonth(date: string): string {
  const [year, month, day] = date.split('-')
  const at = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day ?? '1')))
  return at.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    ...(day ? { day: 'numeric' } : {}),
    timeZone: 'UTC',
  })
}

/**
 * A vertical spine rather than a horizontal axis. A horizontal timeline forces every label to
 * fight for the same strip of width and loses that fight on a phone; running it down the page
 * gives each event a full line and reads the way the rest of the piece does.
 */
export default function Timeline({ chart }: { chart: TimelineChart }) {
  const entries = useMemo<ChartEntry[]>(
    () =>
      chart.events.map((event) => ({
        label: event.label,
        tone: event.tone,
        readout: `${formatMonth(event.date)} — ${event.label}${event.note ? `: ${event.note}` : ''}`,
      })),
    [chart],
  )

  return (
    <ChartFrame chart={chart} entries={entries}>
      {({ active }) => (
        <ol className="tg-timeline">
          {chart.events.map((event) => (
            <li
              key={`${event.date}-${event.label}`}
              className="tg-timeline-event"
              style={{ opacity: emphasis(active, event.label) }}
            >
              <span
                aria-hidden="true"
                className="tg-timeline-dot"
                style={{ backgroundColor: toneColor(event.tone) }}
              />
              <time
                dateTime={event.date}
                className="font-mono text-[11px] tracking-[0.1em] text-text-3 uppercase"
              >
                {formatMonth(event.date)}
              </time>
              <p className="mt-1 text-sm leading-relaxed text-text-1">{event.label}</p>
              {event.note && (
                <p className="mt-1 text-sm leading-relaxed text-text-3">{event.note}</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </ChartFrame>
  )
}
