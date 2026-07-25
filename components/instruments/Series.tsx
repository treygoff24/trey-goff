'use client'

import { useMemo, useState } from 'react'
import type { SeriesChart } from '@/lib/instruments/types'
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

function format(value: number): string {
  return value >= 10000 ? value.toLocaleString('en-US') : String(value)
}

/** A line over a shared x axis — the kit's workhorse for anything that runs over time. */
export default function Series({ chart }: { chart: SeriesChart }) {
  const [active, setActive] = useState<string | null>(null)

  const entries = useMemo<ChartEntry[]>(
    () =>
      chart.series.map((series) => {
        const first = series.points[0]!
        const last = series.points[series.points.length - 1]!
        return {
          label: series.label,
          tone: series.tone,
          readout: `${series.label}: ${format(first.y)}${chart.unit ?? ''} at ${first.x}, ${format(last.y)}${chart.unit ?? ''} at ${last.x}`,
        }
      }),
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
        const height = compact ? 200 : 260
        const left = compact ? 40 : 56
        const right = 16
        const top = 16
        const bottom = height - 30

        const points = chart.series.flatMap((series) => series.points)
        const x = scale(extent(points.map((point) => point.x)), [left, width - right])
        const y = scale(padExtent(extent(points.map((point) => point.y))), [bottom, top])

        const xTicks = extent(points.map((point) => point.x))
        const yTicks = padExtent(extent(points.map((point) => point.y)))

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
            <line
              x1={left}
              x2={width - right}
              y1={bottom}
              y2={bottom}
              stroke="var(--color-border-2)"
            />
            {yTicks.map((value) => (
              <g key={value}>
                <line
                  x1={left}
                  x2={width - right}
                  y1={y(value)}
                  y2={y(value)}
                  stroke="var(--color-border-1)"
                  strokeDasharray="2 5"
                />
                <text
                  x={left - 8}
                  y={y(value) + 4}
                  fill="var(--color-text-3)"
                  fontSize="10.5"
                  textAnchor="end"
                >
                  {format(Math.round(value))}
                </text>
              </g>
            ))}
            {xTicks.map((value, index) => (
              <text
                key={value}
                x={index === 0 ? left : width - right}
                y={height - 10}
                fill="var(--color-text-3)"
                fontSize="10.5"
                textAnchor={index === 0 ? 'start' : 'end'}
              >
                {value}
              </text>
            ))}

            {chart.series.map((series) => {
              const colour = toneColor(series.tone)
              const path = series.points
                .map(
                  (point, index) =>
                    `${index === 0 ? 'M' : 'L'}${x(point.x).toFixed(1)},${y(point.y).toFixed(1)}`,
                )
                .join('')

              return (
                <g
                  key={series.label}
                  opacity={emphasis(active, series.label)}
                  className="tg-chart-series"
                >
                  <path
                    d={path}
                    fill="none"
                    stroke={colour}
                    strokeWidth={active === series.label ? 2.6 : 2}
                    strokeLinejoin="round"
                  />
                  {series.points.map((point) => (
                    <circle
                      key={`${point.x}-${point.y}`}
                      cx={x(point.x)}
                      cy={y(point.y)}
                      r={active === series.label ? 3.2 : 2}
                      fill={colour}
                    />
                  ))}
                </g>
              )
            })}

            {chart.yLabel && (
              <text x={left - 8} y={12} fill="var(--color-text-3)" fontSize="10.5" textAnchor="end">
                {chart.yLabel}
              </text>
            )}
            {chart.xLabel && (
              <text
                x={(left + width - right) / 2}
                y={height - 10}
                fill="var(--color-text-3)"
                fontSize="10.5"
                textAnchor="middle"
              >
                {chart.xLabel}
              </text>
            )}
          </svg>
        )
      }}
    </ChartFrame>
  )
}
