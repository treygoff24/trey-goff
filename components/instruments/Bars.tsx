'use client'

import { useMemo, useState } from 'react'
import type { BarsChart } from '@/lib/instruments/types'
import {
  ChartFrame,
  emphasis,
  toneColor,
  type ChartEntry,
} from '@/components/instruments/chart-kit'

/**
 * Horizontal bars, drawn in the DOM rather than in SVG: the labels are prose, they need to
 * wrap, and a bar chart whose category names are `<text>` nodes is a bar chart whose labels
 * are clipped on a phone.
 */
export default function Bars({ chart }: { chart: BarsChart }) {
  const [active, setActive] = useState<string | null>(null)
  const max = Math.max(...chart.bars.map((bar) => bar.value))

  const entries = useMemo<ChartEntry[]>(
    () =>
      chart.bars.map((bar) => ({
        label: bar.label,
        tone: bar.tone,
        readout: `${bar.label}: ${bar.value.toLocaleString('en-US')}${chart.unit ?? ''}${bar.note ? ` — ${bar.note}` : ''}`,
      })),
    [chart],
  )

  return (
    <ChartFrame
      id={chart.id}
      title={chart.title}
      summary={chart.summary}
      caption={chart.caption}
      source={chart.source}
      entries={entries}
      active={active}
      onActive={setActive}
    >
      {() => (
        <ul className="space-y-3">
          {chart.bars.map((bar) => (
            <li
              key={bar.label}
              className="grid grid-cols-[1fr_auto] items-baseline gap-x-4"
              style={{ opacity: emphasis(active, bar.label) }}
            >
              <span className="text-sm text-text-2">{bar.label}</span>
              <span
                className="font-mono text-sm tabular-nums"
                style={{ color: toneColor(bar.tone) }}
              >
                {bar.value.toLocaleString('en-US')}
                {chart.unit}
              </span>
              <span className="col-span-2 mt-1 block h-2 w-full rounded-xs bg-surface-2">
                <span
                  className="tg-chart-bar block h-full rounded-xs"
                  style={{
                    width: `${max === 0 ? 0 : (bar.value / max) * 100}%`,
                    backgroundColor: toneColor(bar.tone),
                  }}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </ChartFrame>
  )
}
