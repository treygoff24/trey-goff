'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { ChartTone, Source } from '@/lib/instruments/types'
import { safeHref } from '@/lib/instruments/href'
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

/** What a figure's drawing is handed: its measured width, and the two ways it can talk back. */
export interface ChartDrawing {
  width: number
  /** The entry currently raised — pinned by the legend, or previewed under a pointer. */
  active: string | null
  /** Raise an entry without pinning it. Hover and point focus both go through here. */
  preview: (label: string | null) => void
  /** Put an arbitrary line in the readout, for a single observation rather than a series. */
  detail: (text: string | null) => void
}

export interface ChartFrameProps {
  id: string
  title: string
  summary: string
  caption?: string
  source?: Source
  entries: ChartEntry[]
  children: (drawing: ChartDrawing) => ReactNode
}

/**
 * The furniture every figure shares: the title, the drawing, a legend whose items are real
 * buttons, and one live readout.
 *
 * The legend is the keyboard path. Hover tooltips are unreachable without a pointer, and a
 * tooltip that follows the cursor inside an SVG is the single most reliable source of
 * horizontal-overflow bugs at 390px — so the readout is a fixed region beneath the drawing
 * that both hover and focus write into, and it announces itself politely when it changes.
 *
 * Selection and attention are two different things, and conflating them is what made the first
 * version contradict itself: focus raised a series, so pressing Space on the focused key
 * lowered the one the reader had just arrived at while `aria-pressed` still said it was on.
 * Here the legend is a radio group — exactly one key can be pinned, arrow keys move the
 * selection the way a radio group is expected to, and clicking the pinned key clears it —
 * while hover and point focus only *preview*, which changes what is raised without ever
 * contradicting what `aria-checked` says is chosen.
 */
export function ChartFrame({
  id,
  title,
  summary,
  caption,
  source,
  entries,
  children,
}: ChartFrameProps) {
  const [ref, width] = useChartWidth()
  const [pinned, setPinned] = useState<string | null>(null)
  const [previewed, setPreviewed] = useState<string | null>(null)
  const [detailed, setDetailed] = useState<string | null>(null)
  const keys = useRef<(HTMLButtonElement | null)[]>([])

  const active = previewed ?? pinned
  const readout =
    detailed ?? entries.find((entry) => entry.label === active)?.readout ?? null

  // Roving tabindex: the group is one tab stop, and the arrows move within it. With nothing
  // pinned the first key holds the stop, so the group is reachable before anything is chosen.
  const chosen = entries.findIndex((entry) => entry.label === pinned)
  const stop = chosen === -1 ? 0 : chosen

  const move = (from: number, step: number) => {
    const to = (from + step + entries.length) % entries.length
    setPinned(entries[to]!.label)
    keys.current[to]?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      move(index, 1)
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      move(index, -1)
    }
  }

  const drawing: ChartDrawing = {
    width,
    active,
    preview: setPreviewed,
    detail: setDetailed,
  }

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
        {children(drawing)}
      </div>

      <p className="sr-only">{summary}</p>

      <ul
        role="radiogroup"
        aria-labelledby={`chart-${id}-title`}
        className="mt-3 flex flex-wrap gap-x-4 gap-y-2"
        onMouseLeave={() => setPreviewed(null)}
      >
        {entries.map((entry, index) => (
          <li key={entry.label}>
            <button
              ref={(node) => {
                keys.current[index] = node
              }}
              type="button"
              role="radio"
              className="tg-chart-key"
              aria-checked={pinned === entry.label}
              tabIndex={index === stop ? 0 : -1}
              style={{ color: toneColor(entry.tone) }}
              onKeyDown={(event) => onKeyDown(event, index)}
              onFocus={() => setPreviewed(entry.label)}
              onBlur={() => setPreviewed(null)}
              onMouseEnter={() => setPreviewed(entry.label)}
              onClick={() => setPinned(pinned === entry.label ? null : entry.label)}
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
              {safeHref(source.url) === null ? (
                source.title
              ) : (
                <a
                  href={safeHref(source.url)!}
                  rel="noreferrer noopener"
                  target="_blank"
                  className="underline underline-offset-4"
                  style={{ color: 'var(--instrument-accent)' }}
                >
                  {source.title}
                </a>
              )}
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
