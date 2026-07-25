'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from 'react'
import { useLedger } from '@/components/instruments/LedgerProvider'
import { useVisibleIds } from '@/components/instruments/use-filtered-rows'
import { setRange, useLedgerStore } from '@/components/instruments/ledger-store'
import { INSTRUMENT_SENTINEL } from '@/components/instruments/sentinel'
import {
  BUCKET_COUNT,
  TERRAIN_MIN_CLAIMS,
  TERRAIN_WINDOW,
  bucketIndexAt,
  formatClock,
  formatMinutes,
  toSeconds,
  verdictColor,
  type LedgerModel,
} from '@/components/instruments/ledger-model'

const COMPACT_WIDTH = 640
const DEFAULT_WIDTH = 900

/**
 * The spine measures itself before the browser paints, so the first frame the reader sees is
 * already at the real width — no visible re-draw from the 900px server guess. Falls back to
 * the ordinary effect on the server, where there is nothing to measure.
 */
const useMeasureEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

interface Geometry {
  width: number
  height: number
  compact: boolean
  terrainTop: number
  terrainBottom: number
  rugTop: number
  axisY: number
  midY: number
  x: (t: number) => number
  y: (value: number) => number
}

function geometry(width: number, span: number, low: number, high: number): Geometry {
  const compact = width < COMPACT_WIDTH
  const height = compact ? 156 : 214
  const rug = compact ? 34 : 48
  const axisY = height - 6
  const terrainTop = 26
  const terrainBottom = height - 24 - rug
  // The observed range drives the scale, with a little headroom, so neither half is dead space.
  const top = high + 0.06
  const bottom = Math.min(low - 0.04, -0.02)
  return {
    width,
    height,
    compact,
    terrainTop,
    terrainBottom,
    rugTop: terrainBottom + 6,
    axisY,
    midY: terrainTop + ((top - 0) / (top - bottom)) * (terrainBottom - terrainTop),
    x: (t) => (span === 0 ? 0 : (t / span) * (width - 2) + 1),
    y: (value) => terrainTop + ((top - value) / (top - bottom)) * (terrainBottom - terrainTop),
  }
}

/** The terrain paths, in the SVG's own coordinates. Recomputed on resize, never on filter. */
function useTerrainPaths(model: LedgerModel, geo: Geometry) {
  return useMemo(() => {
    return model.terrain
      .filter((run) => run.length > 1)
      .map((run) => {
        const line = `M${run.map((s) => `${geo.x(s.t).toFixed(1)},${geo.y(s.value).toFixed(1)}`).join('L')}`
        const last = run[run.length - 1]!
        const first = run[0]!
        return {
          line,
          area: `${line}L${geo.x(last.t).toFixed(1)},${geo.midY.toFixed(1)}L${geo.x(first.t).toFixed(1)},${geo.midY.toFixed(1)}Z`,
        }
      })
  }, [model.terrain, geo])
}

/** The rug: one mark per claim, stacked by column, coloured by verdict. */
function useRug(model: LedgerModel, geo: Geometry) {
  return useMemo(() => {
    const columnWidth = geo.compact ? 3.4 : 5.2
    const columns = Math.max(1, Math.ceil(geo.width / columnWidth))
    const stack = new Array<number>(columns).fill(0)
    const marks: { id: string; x: number; y: number; w: number; fill: string }[] = []
    const rugHeight = geo.axisY - 8 - geo.rugTop

    for (const row of [...model.rows].sort((a, b) => a.seconds - b.seconds)) {
      const column = Math.min(columns - 1, Math.floor(geo.x(row.seconds) / columnWidth))
      const y = geo.axisY - 10 - stack[column]! * 3.3
      stack[column]! += 1
      if (y < geo.axisY - 10 - rugHeight) continue
      marks.push({
        id: row.claim.id,
        x: column * columnWidth,
        y,
        w: columnWidth - 1,
        fill: verdictColor(row.state),
      })
    }
    return marks
  }, [model.rows, geo])
}

/**
 * Where each subject section starts on the tape. The wide layout has room to name them, which
 * turns the strip from an anonymous density plot into a map of the conversation.
 */
function useSectionMarks(model: LedgerModel, geo: Geometry) {
  return useMemo(() => {
    if (geo.compact) return []
    const marks: { id: string; x: number }[] = []
    let last = -Infinity
    for (const section of model.sections) {
      const start = Math.min(...section.rows.map((row) => row.seconds))
      if (!Number.isFinite(start)) continue
      const x = geo.x(start)
      if (x - last < 14) continue
      last = x
      marks.push({ id: section.id, x })
    }
    return marks
  }, [model.sections, geo])
}

export default function TimeSpine() {
  const { model } = useLedger()
  const visible = useVisibleIds()
  const range = useLedgerStore((state) => state.filters.range)
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [focused, setFocused] = useState(0)
  const [keyboard, setKeyboard] = useState(false)
  const frameRef = useRef<HTMLDivElement>(null)
  const bucketRefs = useRef<(HTMLButtonElement | null)[]>([])

  useMeasureEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    setWidth(Math.max(320, Math.round(frame.getBoundingClientRect().width)))
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(320, Math.round(entry.contentRect.width)))
    })
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  const geo = useMemo(
    () =>
      geometry(width, model.span, model.extremes?.low.value ?? -1, model.extremes?.high.value ?? 1),
    [width, model.span, model.extremes],
  )
  const paths = useTerrainPaths(model, geo)
  const rug = useRug(model, geo)
  const sectionMarks = useSectionMarks(model, geo)

  const brush = useMemo(() => {
    if (!range) return null
    const from = toSeconds(range[0])
    const to = toSeconds(range[1])
    return {
      from,
      to,
      first: bucketIndexAt(model.buckets, from),
      last: bucketIndexAt(model.buckets, to),
    }
  }, [range, model.buckets])

  useEffect(() => {
    if (!brush) return
    setFocused((current) =>
      current >= brush.first && current <= brush.last ? current : brush.first,
    )
  }, [brush])

  const brushBuckets = useCallback(
    (a: number, b: number) => {
      const low = Math.min(a, b)
      const high = Math.max(a, b)
      setRange([model.buckets[low]!.from, model.buckets[high]!.to])
    },
    [model.buckets],
  )

  const dragAnchor = useRef<number | null>(null)
  const bucketAt = useCallback((clientX: number) => {
    const frame = frameRef.current
    if (!frame) return 0
    const rect = frame.getBoundingClientRect()
    const ratio = (clientX - rect.left) / rect.width
    return Math.max(0, Math.min(BUCKET_COUNT - 1, Math.floor(ratio * BUCKET_COUNT)))
  }, [])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const index = bucketAt(event.clientX)
    dragAnchor.current = index
    setFocused(index)
    event.currentTarget.setPointerCapture(event.pointerId)
    brushBuckets(index, index)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragAnchor.current === null) return
    brushBuckets(dragAnchor.current, bucketAt(event.clientX))
  }

  const onPointerUp = () => {
    dragAnchor.current = null
  }

  const moveFocus = (index: number) => {
    const next = Math.max(0, Math.min(BUCKET_COUNT - 1, index))
    setFocused(next)
    bucketRefs.current[next]?.focus()
    return next
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'Home' ? -BUCKET_COUNT : event.key === 'End' ? BUCKET_COUNT : 0
    switch (event.key) {
      case 'Escape':
        setRange(null)
        break
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'Home':
      case 'End': {
        const delta = step || (event.key === 'ArrowRight' ? 1 : -1)
        const next = moveFocus(focused + delta)
        // Shift drags the edge the reader is standing on, so the same gesture that widens a
        // window from the outside shrinks it from the inside. From mid-selection there is no
        // edge underfoot, so the nearer one moves — ties go to the leading edge. On a
        // one-bucket window there is no near edge to pick, so it widens.
        if (event.shiftKey && brush) {
          if (brush.first === brush.last) brushBuckets(brush.first, next)
          else if (focused === brush.last) brushBuckets(brush.first, next)
          else if (focused === brush.first) brushBuckets(next, brush.last)
          else if (focused - brush.first <= brush.last - focused) brushBuckets(next, brush.last)
          else brushBuckets(brush.first, next)
        }
        break
      }
      case 'Enter':
      case ' ':
        if (brush && brush.first === focused && brush.last === focused) setRange(null)
        else brushBuckets(focused, focused)
        break
      default:
        return
    }
    event.preventDefault()
  }

  const windowLabel = brush
    ? `${formatClock(brush.from)}–${formatClock(brush.to)}`
    : `full episode · ${formatClock(model.span)}`

  return (
    <section
      className="instrument-block not-prose"
      aria-labelledby="time-spine-heading"
      data-instrument={INSTRUMENT_SENTINEL}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="time-spine-heading" className="tg-instrument-label">
          The time spine
        </h2>
        <p className="font-mono text-xs text-text-3" role="status" aria-live="polite">
          {windowLabel}
        </p>
      </div>
      <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-text-2">
        Every claim placed at the minute it was made, coloured by verdict and stacked by density,
        over a running confidence line. Drag across the strip — or tab into it and use the arrow
        keys — to scope the ledger to that stretch of tape.
      </p>

      <div
        ref={frameRef}
        className="relative mt-5 touch-pan-y select-none rounded-sm border border-border-1 bg-surface-1"
      >
        <svg
          aria-hidden="true"
          className="block w-full"
          viewBox={`0 0 ${geo.width} ${geo.height}`}
          style={{ height: geo.height }}
        >
          <defs>
            <linearGradient id="spine-up" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={verdictColor('confirmed')} stopOpacity="0.42" />
              <stop offset="1" stopColor={verdictColor('confirmed')} stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id="spine-down" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={verdictColor('debunked')} stopOpacity="0.03" />
              <stop offset="1" stopColor={verdictColor('debunked')} stopOpacity="0.42" />
            </linearGradient>
            <clipPath id="spine-clip-up">
              <rect
                x="0"
                y={geo.terrainTop}
                width={geo.width}
                height={Math.max(0, geo.midY - geo.terrainTop)}
              />
            </clipPath>
            <clipPath id="spine-clip-down">
              <rect
                x="0"
                y={geo.midY}
                width={geo.width}
                height={Math.max(0, geo.terrainBottom - geo.midY)}
              />
            </clipPath>
          </defs>

          {paths.map((path, index) => (
            <g key={index}>
              <path d={path.area} fill="url(#spine-up)" clipPath="url(#spine-clip-up)" />
              <path d={path.area} fill="url(#spine-down)" clipPath="url(#spine-clip-down)" />
              <path
                d={path.line}
                fill="none"
                stroke="var(--instrument-accent)"
                strokeWidth="1.25"
              />
            </g>
          ))}

          <line
            x1="0"
            y1={geo.midY}
            x2={geo.width}
            y2={geo.midY}
            stroke="var(--color-border-1)"
            strokeDasharray="3 4"
          />
          <text
            x="4"
            y={geo.midY - 5}
            className="font-mono"
            fontSize="9"
            fill="var(--color-text-3)"
          >
            contested / even
          </text>

          {sectionMarks.map((mark) => (
            <g key={mark.id}>
              <line
                x1={mark.x}
                y1={geo.terrainTop - 8}
                x2={mark.x}
                y2={geo.terrainBottom}
                stroke="var(--color-border-1)"
              />
              <text
                x={mark.x + 3}
                y={geo.terrainTop - 12}
                className="font-mono"
                fontSize="9"
                fill="var(--color-text-3)"
              >
                {mark.id}
              </text>
            </g>
          ))}

          {rug.map((mark) => (
            <rect
              key={mark.id}
              x={mark.x}
              y={mark.y}
              width={mark.w}
              height="2.6"
              rx="1"
              fill={mark.fill}
              opacity={visible.has(mark.id) ? 1 : 0.18}
            />
          ))}

          {Array.from(
            { length: Math.floor(model.span / 1800) + 1 },
            (_, index) => index * 1800,
          ).map((t) => (
            <text
              key={t}
              x={geo.x(t)}
              y={geo.axisY}
              className="font-mono"
              fontSize="9"
              fill="var(--color-text-3)"
              textAnchor={t === 0 ? 'start' : 'middle'}
            >
              {formatMinutes(t)}
            </text>
          ))}

          {brush && (
            <rect
              x={geo.x(brush.from)}
              y="0"
              width={Math.max(1, geo.x(brush.to) - geo.x(brush.from))}
              height={geo.height - 12}
              fill="var(--instrument-accent-quiet)"
              stroke="var(--instrument-accent-hairline)"
            />
          )}
        </svg>

        {/* The control itself: one option per bucket, transparent over the drawing, so the
            brush is as operable from the keyboard as it is from a pointer. */}
        <div
          role="listbox"
          aria-label="Episode window. Arrow keys move through the interview, Shift and an arrow move the nearer edge of the window, Enter sets or clears it, Escape clears it."
          aria-orientation="horizontal"
          aria-multiselectable="true"
          className="absolute inset-0 flex"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          onFocus={() => setKeyboard(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setKeyboard(false)
          }}
        >
          {model.buckets.map((bucket) => {
            const selected =
              brush !== null && bucket.index >= brush.first && bucket.index <= brush.last
            return (
              <button
                key={bucket.index}
                type="button"
                ref={(node) => {
                  bucketRefs.current[bucket.index] = node
                }}
                role="option"
                aria-selected={selected}
                tabIndex={bucket.index === focused ? 0 : -1}
                className="tg-bucket h-full flex-1 bg-transparent"
                aria-label={`${formatMinutes(bucket.from)} to ${formatMinutes(bucket.to)}, ${bucket.total} claims`}
              />
            )
          })}
        </div>
      </div>

      <p className="mt-3 font-mono text-xs text-text-3">
        {keyboard
          ? 'arrows move · shift and an arrow drag the nearer edge · enter sets or clears · escape clears'
          : 'drag across the spine to scope the ledger'}
      </p>
      <p className="mt-2 max-w-[68ch] text-xs leading-relaxed text-text-3">
        The confidence line is a construct, not a measurement: a rolling mean of verdict weight over
        a {TERRAIN_WINDOW / 60}-minute window either side of each point. Windows holding fewer than{' '}
        {TERRAIN_MIN_CLAIMS} scored claims are drawn as a gap rather than a guess. The weights are
        printed in the method note below.
      </p>
    </section>
  )
}
