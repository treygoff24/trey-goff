'use client'

import { useMemo, useState } from 'react'
import type { SlopeChart } from '@/lib/instruments/types'
import {
  ChartFrame,
  emphasis,
  extent,
  isCompact,
  padExtent,
  scale,
  toneColor,
  type ChartEntry,
} from '@/components/instruments/chart-kit'

/** The smallest vertical distance two labels can sit at before they read as one block. */
const MIN_GAP = 30

interface Placed {
  key: string
  /** Where the label wants to be: level with its own endpoint. */
  want: number
  /** Where it ends up once its neighbours have had their say. */
  at: number
}

/**
 * Label de-collision.
 *
 * Slope charts converge, which is the whole reason to draw one and the reason their endpoint
 * labels pile up. The pass sorts labels by the position they want, pushes each down until it
 * clears the one above, and if that runs the stack past the bottom of the plot it pushes back
 * up from the last one. A label moved more than a hair gets a leader line, so the reader can
 * still tell which line it belongs to — moving a label without drawing that line is how a
 * slope chart starts lying.
 */
function deCollide(wanted: { key: string; want: number }[], top: number, bottom: number): Placed[] {
  const placed: Placed[] = [...wanted]
    .sort((a, b) => a.want - b.want)
    .map((item) => ({ ...item, at: item.want }))

  let cursor = top
  for (const item of placed) {
    item.at = Math.max(item.want, cursor)
    cursor = item.at + MIN_GAP
  }

  let floor = bottom
  for (let index = placed.length - 1; index >= 0; index -= 1) {
    const item = placed[index]!
    item.at = Math.min(item.at, floor)
    floor = item.at - MIN_GAP
  }

  return placed
}

export default function Slope({ chart }: { chart: SlopeChart }) {
  const [active, setActive] = useState<string | null>(null)

  const entries = useMemo<ChartEntry[]>(
    () =>
      chart.series.map((series) => ({
        label: series.label,
        tone: series.tone,
        readout: `${series.label}: ${series.from}${chart.unit ?? ''} in ${series.fromNote ?? chart.fromLabel} → ${series.to}${chart.unit ?? ''} in ${series.toNote ?? chart.toLabel}`,
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
      {(width) => {
        const compact = isCompact(width)
        const left = compact ? 34 : 168
        const right = compact ? 46 : 96
        const height = Math.max(220, Math.min(360, chart.series.length * 46 + 120))
        const top = 24
        const bottom = height - 24

        const values = chart.series.flatMap((series) => [series.from, series.to])
        if (chart.reference) values.push(chart.reference.value)
        const y = scale(padExtent(extent(values)), [bottom, top])

        const leftLabels = deCollide(
          chart.series.map((series) => ({ key: series.label, want: y(series.from) })),
          top,
          bottom,
        )
        const rightLabels = deCollide(
          chart.series.map((series) => ({ key: series.label, want: y(series.to) })),
          top,
          bottom,
        )
        const at = (labels: Placed[], key: string) =>
          labels.find((item) => item.key === key)?.at ?? 0

        const x0 = left
        const x1 = width - right

        return (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            width="100%"
            height={height}
            role="img"
            aria-label={chart.summary}
            className="tg-chart-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            {chart.reference && (
              <g>
                <line
                  x1={x0}
                  x2={x1}
                  y1={y(chart.reference.value)}
                  y2={y(chart.reference.value)}
                  stroke="var(--color-border-2)"
                  strokeDasharray="3 4"
                />
                <text
                  x={x0 + 8}
                  y={y(chart.reference.value) - 6}
                  fill="var(--color-text-3)"
                  fontSize="11"
                >
                  {chart.reference.label}
                </text>
              </g>
            )}

            <text x={x0} y={12} fill="var(--color-text-3)" fontSize="11" textAnchor="start">
              {chart.fromLabel}
            </text>
            <text x={x1} y={12} fill="var(--color-text-3)" fontSize="11" textAnchor="end">
              {chart.toLabel}
            </text>

            {chart.series.map((series) => {
              const colour = toneColor(series.tone)
              const opacity = emphasis(active, series.label)
              const fromY = y(series.from)
              const toY = y(series.to)
              const labelLeft = at(leftLabels, series.label)
              const labelRight = at(rightLabels, series.label)

              return (
                <g key={series.label} opacity={opacity} className="tg-chart-series">
                  <line
                    x1={x0}
                    y1={fromY}
                    x2={x1}
                    y2={toY}
                    stroke={colour}
                    strokeWidth={active === series.label ? 2.6 : 2}
                  />
                  <circle cx={x0} cy={fromY} r={3.5} fill={colour} />
                  <circle cx={x1} cy={toY} r={3.5} fill={colour} />

                  {Math.abs(labelRight - toY) > 2 && (
                    <line
                      x1={x1 + 8}
                      y1={toY}
                      x2={x1 + 14}
                      y2={labelRight - 4}
                      stroke={colour}
                      strokeWidth="0.8"
                      opacity="0.6"
                    />
                  )}
                  <text
                    x={x1 + 16}
                    y={labelRight}
                    fill={colour}
                    fontSize="12.5"
                    fontWeight="600"
                    dominantBaseline="middle"
                  >
                    {series.to}
                    {chart.unit}
                  </text>

                  {!compact && (
                    <>
                      {Math.abs(labelLeft - fromY) > 2 && (
                        <line
                          x1={x0 - 8}
                          y1={fromY}
                          x2={x0 - 14}
                          y2={labelLeft - 4}
                          stroke={colour}
                          strokeWidth="0.8"
                          opacity="0.6"
                        />
                      )}
                      <text
                        x={x0 - 18}
                        y={labelLeft - 6}
                        fill="var(--color-text-2)"
                        fontSize="12"
                        textAnchor="end"
                      >
                        {series.label}
                      </text>
                      <text
                        x={x0 - 18}
                        y={labelLeft + 8}
                        fill="var(--color-text-3)"
                        fontSize="10.5"
                        textAnchor="end"
                      >
                        {series.from}
                        {chart.unit}
                        {series.fromNote ? ` · ${series.fromNote}` : ''}
                      </text>
                    </>
                  )}
                </g>
              )
            })}
          </svg>
        )
      }}
    </ChartFrame>
  )
}
