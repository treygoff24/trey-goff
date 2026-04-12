'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useId } from 'react'
import type { Book } from '@/lib/books/types'
import type { BookColorMap } from '@/lib/library/colors'
import { formatDecadeChartTick, formatDecadeLabel, formatLibraryYear } from '@/lib/library/topics'
import { useReducedMotion } from '@/hooks/useReducedMotion'

type StackDetailPanelProps = {
  books: Book[]
  hoveredBook: Book | null
  selectedBook: Book | null
  coverMap: Record<string, string>
  colors: BookColorMap
}

function getTopicCounts(books: Book[]) {
  const counts = new Map<string, number>()
  for (const book of books) {
    for (const topic of book.topics ?? []) counts.set(topic, (counts.get(topic) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
}

function getDecadeCounts(books: Book[]) {
  const counts = new Map<number, number>()
  for (const book of books) {
    const decade = Math.floor(book.year / 10) * 10
    counts.set(decade, (counts.get(decade) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => a[0] - b[0])
}

const DECADE_LABEL_MIN_X_GAP = 40 /** viewBox units — prevents tick text overlap in the sidebar */

/**
 * Prefer labels at five evenly spaced points in time, then drop any whose x is too close to a
 * neighbor so dense modern decades do not stack illegible ticks.
 */
function decadeLabelIndicesFromData(
  decades: [number, number][],
  barCenterXs: number[],
): Set<number> {
  const n = decades.length
  if (n === 0) return new Set()
  if (n <= 5) return new Set([...Array(n).keys()])
  const minD = decades[0]![0]
  const maxD = decades[n - 1]![0]
  const span = maxD - minD || 1
  const raw = new Set<number>()
  for (let t = 0; t < 5; t++) {
    const target = minD + (t / 4) * span
    let bestIdx = 0
    let bestDist = Infinity
    for (let i = 0; i < n; i++) {
      const dist = Math.abs(decades[i]![0] - target)
      if (dist < bestDist) {
        bestDist = dist
        bestIdx = i
      }
    }
    raw.add(bestIdx)
  }
  raw.add(0)
  raw.add(n - 1)
  const ordered = [...raw].sort((a, b) => barCenterXs[a]! - barCenterXs[b]!)
  const pick = new Set<number>()
  let lastX = -Infinity
  for (const i of ordered) {
    const edge = i === 0 || i === n - 1
    const x = barCenterXs[i]!
    if (edge || x - lastX >= DECADE_LABEL_MIN_X_GAP) {
      pick.add(i)
      lastX = x
    }
  }
  return pick
}

type DecadeChartProps = {
  decades: [number, number][]
  maxCount: number
  reducedMotion: boolean
}

function DecadeDistributionChart({ decades, maxCount, reducedMotion }: DecadeChartProps) {
  const gradientId = useId().replace(/:/g, '')
  if (decades.length === 0) return null

  const minD = decades[0]![0]
  const maxD = decades[decades.length - 1]![0]
  const span = maxD - minD || 1

  const VB = { w: 320, baseline: 56, labelY: 74, maxBar: 42, padX: 14 }
  const plotW = VB.w - VB.padX * 2
  const xAt = (decade: number) => VB.padX + ((decade - minD) / span) * plotW
  const xs = decades.map(([d]) => xAt(d))

  const barWidths = xs.map((x, i) => {
    const left = i === 0 ? x - VB.padX : x - xs[i - 1]!
    const right = i === xs.length - 1 ? VB.padX + plotW - x : xs[i + 1]! - x
    const slot = Math.min(left, right)
    if (decades.length === 1) return Math.min(14, plotW * 0.2)
    return Math.min(11, Math.max(3.5, slot * 0.9))
  })

  const labelAt = decadeLabelIndicesFromData(decades, xs)
  const barTransition = (index: number) =>
    reducedMotion
      ? { duration: 0 }
      : { duration: 0.5, delay: 0.02 * index, ease: 'easeOut' as const }

  const totalBooks = decades.reduce((s, [, c]) => s + c, 0)

  return (
    <div className="rounded-[20px] border border-white/[0.04] bg-surface-1 backdrop-blur-md px-3 py-4">
      <svg
        viewBox={`0 0 ${VB.w} 82`}
        className="w-full text-text-3"
        role="img"
        aria-label={`Books by publication decade, ${totalBooks} books across ${decades.length} decades.`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5a25a" />
            <stop offset="100%" stopColor="rgba(245,162,90,0.45)" />
          </linearGradient>
        </defs>
        <line
          x1={VB.padX}
          y1={VB.baseline}
          x2={VB.w - VB.padX}
          y2={VB.baseline}
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        {decades.map(([decade, count], index) => {
          const x = xs[index]!
          const w = barWidths[index]!
          const h = Math.max(3, (count / maxCount) * VB.maxBar)
          const showTick = labelAt.has(index)
          const title = `${formatDecadeLabel(decade)} — ${count} book${count === 1 ? '' : 's'}`
          return (
            <g key={decade}>
              <title>{title}</title>
              <motion.rect
                x={x - w / 2}
                width={w}
                rx={1.5}
                fill={`url(#${gradientId})`}
                initial={
                  reducedMotion ? { height: h, y: VB.baseline - h } : { height: 0, y: VB.baseline }
                }
                animate={{ height: h, y: VB.baseline - h }}
                transition={barTransition(index)}
              />
              {showTick ? (
                <text
                  x={x}
                  y={VB.labelY}
                  textAnchor="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 9 }}
                  fill="currentColor"
                >
                  {formatDecadeChartTick(decade)}
                </text>
              ) : null}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function StackDetailPanel({
  books,
  hoveredBook,
  selectedBook,
  coverMap,
  colors,
}: StackDetailPanelProps) {
  const reducedMotion = useReducedMotion()
  const activeBook = selectedBook ?? hoveredBook

  if (!activeBook) {
    const topics = getTopicCounts(books)
    const decades = getDecadeCounts(books)
    const maxDecadeCount = Math.max(...decades.map(([, count]) => count), 1)
    const chartTransition = reducedMotion
      ? { duration: 0 }
      : { duration: 0.6, ease: 'easeOut' as const }

    return (
      <div className="space-y-8 p-8">
        <div className="space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-3">
            Stack detail
          </div>
          <p className="max-w-md text-base leading-relaxed text-text-2">
            Hover a spine for a quick preview, or click one to pin it here while you keep roaming
            the shelf.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-3">
            Top topics
          </h2>
          <div className="space-y-2.5">
            {topics.map(([topic, count]) => (
              <div
                key={topic}
                className="grid grid-cols-[9.5rem_minmax(0,1fr)_2.25rem] items-center gap-x-3"
              >
                <div className="min-w-0 truncate font-satoshi text-sm text-text-2" title={topic}>
                  {topic}
                </div>
                <div className="h-2 min-w-0 overflow-hidden rounded-full bg-surface-2">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={chartTransition}
                    style={{
                      background: 'linear-gradient(90deg, #3ed6c8, rgba(62,214,200,0.6))',
                      width: `${(count / (topics[0]?.[1] ?? 1)) * 100}%`,
                      transformOrigin: 'left',
                    }}
                  />
                </div>
                <div className="text-right font-mono text-xs text-text-3 tabular-nums">{count}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-3">
            Books by decade
          </h2>
          <DecadeDistributionChart
            decades={decades}
            maxCount={maxDecadeCount}
            reducedMotion={reducedMotion}
          />
        </section>
      </div>
    )
  }

  const cover = coverMap[activeBook.id] ?? activeBook.coverUrl
  const bookColor = colors[activeBook.id]
  const extraTopics = (activeBook.topics ?? []).slice(1)

  return (
    <div className="p-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeBook.id}
          initial={{ opacity: 0, y: 10, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.985 }}
          transition={{ duration: reducedMotion ? 0 : 0.22, ease: 'easeOut' }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-3">
              {selectedBook ? 'Pinned selection' : 'Hover preview'}
            </span>
            {bookColor ? (
              <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-3">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: bookColor }} />
                Shelf color
              </span>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-[24px] border border-white/[0.05] bg-surface-1 backdrop-blur-md p-4 shadow-[0_22px_70px_-44px_rgba(0,0,0,0.9)]">
            <div className="flex gap-5">
              <div className="relative shrink-0 overflow-hidden rounded-[20px] border border-white/[0.06] bg-black/20">
                {cover ? (
                  <Image
                    src={cover}
                    alt={activeBook.title}
                    width={320}
                    height={480}
                    className="h-auto w-40 object-cover shadow-2xl shadow-black/40"
                    sizes="160px"
                    unoptimized
                  />
                ) : (
                  <div className="h-48 w-40 bg-surface-2" aria-hidden />
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-3 py-1">
                <div>
                  <div className="font-newsreader text-3xl leading-tight text-text-1">
                    {activeBook.title}
                  </div>
                  <div className="mt-2 font-satoshi text-lg text-text-2">{activeBook.author}</div>
                </div>

                <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-text-3">
                  <span>{formatLibraryYear(activeBook.year)}</span>
                  {activeBook.genre ? <span>{activeBook.genre}</span> : null}
                </div>

                {(activeBook.topics ?? []).length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="rounded-full bg-[#3ed6c8]/16 px-3 py-1 font-mono text-[11px] text-[#3ed6c8]">
                      {activeBook.topics![0]}
                    </span>
                    {extraTopics.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-full bg-surface-2 px-3 py-1 font-mono text-[11px] text-text-2"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {activeBook.whyILoveIt ? (
            <div className="rounded-[20px] border border-white/[0.04] bg-surface-1 backdrop-blur-md p-5">
              <p className="text-sm leading-6 text-text-2">{activeBook.whyILoveIt}</p>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
