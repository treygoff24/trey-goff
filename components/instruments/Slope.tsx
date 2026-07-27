'use client'

import { useMemo } from 'react'
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

  // The plot is sized from the series count so both passes fit, but a caller is free to draw
  // this at any height it likes and the backward pass only ever pushes up. Clamping into the
  // band is the guarantee that no label ever paints outside the figure it belongs to.
  for (const item of placed) item.at = Math.min(Math.max(item.at, top), bottom)

  return placed
}

export default function Slope({ chart }: { chart: SlopeChart }) {
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
    <ChartFrame chart={chart} entries={entries}>
      {({ width, active, preview, detail }) => {
        const compact = isCompact(width)
        const left = compact ? 34 : 168
        const right = compact ? 46 : 96
        // No upper bound. A cap on the height with no cap on the series count is a promise the
        // de-collision pass cannot keep: past about five series the labels need more room than
        // 360px has, and the pass has to choose between overlapping them and pushing them off
        // the plot. Growing the plot instead is the only answer that keeps the chart honest.
        const height = Math.max(220, chart.series.length * 46 + 120)
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
                  {/* The two endpoints are the figure's only real observations, so they are
                      the two things a keyboard has to be able to reach. */}
                  {(
                    [
                      { at: 'from', cx: x0, cy: fromY, value: series.from, when: chart.fromLabel },
                      { at: 'to', cx: x1, cy: toY, value: series.to, when: chart.toLabel },
                    ] as const
                  ).map((point) => {
                    const readout = `${series.label}: ${point.value}${chart.unit ?? ''} in ${point.when}`
                    return (
                      <circle
                        key={point.at}
                        className="tg-chart-point"
                        cx={point.cx}
                        cy={point.cy}
                        r={3.5}
                        fill={colour}
                        stroke="transparent"
                        strokeWidth={14}
                        tabIndex={0}
                        role="img"
                        aria-label={readout}
                        onFocus={() => {
                          preview(series.label)
                          detail(readout)
                        }}
                        onBlur={() => {
                          preview(null)
                          detail(null)
                        }}
                        onMouseEnter={() => {
                          preview(series.label)
                          detail(readout)
                        }}
                        onMouseLeave={() => {
                          preview(null)
                          detail(null)
                        }}
                      />
                    )
                  })}

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
