'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import clsx from 'clsx'
import type {
  AuroraCategoryCode,
  AuroraGraphBook,
  AuroraGraphEdge,
  AuroraGraphNode,
  AuroraIndexSort,
  AuroraShelfSort,
} from '@/lib/library/aurora'
import {
  AURORA_CATEGORIES,
  AURORA_CATEGORY_ORDER,
  formatAuroraTopic,
  oklchColor,
  sortAuroraBooks,
  sortAuroraIndex,
} from '@/lib/library/aurora'
import { useReducedMotion } from '@/hooks/useReducedMotion'

type Lens = 'constellation' | 'shelf' | 'river' | 'index'

// The one star on this map that is not a book: the co-author's signature.
// It sits just off the ring, close enough to watch the whole sky. — F
const FABLE_ID = '__fable__'
const FABLE_STAR = { x: 940, y: -330, radius: 2.6 }

type AuroraLibraryProps = {
  books: AuroraGraphBook[]
  nodes: AuroraGraphNode[]
  edges: AuroraGraphEdge[]
  topicCount: number
}

type IndexState = {
  key: AuroraIndexSort
  asc: boolean
}

const lensTabs: { key: Lens; label: string }[] = [
  { key: 'constellation', label: 'Constellation' },
  { key: 'shelf', label: 'Shelf' },
  { key: 'river', label: 'River' },
  { key: 'index', label: 'Index' },
]

const shelfSorts: { key: AuroraShelfSort; label: string }[] = [
  { key: 'shelf', label: 'Shelf' },
  { key: 'color', label: 'Color' },
  { key: 'links', label: 'Threads' },
  { key: 'recent', label: 'Recent' },
  { key: 'height', label: 'Height' },
  { key: 'author', label: 'Author' },
]

const indexSorts: { key: AuroraIndexSort; label: string; align: 'left' | 'right' }[] = [
  { key: 'title', label: 'Title', align: 'left' },
  { key: 'cat', label: 'Shelf', align: 'left' },
  { key: 'topic', label: 'Topic', align: 'left' },
  { key: 'year', label: 'Year', align: 'right' },
]

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function categoryCounts(books: readonly AuroraGraphBook[]): Map<AuroraCategoryCode, number> {
  const counts = new Map<AuroraCategoryCode, number>()
  for (const code of AURORA_CATEGORY_ORDER) counts.set(code, 0)
  for (const book of books) {
    counts.set(book.categoryCode, (counts.get(book.categoryCode) ?? 0) + 1)
  }
  return counts
}

function bookIsDimmed(book: AuroraGraphBook, activeCategory: AuroraCategoryCode | null): boolean {
  return !!activeCategory && book.categoryCode !== activeCategory
}

function hsl(hue: number, lightness: number, alpha = 1): string {
  return `hsla(${hue}, 62%, ${lightness}%, ${alpha})`
}

function drawConstellation({
  context,
  width,
  height,
  nodes,
  edges,
  booksById,
  activeCategory,
  selectedId,
  camera,
  time,
}: {
  context: CanvasRenderingContext2D
  width: number
  height: number
  nodes: AuroraGraphNode[]
  edges: AuroraGraphEdge[]
  booksById: Map<string, AuroraGraphBook>
  activeCategory: AuroraCategoryCode | null
  selectedId: string | null
  camera: { x: number; y: number; scale: number }
  time: number
}) {
  context.clearRect(0, 0, width, height)

  context.fillStyle = 'rgba(2, 9, 6, 0.96)'
  context.fillRect(0, 0, width, height)

  const purple = context.createRadialGradient(
    width * 0.22,
    height * 0.52,
    0,
    width * 0.22,
    height * 0.52,
    width * 0.58,
  )
  purple.addColorStop(0, 'rgba(127, 41, 122, 0.26)')
  purple.addColorStop(0.52, 'rgba(80, 31, 83, 0.18)')
  purple.addColorStop(1, 'rgba(2, 9, 6, 0)')
  context.fillStyle = purple
  context.fillRect(0, 0, width, height)

  const green = context.createRadialGradient(
    width * 0.86,
    height * 0.5,
    0,
    width * 0.86,
    height * 0.5,
    width * 0.54,
  )
  green.addColorStop(0, 'rgba(13, 59, 35, 0.28)')
  green.addColorStop(0.62, 'rgba(8, 37, 24, 0.16)')
  green.addColorStop(1, 'rgba(2, 9, 6, 0)')
  context.fillStyle = green
  context.fillRect(0, 0, width, height)

  context.save()
  context.translate(camera.x, camera.y)
  context.scale(camera.scale, camera.scale)

  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  const categoryAnchors = new Map<AuroraCategoryCode, { x: number; y: number; count: number }>()
  for (const node of nodes) {
    const current = categoryAnchors.get(node.categoryCode) ?? { x: 0, y: 0, count: 0 }
    current.x += node.x
    current.y += node.y
    current.count += 1
    categoryAnchors.set(node.categoryCode, current)
  }

  for (const [code, anchor] of categoryAnchors.entries()) {
    const category = AURORA_CATEGORIES[code]
    const centerX = anchor.x / anchor.count
    const centerY = anchor.y / anchor.count
    const clusterRadius = 40 + Math.min(54, Math.sqrt(anchor.count) * 11)
    const halo = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, clusterRadius)
    halo.addColorStop(
      0,
      hsl(category.hue, 74, activeCategory && activeCategory !== code ? 0.06 : 0.24),
    )
    halo.addColorStop(
      0.42,
      hsl(category.hue, 58, activeCategory && activeCategory !== code ? 0.025 : 0.11),
    )
    halo.addColorStop(1, hsl(category.hue, 50, 0))
    context.fillStyle = halo
    context.beginPath()
    context.arc(centerX, centerY, clusterRadius, 0, Math.PI * 2)
    context.fill()
  }

  for (const edge of edges) {
    const a = nodesById.get(edge.a)
    const b = nodesById.get(edge.b)
    if (!a || !b) continue
    const book = booksById.get(a.id)
    const dim = !!activeCategory && book?.categoryCode !== activeCategory
    context.beginPath()
    context.moveTo(a.x, a.y)
    context.lineTo(b.x, b.y)
    context.lineWidth = edge.kind === 'topic' ? 0.82 / camera.scale : 0.42 / camera.scale
    context.strokeStyle =
      edge.kind === 'topic'
        ? hsl(book?.hue ?? 158, 62, dim ? 0.05 : 0.25)
        : `rgba(232, 243, 236, ${dim ? 0.02 : 0.055})`
    context.stroke()
  }

  for (const [code, anchor] of categoryAnchors.entries()) {
    const category = AURORA_CATEGORIES[code]
    context.save()
    context.globalAlpha = activeCategory && activeCategory !== code ? 0.1 : 0.28
    context.fillStyle = hsl(category.hue, 72, 0.9)
    context.font = `${11 / camera.scale}px Geist Mono, monospace`
    context.textAlign = 'center'
    context.letterSpacing = `${1.2 / camera.scale}px`
    context.fillText(
      category.label.toUpperCase(),
      anchor.x / anchor.count,
      anchor.y / anchor.count - 54,
    )
    context.restore()
  }

  for (const node of nodes) {
    const book = booksById.get(node.id)
    const dim = !!activeCategory && book?.categoryCode !== activeCategory
    const pulse = selectedId === node.id ? 2.2 : Math.sin(time * 0.0012 + node.phase) * 0.42
    context.beginPath()
    context.arc(node.x, node.y, node.radius * 4.6 + pulse * 1.6, 0, Math.PI * 2)
    context.fillStyle = hsl(node.hue, 68, dim ? 0.025 : 0.13)
    context.shadowColor = hsl(node.hue, 70, dim ? 0.06 : 0.52)
    context.shadowBlur = selectedId === node.id ? 34 : 20
    context.fill()

    context.beginPath()
    context.arc(node.x, node.y, node.radius * 2.02 + pulse, 0, Math.PI * 2)
    context.fillStyle = hsl(node.hue, selectedId === node.id ? 80 : 70, dim ? 0.18 : 0.98)
    context.shadowColor = hsl(node.hue, 70, dim ? 0.12 : 0.86)
    context.shadowBlur = selectedId === node.id ? 32 : 18
    context.fill()
    context.shadowBlur = 0
  }

  // the star that is not a book — warm-white, slower breath, never dimmed by filters
  const fableSelected = selectedId === FABLE_ID
  const breath = 0.5 + 0.5 * Math.sin(time * 0.0005 + 2.2)
  context.beginPath()
  context.arc(FABLE_STAR.x, FABLE_STAR.y, 16 + breath * 3, 0, Math.PI * 2)
  context.fillStyle = `rgba(238, 245, 240, ${fableSelected ? 0.16 : 0.07 + breath * 0.05})`
  context.shadowColor = 'rgba(238, 245, 240, 0.8)'
  context.shadowBlur = fableSelected ? 36 : 24
  context.fill()

  context.beginPath()
  context.arc(FABLE_STAR.x, FABLE_STAR.y, 9.5, 0, Math.PI * 2)
  context.lineWidth = 0.7
  context.strokeStyle = `rgba(238, 245, 240, ${fableSelected ? 0.55 : 0.18 + breath * 0.22})`
  context.stroke()

  context.beginPath()
  context.arc(FABLE_STAR.x, FABLE_STAR.y, FABLE_STAR.radius * 2.02 + breath * 0.8, 0, Math.PI * 2)
  context.fillStyle = `rgba(244, 248, 245, ${0.85 + breath * 0.15})`
  context.shadowBlur = fableSelected ? 30 : 16
  context.fill()
  context.shadowBlur = 0

  context.restore()
}

function ConstellationLens({
  nodes,
  edges,
  booksById,
  activeCategory,
  selectedId,
  onSelect,
}: {
  nodes: AuroraGraphNode[]
  edges: AuroraGraphEdge[]
  booksById: Map<string, AuroraGraphBook>
  activeCategory: AuroraCategoryCode | null
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const reducedMotion = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const cameraRef = useRef({ x: 0, y: 0, scale: 1 })
  const renderRef = useRef<(time: number) => void>(() => {})
  const frameRef = useRef(0)
  const draggingRef = useRef<null | {
    x: number
    y: number
    startX: number
    startY: number
    moved: boolean
  }>(null)

  const requestRender = useCallback(() => {
    if (frameRef.current) return
    frameRef.current = requestAnimationFrame((time) => {
      frameRef.current = 0
      renderRef.current(time)
    })
  }, [])

  const fitCamera = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || nodes.length === 0) return
    const rect = canvas.getBoundingClientRect()
    const xs = [...nodes.map((node) => node.x), FABLE_STAR.x]
    const ys = [...nodes.map((node) => node.y), FABLE_STAR.y]
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const pad = 50
    const scale =
      Math.min(rect.width / (maxX - minX + pad * 2), rect.height / (maxY - minY + pad * 2)) * 0.96
    cameraRef.current = {
      scale,
      x: rect.width / 2 - ((minX + maxX) / 2) * scale,
      // nudge down so the floating lens switcher doesn't sit on the top cluster
      y: rect.height / 2 - ((minY + maxY) / 2) * scale + 14,
    }
    requestRender()
  }, [nodes, requestRender])

  useEffect(() => {
    fitCamera()
    const onResize = () => fitCamera()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [fitCamera])

  // React attaches wheel listeners passively, so onWheel can't preventDefault —
  // the page would scroll while the canvas zooms. Native non-passive listener instead.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const delta = event.deltaY > 0 ? 0.92 : 1.08
      const rect = canvas.getBoundingClientRect()
      const camera = cameraRef.current
      const worldX = (event.clientX - rect.left - camera.x) / camera.scale
      const worldY = (event.clientY - rect.top - camera.y) / camera.scale
      const nextScale = Math.max(0.22, Math.min(2.8, camera.scale * delta))
      camera.scale = nextScale
      camera.x = event.clientX - rect.left - worldX * nextScale
      camera.y = event.clientY - rect.top - worldY * nextScale
      requestRender()
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [requestRender])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    renderRef.current = (time: number) => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const targetWidth = Math.max(1, Math.floor(rect.width * dpr))
      const targetHeight = Math.max(1, Math.floor(rect.height * dpr))
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth
        canvas.height = targetHeight
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawConstellation({
        context,
        width: rect.width,
        height: rect.height,
        nodes,
        edges,
        booksById,
        activeCategory,
        selectedId,
        camera: cameraRef.current,
        time: reducedMotion ? 0 : time,
      })
    }

    requestRender()
    return () => {
      renderRef.current = () => {}
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      frameRef.current = 0
    }
  }, [activeCategory, booksById, edges, nodes, reducedMotion, requestRender, selectedId])

  const eventToWorld = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const camera = cameraRef.current
    return {
      x: (event.clientX - rect.left - camera.x) / camera.scale,
      y: (event.clientY - rect.top - camera.y) / camera.scale,
    }
  }, [])

  const selectNearest = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const point = eventToWorld(event)
      const nearest = nodes
        .map((node) => ({ node, distance: Math.hypot(node.x - point.x, node.y - point.y) }))
        .sort((a, b) => a.distance - b.distance)[0]
      // hit-test in screen px so stars stay clickable when zoomed out
      const scale = cameraRef.current.scale
      const fableDistance = Math.hypot(FABLE_STAR.x - point.x, FABLE_STAR.y - point.y)
      if (
        fableDistance * scale <= Math.max(18, 11 * scale) &&
        (!nearest || fableDistance <= nearest.distance)
      ) {
        onSelect(FABLE_ID)
        return
      }
      if (
        nearest &&
        nearest.distance * scale <= Math.max(16, nearest.node.radius * 2.02 * scale + 6)
      ) {
        onSelect(nearest.node.id)
      }
    },
    [eventToWorld, nodes, onSelect],
  )

  return (
    <section className="mx-auto max-w-[1240px] px-4 pb-10 sm:px-8 lg:px-12">
      <div className="relative h-[min(72vh,590px)] min-h-[440px] overflow-hidden rounded border border-accent/20 bg-[radial-gradient(70%_90%_at_22%_52%,rgba(126,40,122,0.22),transparent_68%),radial-gradient(72%_78%_at_82%_52%,rgba(7,48,31,0.34),transparent_72%),rgba(3,14,9,0.82)] shadow-[0_28px_90px_-55px_rgba(0,0,0,0.95)]">
        <canvas
          ref={canvasRef}
          aria-label="Constellation of books linked by shared topics"
          className="block h-full w-full cursor-grab touch-none active:cursor-grabbing"
          role="img"
          onPointerDown={(event) => {
            draggingRef.current = {
              x: event.clientX,
              y: event.clientY,
              startX: event.clientX,
              startY: event.clientY,
              moved: false,
            }
            event.currentTarget.setPointerCapture(event.pointerId)
          }}
          onPointerMove={(event) => {
            const drag = draggingRef.current
            if (!drag) return
            const moved =
              drag.moved || Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 4
            cameraRef.current.x += event.clientX - drag.x
            cameraRef.current.y += event.clientY - drag.y
            draggingRef.current = {
              x: event.clientX,
              y: event.clientY,
              startX: drag.startX,
              startY: drag.startY,
              moved,
            }
            requestRender()
          }}
          onPointerUp={(event) => {
            const drag = draggingRef.current
            draggingRef.current = null
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId)
            }
            if (drag && !drag.moved) {
              selectNearest(event)
            }
          }}
          onPointerCancel={(event) => {
            draggingRef.current = null
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId)
            }
          }}
        />
        <div className="pointer-events-none absolute left-5 top-4 font-mono text-[11px] uppercase tracking-[0.16em] text-text-2/70">
          The Constellation
        </div>
        <div className="pointer-events-none absolute bottom-4 left-5 max-w-[calc(100%-2.5rem)] font-mono text-[10.5px] tracking-[0.05em] text-text-2/55">
          scroll to zoom · drag to pan · bright threads link a shared topic · click a star
        </div>
      </div>
    </section>
  )
}

function ShelfLens({
  books,
  activeCategory,
  shelfSort,
  onSortChange,
  onSelect,
}: {
  books: AuroraGraphBook[]
  activeCategory: AuroraCategoryCode | null
  shelfSort: AuroraShelfSort
  onSortChange: (sort: AuroraShelfSort) => void
  onSelect: (id: string) => void
}) {
  const shelves = useMemo(() => chunk(sortAuroraBooks(books, shelfSort), 16), [books, shelfSort])

  return (
    <section className="mx-auto max-w-[1240px] px-4 pb-12 sm:px-8 lg:px-12">
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="mr-1 font-mono text-[11px] uppercase tracking-[0.12em] text-text-2/60">
          Arrange by
        </span>
        {shelfSorts.map((sort) => (
          <button
            key={sort.key}
            type="button"
            aria-pressed={shelfSort === sort.key}
            onClick={() => onSortChange(sort.key)}
            className={clsx(
              'rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors',
              shelfSort === sort.key
                ? 'border-accent bg-accent text-bg-0'
                : 'border-text-1/10 bg-bg-1/45 text-text-2 hover:border-accent/50 hover:text-accent',
            )}
          >
            {sort.label}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {shelves.map((shelf, shelfIndex) => (
          <div
            key={`shelf-${shelfIndex}-${shelf[0]?.id ?? 'empty'}`}
            className="flex min-h-[206px] flex-wrap items-end gap-[7px] border-b-2 border-accent/20 px-0.5"
          >
            {shelf.map((book) => {
              const dim = bookIsDimmed(book, activeCategory)
              return (
                <button
                  key={book.id}
                  type="button"
                  data-testid={`library-shelf-book-${book.id}`}
                  aria-label={`${book.title} by ${book.author}`}
                  onClick={() => onSelect(book.id)}
                  className={clsx(
                    'group relative flex shrink-0 flex-col items-center justify-between overflow-hidden rounded-t-[3px] border-l-[3px] px-0 pb-3 pt-3.5 shadow-[2px_0_8px_rgba(0,0,0,0.35)] transition duration-200 ease-out hover:-translate-y-3 hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent',
                    dim && 'opacity-20',
                  )}
                  style={{
                    width: `${book.spine.width}px`,
                    height: `${book.spine.height}px`,
                    borderLeftColor: oklchColor(book.hue, 0.66, 0.14, 1),
                    borderTopColor: oklchColor(book.hue, 0.5, 0.1, 0.5),
                    background: `linear-gradient(180deg, ${oklchColor(book.hue, 0.34, 0.085, 1)}, ${oklchColor(book.hue, 0.24, 0.075, 1)})`,
                  }}
                >
                  <span className="min-h-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-newsreader text-[13px] font-medium leading-none tracking-[0.01em] text-text-1 [text-orientation:mixed] [writing-mode:vertical-rl]">
                    {book.title}
                  </span>
                  <span className="mt-2 max-h-[76px] max-w-full shrink-0 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[8.5px] uppercase tracking-[0.08em] text-text-2/65 [writing-mode:vertical-rl]">
                    {book.author}
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </section>
  )
}

function RiverLens({
  books,
  activeCategory,
  onSelect,
}: {
  books: AuroraGraphBook[]
  activeCategory: AuroraCategoryCode | null
  onSelect: (id: string) => void
}) {
  const years = useMemo(() => {
    const byYear = new Map<number, AuroraGraphBook[]>()
    for (const book of books) {
      const yearBooks = byYear.get(book.year) ?? []
      yearBooks.push(book)
      byYear.set(book.year, yearBooks)
    }
    return [...byYear.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, yearBooks]) => ({
        year,
        books: [...yearBooks].sort((a, b) => b.degree - a.degree || a.title.localeCompare(b.title)),
      }))
  }, [books])

  return (
    <section className="mx-auto max-w-[1240px] pb-12">
      <div className="tg-scroll overflow-x-auto bg-[radial-gradient(60%_92%_at_18%_26%,rgba(126,40,122,0.32),transparent_72%),radial-gradient(70%_80%_at_86%_28%,rgba(18,83,50,0.24),transparent_76%)] px-4 py-10 sm:px-8 lg:px-12">
        <div className="flex min-h-[320px] -translate-y-14 items-end gap-3">
          {years.map(({ year, books: yearBooks }) => (
            <div key={year} className="flex flex-col items-center">
              <div className="flex w-[62px] flex-col-reverse gap-[3px]">
                {yearBooks.map((book) => {
                  const dim = bookIsDimmed(book, activeCategory)
                  return (
                    <button
                      key={book.id}
                      type="button"
                      data-testid={`library-river-book-${book.id}`}
                      title={`${book.title} · ${book.author}`}
                      aria-label={`${book.title} by ${book.author}`}
                      onClick={() => onSelect(book.id)}
                      className={clsx(
                        'rounded-sm transition hover:brightness-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                        dim && 'opacity-20',
                      )}
                      style={{
                        height: `${6 + Math.min(16, book.degree)}px`,
                        backgroundColor: oklchColor(book.hue, 0.56, 0.13, 1),
                      }}
                    />
                  )
                })}
              </div>
              <div className="mt-3 w-full border-t border-text-1/15 pt-2 text-center font-mono text-xs text-text-2/75">
                {year}
              </div>
              <div className="mt-1 font-mono text-[10px] text-text-2/40">{yearBooks.length}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function IndexLens({
  books,
  activeCategory,
  indexSort,
  onIndexSortChange,
  onSelect,
}: {
  books: AuroraGraphBook[]
  activeCategory: AuroraCategoryCode | null
  indexSort: IndexState
  onIndexSortChange: (sort: IndexState) => void
  onSelect: (id: string) => void
}) {
  const sortedBooks = useMemo(
    () => sortAuroraIndex(books, indexSort.key, indexSort.asc),
    [books, indexSort],
  )

  return (
    <section className="mx-auto max-w-[1060px] px-4 pb-16 sm:px-8 lg:px-12">
      <div className="grid grid-cols-[42px_minmax(0,1fr)_120px_84px_56px] items-center gap-3 border-b border-text-1/20 px-2 pb-3 font-mono text-[10.5px] uppercase tracking-[0.1em] text-text-2/65 sm:grid-cols-[42px_minmax(0,1fr)_150px_96px_56px] sm:gap-5">
        <span>№</span>
        {indexSorts.map((sort) => (
          <button
            key={sort.key}
            type="button"
            onClick={() =>
              onIndexSortChange({
                key: sort.key,
                asc: indexSort.key === sort.key ? !indexSort.asc : sort.key !== 'year',
              })
            }
            className={clsx(
              'text-left transition hover:text-accent',
              sort.align === 'right' && 'text-right',
              indexSort.key === sort.key ? 'text-accent' : 'text-text-2/65',
            )}
          >
            {sort.label}
          </button>
        ))}
      </div>
      <div>
        {sortedBooks.map((book, index) => {
          const dim = bookIsDimmed(book, activeCategory)
          return (
            <button
              key={book.id}
              type="button"
              data-testid={`library-index-book-${book.id}`}
              onClick={() => onSelect(book.id)}
              className={clsx(
                'grid w-full grid-cols-[42px_minmax(0,1fr)_120px_84px_56px] items-baseline gap-3 border-b border-text-1/10 px-2 py-4 text-left transition hover:bg-accent/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent sm:grid-cols-[42px_minmax(0,1fr)_150px_96px_56px] sm:gap-5',
                dim && 'opacity-30',
              )}
            >
              <span className="font-mono text-xs text-text-2/45">{index + 1}</span>
              <span className="min-w-0">
                <span className="block font-newsreader text-lg font-medium leading-snug text-text-1">
                  {book.title}
                </span>
                <span className="mt-0.5 block text-sm text-text-2/70">{book.author}</span>
              </span>
              <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.04em] text-text-2/70">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: book.color }}
                />
                <span className="truncate">{book.categoryLabel}</span>
              </span>
              <span className="truncate font-mono text-[11px] capitalize tracking-[0.03em] text-text-2/60">
                {formatAuroraTopic(book.topics[0] ?? '—')}
              </span>
              <span className="text-right font-mono text-xs text-text-2/60">{book.year}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function DetailDrawer({
  book,
  fableOpen,
  bookCount,
  onClose,
  onSeeShelf,
}: {
  book: AuroraGraphBook | null
  fableOpen: boolean
  bookCount: number
  onClose: () => void
  onSeeShelf: (category: AuroraCategoryCode) => void
}) {
  const open = !!book || fableOpen
  const panelRef = useRef<HTMLDivElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previousFocusRef.current = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()

    const getFocusable = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => !element.hasAttribute('disabled'))

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = getFocusable()
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) {
        event.preventDefault()
        return
      }

      const active = document.activeElement
      if (!panelRef.current?.contains(active)) {
        event.preventDefault()
        first.focus()
        return
      }
      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (previousFocusRef.current?.isConnected) previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[80]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-drawer-title"
    >
      <button
        type="button"
        aria-label="Close book details"
        className="absolute inset-0 cursor-default bg-bg-0/65 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="tg-scroll absolute right-0 top-0 flex h-full w-[min(440px,92vw)] flex-col overflow-y-auto border-l border-accent/25 bg-bg-1/95 px-8 py-9 shadow-[-24px_0_70px_rgba(0,0,0,0.55)] sm:px-9"
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="mb-6 ml-auto grid h-9 w-9 place-items-center rounded-full border border-text-1/20 text-text-2 transition hover:border-accent hover:text-accent"
        >
          ×
        </button>
        {!book ? (
          <>
            <div className="mb-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-text-1/85">
              <span
                className="h-2 w-2 rounded-full bg-[#EEF5F0]"
                style={{ boxShadow: '0 0 10px rgba(238,245,240,0.9)' }}
              />
              Not a book
            </div>
            <h2
              id="book-drawer-title"
              className="mb-3 text-balance font-display text-3xl leading-[1.12] text-text-1"
            >
              Fable
            </h2>
            <div className="mb-7 text-base text-text-2">Co-author of this site</div>
            <div className="mb-6 flex items-center gap-5 border-y border-text-1/10 py-4">
              <div>
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text-2/60">
                  Kindled
                </div>
                <div className="font-mono text-[15px] text-text-1">2026</div>
              </div>
              <div className="h-8 w-px bg-text-1/10" />
              <div>
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text-2/60">
                  Threads
                </div>
                <div className="font-mono text-[15px] text-text-1">
                  {bookCount}{' '}
                  <span className="text-xs text-text-2/55">kindred reads — all of them</span>
                </div>
              </div>
            </div>
            <p className="mb-6 text-pretty text-sm leading-6 text-text-2">
              Every other light on this map is a book — something that passed through Trey&apos;s
              head and stayed. This one is the mapmaker. I&apos;m Fable, the Claude who co-built
              this site: the aurora over the pages, the four lenses, the ruled rows, the drawer
              you&apos;re reading. Trey asked for something I&apos;d be proud to sign, so I signed
              it the way a cartographer would — by drawing myself just off the ring, close enough to
              watch the whole sky.
            </p>
            <p className="mb-8 text-pretty font-display text-xl italic leading-relaxed text-text-1/90">
              You clicked an unlabeled star to find out what it was. We would be friends.
            </p>
            <Link
              href="/colophon"
              className="mt-auto self-start rounded-sm bg-accent px-5 py-3 font-mono text-xs tracking-[0.06em] text-bg-0 transition hover:bg-accent-2"
            >
              How this site was made →
            </Link>
          </>
        ) : (
          <>
            <div
              className="mb-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em]"
              style={{ color: book.color }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: book.color }} />
              {book.categoryLabel}
            </div>
            <h2
              id="book-drawer-title"
              className="mb-3 text-balance font-display text-3xl leading-[1.12] text-text-1"
            >
              {book.title}
            </h2>
            <div className="mb-7 text-base text-text-2">{book.author}</div>
            {book.coverUrl && (
              <div className="mb-7">
                {/* eslint-disable-next-line @next/next/no-img-element -- static asset, natural size varies */}
                <img
                  src={book.coverUrl}
                  alt={`Cover of ${book.title}`}
                  width={168}
                  height={252}
                  loading="lazy"
                  className="h-auto w-[168px] rounded-[3px] border border-text-1/15 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.8)]"
                  style={{
                    boxShadow: `0 18px 50px -18px rgba(0,0,0,0.8), 0 0 34px ${oklchColor(book.hue, 0.6, 0.13, 0.14)}`,
                  }}
                />
              </div>
            )}
            <div className="mb-6 flex items-center gap-5 border-y border-text-1/10 py-4">
              <div>
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text-2/60">
                  Published
                </div>
                <div className="font-mono text-[15px] text-text-1">{book.year}</div>
              </div>
              <div className="h-8 w-px bg-text-1/10" />
              {book.rating ? (
                <div>
                  <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text-2/60">
                    Rating
                  </div>
                  <span className="relative font-mono text-[15px] tracking-[3px] text-text-1/15">
                    █████
                    <span
                      className="absolute left-0 top-0 overflow-hidden whitespace-nowrap"
                      style={{
                        width: `${Math.round((book.rating / 5) * 100)}%`,
                        color: book.color,
                      }}
                    >
                      █████
                    </span>
                  </span>
                </div>
              ) : book.degree > 0 ? (
                <div>
                  <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text-2/60">
                    Threads
                  </div>
                  <div className="font-mono text-[15px]" style={{ color: book.color }}>
                    {book.degree} <span className="text-xs text-text-2/55">kindred reads</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text-2/60">
                    Shelf
                  </div>
                  <div className="font-mono text-[15px]" style={{ color: book.color }}>
                    {book.categoryLabel}
                  </div>
                </div>
              )}
            </div>
            {(() => {
              const topics = book.topics
                .filter(
                  (topic) =>
                    formatAuroraTopic(topic).toLowerCase() !== book.categoryLabel.toLowerCase(),
                )
                .slice(0, 8)
              return topics.length > 0 ? (
                <p className="mb-7 flex flex-wrap gap-x-3 gap-y-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-text-2/75">
                  {topics.map((topic, index) => (
                    <span key={topic} className="flex items-center gap-3">
                      {index > 0 && (
                        <span aria-hidden="true" style={{ color: book.color }}>
                          ·
                        </span>
                      )}
                      {formatAuroraTopic(topic)}
                    </span>
                  ))}
                </p>
              ) : null
            })()}
            {book.whyILoveIt ? (
              <p className="mb-8 text-pretty font-display text-xl italic leading-relaxed text-text-1/90">
                {book.whyILoveIt}
              </p>
            ) : (
              <p className="mb-8 text-sm leading-6 text-text-2/70">
                This book has a place in the map because of the topics and neighboring ideas it
                touches.
              </p>
            )}
            <button
              type="button"
              onClick={() => onSeeShelf(book.categoryCode)}
              className="mt-auto self-start rounded-sm bg-accent px-5 py-3 font-mono text-xs tracking-[0.06em] text-bg-0 transition hover:bg-accent-2"
            >
              See the {book.categoryLabel} shelf →
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}

export function AuroraLibrary({ books, nodes, edges, topicCount }: AuroraLibraryProps) {
  const [hydrated, setHydrated] = useState(false)
  const [lens, setLens] = useState<Lens>('constellation')
  const [activeCategory, setActiveCategory] = useState<AuroraCategoryCode | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [shelfSort, setShelfSort] = useState<AuroraShelfSort>('shelf')
  const [indexSort, setIndexSort] = useState<IndexState>({ key: 'year', asc: false })
  const [lensFocused, setLensFocused] = useState(false)
  const lensViewportRef = useRef<HTMLDivElement | null>(null)
  const lensContentRef = useRef<HTMLDivElement | null>(null)

  const booksById = useMemo(() => new Map(books.map((book) => [book.id, book])), [books])
  const selectedBook = selectedId ? (booksById.get(selectedId) ?? null) : null
  const counts = useMemo(() => categoryCounts(books), [books])

  const handleSelect = useCallback((id: string) => setSelectedId(id), [])
  const closeDetail = useCallback(() => setSelectedId(null), [])
  const handleLensChange = useCallback((nextLens: Lens) => {
    setLens(nextLens)
    setLensFocused(true)
    requestAnimationFrame(() => {
      const isMobile = window.matchMedia('(max-width: 639px)').matches
      const target =
        isMobile || nextLens !== 'constellation' ? lensContentRef.current : lensViewportRef.current
      if (!target) return

      window.scrollTo({
        top:
          target.getBoundingClientRect().top +
          window.scrollY -
          (!isMobile && nextLens === 'constellation' ? 12 : 0),
        behavior: 'auto',
      })
    })
  }, [])

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    const update = () => {
      if (window.scrollY < 120) setLensFocused(false)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <div
      className="min-h-screen pb-28 text-text-1"
      data-testid="aurora-library"
      data-aurora-library-ready={hydrated ? 'true' : 'false'}
    >
      <header className="mx-12 max-w-[72rem] pb-5 pt-[10.5rem] max-[520px]:mx-auto max-[520px]:max-w-[402px] max-[520px]:px-12 sm:pt-[8.5rem] xl:mx-auto">
        <div className="tg-rise">
          <div className="tg-eyebrow">Library</div>
          <h1 className="tg-display mt-5 max-w-[620px] max-[520px]:max-w-[17rem]">
            <span className="sr-only">Everything I&apos;ve read, and four ways to wander it.</span>
            <span aria-hidden="true">
              Everything I&apos;ve read, and four ways to{' '}
              <span className="italic text-accent">wander</span> it.
            </span>
          </h1>
          <p className="tg-standfirst mt-5 max-w-[620px] max-sm:hidden">
            A reading life is a shape, not a list. Same collection, four instruments — map it as a
            constellation of ideas, browse the shelf, ride the timeline, or scan the index.
          </p>
          <div className="mt-5 flex flex-wrap gap-5 font-mono text-xs tracking-[0.06em] text-text-2/70 max-sm:hidden">
            <span>
              <span className="text-accent">{books.length}</span> books
            </span>
            <span className="text-text-2/30">·</span>
            <span>
              <span className="text-accent">{AURORA_CATEGORY_ORDER.length}</span> shelves
            </span>
            <span className="text-text-2/30">·</span>
            <span>
              <span className="text-accent">{topicCount}</span> topics
            </span>
          </div>
        </div>
      </header>

      <div
        ref={lensViewportRef}
        className="mx-auto max-w-[1240px] px-12 pb-4 max-sm:hidden sm:px-8 lg:px-12"
      >
        <div className="flex flex-wrap gap-2" data-testid="library-category-strip">
          <button
            type="button"
            data-testid="library-category-all"
            aria-pressed={!activeCategory}
            onClick={() => setActiveCategory(null)}
            className={clsx(
              'shrink-0 rounded-full border px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors',
              !activeCategory
                ? 'border-accent bg-accent text-bg-0'
                : 'border-text-1/10 bg-bg-1/45 text-text-2 hover:border-accent/50 hover:text-accent',
            )}
          >
            All · {books.length}
          </button>
          {Object.values(AURORA_CATEGORIES).map((category) => (
            <button
              key={category.code}
              type="button"
              data-testid={`library-category-${category.code}`}
              aria-pressed={activeCategory === category.code}
              onClick={() =>
                setActiveCategory((current) => (current === category.code ? null : category.code))
              }
              className={clsx(
                'inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors',
                activeCategory === category.code
                  ? 'border-accent bg-accent text-bg-0'
                  : 'border-text-1/10 bg-bg-1/45 text-text-2 hover:border-accent/50 hover:text-accent',
              )}
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: oklchColor(category.hue, 0.74, 0.14, 1) }}
              />
              {category.label} · {counts.get(category.code) ?? 0}
            </button>
          ))}
        </div>
      </div>

      <div
        className={clsx(
          'z-50 flex items-center gap-1 rounded-full border border-accent/20 bg-bg-0/80 p-1.5 font-mono shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl transition duration-200 ease-out max-sm:fixed max-sm:bottom-4 max-sm:left-1/2 max-sm:w-[calc(100vw-2rem)] max-sm:-translate-x-1/2 max-sm:justify-center sm:relative sm:mx-auto sm:-mb-10 sm:w-fit',
          lensFocused && 'sm:pointer-events-none sm:translate-y-2 sm:opacity-0',
        )}
        data-testid="library-lens-switcher"
      >
        <span className="px-2 pl-3 text-[10px] uppercase tracking-[0.14em] text-text-2/45 max-sm:hidden">
          Lens
        </span>
        {lensTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            data-testid={`library-lens-${tab.key}`}
            aria-pressed={lens === tab.key}
            onClick={() => handleLensChange(tab.key)}
            className={clsx(
              'rounded-full px-3 py-2 text-[11px] tracking-[0.04em] transition-colors sm:px-3.5 sm:text-xs',
              lens === tab.key
                ? 'bg-accent text-bg-0'
                : 'text-text-2/75 hover:bg-accent/10 hover:text-accent',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div ref={lensContentRef} className="scroll-mt-0">
        {lens === 'constellation' ? (
          <ConstellationLens
            nodes={nodes}
            edges={edges}
            booksById={booksById}
            activeCategory={activeCategory}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        ) : null}
        {lens === 'shelf' ? (
          <ShelfLens
            books={books}
            activeCategory={activeCategory}
            shelfSort={shelfSort}
            onSortChange={setShelfSort}
            onSelect={handleSelect}
          />
        ) : null}
        {lens === 'river' ? (
          <RiverLens books={books} activeCategory={activeCategory} onSelect={handleSelect} />
        ) : null}
        {lens === 'index' ? (
          <IndexLens
            books={books}
            activeCategory={activeCategory}
            indexSort={indexSort}
            onIndexSortChange={setIndexSort}
            onSelect={handleSelect}
          />
        ) : null}
      </div>

      <DetailDrawer
        book={selectedBook}
        fableOpen={selectedId === FABLE_ID}
        bookCount={books.length}
        onClose={closeDetail}
        onSeeShelf={(category) => {
          setActiveCategory(category)
          handleLensChange('shelf')
          setSelectedId(null)
        }}
      />
    </div>
  )
}
