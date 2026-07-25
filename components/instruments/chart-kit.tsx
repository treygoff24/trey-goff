'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ChartTone, Source } from '@/lib/instruments/types'
import { INSTRUMENT_SENTINEL } from '@/components/instruments/sentinel'

/**
 * Tones resolve to tokens, never to colours. `app/globals.css` declares the three and
 * `test/instruments-contrast.test.ts` holds them to AA on every ground a figure paints on.
 */
export function toneColor(tone: ChartTone): string {
  return `var(--color-chart-${tone})`
}

const DEFAULT_WIDTH = 720
const COMPACT_WIDTH = 560

const useMeasureEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/** The drawn width, measured before paint so the first frame is already at the real size. */
export function useChartWidth(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(DEFAULT_WIDTH)

  useMeasureEffect(() => {
    const frame = ref.current
    if (!frame) return
    setWidth(Math.max(280, Math.round(frame.getBoundingClientRect().width)))
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(280, Math.round(entry.contentRect.width)))
    })
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  return [ref, width]
}

export function isCompact(width: number): boolean {
  return width < COMPACT_WIDTH
}

/** A linear scale, the one piece of scale machinery every figure in the kit shares. */
export function scale(
  domain: [number, number],
  range: [number, number],
): (value: number) => number {
  const [d0, d1] = domain
  const [r0, r1] = range
  const span = d1 - d0
  return (value) => (span === 0 ? (r0 + r1) / 2 : r0 + ((value - d0) / span) * (r1 - r0))
}

export function extent(values: readonly number[]): [number, number] {
  return [Math.min(...values), Math.max(...values)]
}

/** Rounds an extent outward so the drawing has air above and below its data. */
export function padExtent([low, high]: [number, number], fraction = 0.08): [number, number] {
  const pad = (high - low || Math.abs(high) || 1) * fraction
  return [low - pad, high + pad]
}

export interface ChartEntry {
  /** Matches a series/bar/event label; this is the key the highlight is driven by. */
  label: string
  tone: ChartTone
  /** What the readout says when this entry is the active one. */
  readout: string
}

export interface ChartFrameProps {
  id: string
  title: string
  summary: string
  caption?: string
  source?: Source
  entries: ChartEntry[]
  active: string | null
  onActive: (label: string | null) => void
  children: (width: number) => ReactNode
}

/**
 * The furniture every figure shares: the title, the drawing, a legend whose items are real
 * buttons, and one live readout.
 *
 * The legend is the keyboard path. Hover tooltips are unreachable without a pointer, and a
 * tooltip that follows the cursor inside an SVG is the single most reliable source of
 * horizontal-overflow bugs at 390px — so the readout is a fixed region beneath the drawing
 * that both hover and focus write into, and it announces itself politely when it changes.
 */
export function ChartFrame({
  id,
  title,
  summary,
  caption,
  source,
  entries,
  active,
  onActive,
  children,
}: ChartFrameProps) {
  const [ref, width] = useChartWidth()
  const readout = useMemo(
    () => entries.find((entry) => entry.label === active)?.readout ?? null,
    [entries, active],
  )

  return (
    <figure
      className="instrument-block tg-chart"
      aria-labelledby={`chart-${id}-title`}
      data-instrument={INSTRUMENT_SENTINEL}
    >
      <p id={`chart-${id}-title`} className="tg-instrument-label">
        {title}
      </p>

      <div ref={ref} className="mt-3">
        {children(width)}
      </div>

      <p className="sr-only">{summary}</p>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2" onMouseLeave={() => onActive(null)}>
        {entries.map((entry) => (
          <li key={entry.label}>
            <button
              type="button"
              className="tg-chart-key"
              aria-pressed={active === entry.label}
              style={{ color: toneColor(entry.tone) }}
              onFocus={() => onActive(entry.label)}
              onBlur={() => onActive(null)}
              onMouseEnter={() => onActive(entry.label)}
              onClick={() => onActive(active === entry.label ? null : entry.label)}
            >
              <span aria-hidden="true" className="tg-chart-swatch" />
              {entry.label}
            </button>
          </li>
        ))}
      </ul>

      <p className="tg-chart-readout" role="status">
        {readout ?? ' '}
      </p>

      {(caption || source) && (
        <figcaption className="mt-3 max-w-[60ch] text-sm leading-relaxed text-text-3">
          {caption}
          {source && (
            <>
              {caption ? ' ' : ''}
              <a
                href={source.url}
                rel="noreferrer noopener"
                target="_blank"
                className="underline underline-offset-4"
                style={{ color: 'var(--instrument-accent)' }}
              >
                {source.title}
              </a>
            </>
          )}
        </figcaption>
      )}
    </figure>
  )
}

/** Dims everything except the active entry, and nothing at all when none is active. */
export function emphasis(active: string | null, label: string): number {
  if (active === null) return 1
  return active === label ? 1 : 0.28
}
