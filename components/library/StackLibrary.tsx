'use client'

import { useCallback, useMemo, useState } from 'react'
import { LayoutGroup } from 'framer-motion'
import clsx from 'clsx'
import type { Book } from '@/lib/books/types'
import type { BookColorMap } from '@/lib/library/colors'
import { getBookColor } from '@/lib/library/colors'
import type { SortMode } from '@/lib/library/sorting'
import { SORT_MODES } from '@/lib/library/sorting'
import {
  groupBooksByFamily,
  groupBooksByDecade,
  groupBooksByAuthor,
  groupBooksByGenre,
} from '@/lib/library/topics'
import { BookStripe } from '@/components/library/BookStripe'
import { StackDetailPanel } from '@/components/library/StackDetailPanel'
import { StackSortControls } from '@/components/library/StackSortControls'
import { StackBottomSheet } from '@/components/library/StackBottomSheet'

type StackLibraryProps = {
  books: Book[]
  colors: BookColorMap
  coverMap: Record<string, string>
}

type StackGroup = {
  id: string
  label: string
  color: string
  books: Book[]
}

/**
 * Build groups for the current sort mode.
 */
function buildGroups(books: Book[], sortMode: SortMode): StackGroup[] {
  switch (sortMode) {
    case 'topic': {
      const families = groupBooksByFamily(books)
      return families.map(([family, groupBooks]) => ({
        id: family.id,
        label: family.label,
        color: family.color,
        books: groupBooks,
      }))
    }
    case 'year': {
      return groupBooksByDecade(books).map((g) => ({
        id: g.label,
        label: g.label,
        color: '#F59E0B',
        books: g.books,
      }))
    }
    case 'author': {
      return groupBooksByAuthor(books).map((g) => ({
        id: g.label,
        label: g.label,
        color: '#F97316',
        books: g.books,
      }))
    }
    case 'genre': {
      return groupBooksByGenre(books).map((g) => ({
        id: g.label,
        label: g.label,
        color: '#3B82F6',
        books: g.books,
      }))
    }
  }
}

/**
 * Distribute groups into N columns using a greedy tallest-first algorithm
 * with a round-robin fallback for better balance.
 */
function distributeColumns(groups: StackGroup[], numColumns: number): StackGroup[][] {
  const columns: StackGroup[][] = Array.from({ length: numColumns }, () => [])
  const columnHeights = new Array(numColumns).fill(0)

  // Sort groups tallest-first for better distribution
  const sorted = [...groups].sort((a, b) => b.books.length - a.books.length)

  for (const group of sorted) {
    // Find the shortest column
    let minIdx = 0
    for (let i = 1; i < numColumns; i++) {
      if (columnHeights[i] < columnHeights[minIdx]) minIdx = i
    }
    // Push to the shortest column and sort within that column by original order
    columns[minIdx]!.push(group)
    columnHeights[minIdx]! += group.books.length
  }

  // Refinement pass: try swapping pairs between columns to improve balance
  for (let iter = 0; iter < 10; iter++) {
    let improved = false
    for (let i = 0; i < numColumns; i++) {
      for (let j = i + 1; j < numColumns; j++) {
        const diffBefore = Math.abs(columnHeights[i]! - columnHeights[j]!)
        if (diffBefore <= 1) continue

        // Find best single swap
        for (let ai = 0; ai < columns[i]!.length; ai++) {
          for (let aj = 0; aj < columns[j]!.length; aj++) {
            const a = columns[i]![ai]!.books.length
            const b = columns[j]![aj]!.books.length
            const diffAfter = Math.abs((columnHeights[i]! - a + b) - (columnHeights[j]! - b + a))
            if (diffAfter < diffBefore) {
              // Swap
              const tmp = columns[i]![ai]!
              columns[i]![ai] = columns[j]![aj]!
              columns[j]![aj] = tmp
              columnHeights[i] = columnHeights[i]! - a + b
              columnHeights[j] = columnHeights[j]! - b + a
              improved = true
              break
            }
          }
          if (improved) break
        }
      }
    }
    if (!improved) break
  }

  return columns
}

function MobileView({
  books,
  colors,
  sortMode,
  onSortChange,
  mobileSelectedBook,
  onMobileSelect,
  onMobileClose,
  coverMap,
}: {
  books: Book[]
  colors: BookColorMap
  sortMode: SortMode
  onSortChange: (mode: SortMode) => void
  mobileSelectedBook: Book | null
  onMobileSelect: (book: Book) => void
  onMobileClose: () => void
  coverMap: Record<string, string>
}) {
  const groups = useMemo(() => buildGroups(books, sortMode), [books, sortMode])
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const toggleGroup = useCallback((id: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  return (
    <div className='px-4 py-6 md:hidden'>
      <div className='font-newsreader text-sm italic text-text-2'>{books.length} books</div>

      <div className='mt-3 overflow-x-auto pb-1'>
        <div className='flex min-w-max gap-2 whitespace-nowrap'>
          {SORT_MODES.map((mode) => {
            const active = mode.key === sortMode
            return (
              <button
                key={mode.key}
                type='button'
                onClick={() => onSortChange(mode.key)}
                className={clsx(
                  'rounded-full px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors',
                  active ? 'bg-warm text-bg-0' : 'bg-surface-1 text-text-2 hover:bg-surface-2',
                )}
              >
                {mode.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className='mt-4 space-y-4'>
        <LayoutGroup>
          {groups.map((group) => {
            const collapsed = collapsedGroups.has(group.id)
            return (
              <div key={group.id}>
                <button
                  type='button'
                  onClick={() => toggleGroup(group.id)}
                  className='flex w-full items-baseline gap-2 py-2 text-left'
                >
                  <div
                    className='h-4 w-[2px] shrink-0 rounded-full'
                    style={{ backgroundColor: group.color, opacity: 0.5 }}
                  />
                  <span className='font-newsreader text-base italic text-text-1'>{group.label}</span>
                  <span className='font-mono text-[10px] text-text-3'>{group.books.length}</span>
                  <span className='ml-auto font-mono text-[10px] text-text-3'>
                    {collapsed ? '+' : '\u2013'}
                  </span>
                </button>
                {!collapsed && (
                  <div className='space-y-[1px]'>
                    {group.books.map((book) => (
                      <BookStripe
                        key={book.id}
                        book={book}
                        color={getBookColor(colors, book.id)}
                        isHovered={false}
                        isSelected={false}
                        isMultiTopic={(book.topics?.length ?? 0) > 1}
                        onHover={() => {}}
                        onSelect={() => onMobileSelect(book)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </LayoutGroup>
      </div>

      <StackBottomSheet
        book={mobileSelectedBook}
        coverMap={coverMap}
        onClose={onMobileClose}
      />
    </div>
  )
}

export function StackLibrary({ books, colors, coverMap }: StackLibraryProps) {
  const [sortMode, setSortMode] = useState<SortMode>('topic')
  const [hoveredBookId, setHoveredBookId] = useState<string | null>(null)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [mobileSelectedBook, setMobileSelectedBook] = useState<Book | null>(null)

  const groups = useMemo(() => buildGroups(books, sortMode), [books, sortMode])
  const columns = useMemo(() => distributeColumns(groups, 3), [groups])

  const hoveredBook = useMemo(() => books.find((b) => b.id === hoveredBookId) ?? null, [books, hoveredBookId])
  const selectedBook = useMemo(() => books.find((b) => b.id === selectedBookId) ?? null, [books, selectedBookId])

  const handleMobileSelect = useCallback((book: Book) => setMobileSelectedBook(book), [])
  const handleMobileClose = useCallback(() => setMobileSelectedBook(null), [])

  // Summary of top topics for the header
  const topTopics = useMemo(() => {
    const topicCounts = new Map<string, number>()
    for (const book of books) {
      for (const t of book.topics ?? []) {
        topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1)
      }
    }
    return [...topicCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([t]) => t)
  }, [books])

  return (
    <div className='min-h-screen bg-bg-0 text-text-1'>
      {/* Mobile view */}
      <MobileView
        books={books}
        colors={colors}
        sortMode={sortMode}
        onSortChange={setSortMode}
        mobileSelectedBook={mobileSelectedBook}
        onMobileSelect={handleMobileSelect}
        onMobileClose={handleMobileClose}
        coverMap={coverMap}
      />

      {/* Desktop layout */}
      <div className='mx-auto hidden max-w-[1800px] flex-col px-6 py-8 md:flex'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-baseline justify-between'>
            <span className='font-newsreader text-2xl italic tracking-tight text-text-1'>
              {books.length} books
            </span>
            <StackSortControls activeSort={sortMode} onSortChange={setSortMode} />
          </div>
          <p className='mt-1 font-mono text-xs text-text-3'>
            {topTopics.join(' \u00b7 ')}
          </p>
        </div>

        <div className='flex gap-6'>
          {/* Masonry columns */}
          <div className='flex-1'>
            <div
              className='stack-scrollbar max-h-[calc(100vh-160px)] overflow-y-auto'
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.12) transparent',
              }}
            >
              {/* Top fade */}
              <div className='pointer-events-none sticky top-0 z-10 h-4 w-full bg-gradient-to-b from-bg-0 to-transparent' />

              <div className='flex gap-6'>
                <LayoutGroup>
                  {columns.map((colGroups, colIdx) => (
                    <div key={colIdx} className='flex-1 space-y-6'>
                      {colGroups.map((group) => (
                        <TopicStack
                          key={group.id}
                          group={group}
                          colors={colors}
                          hoveredBookId={hoveredBookId}
                          selectedBookId={selectedBookId}
                          onHover={setHoveredBookId}
                          onSelect={setSelectedBookId}
                        />
                      ))}
                    </div>
                  ))}
                </LayoutGroup>
              </div>

              {/* Bottom fade */}
              <div className='pointer-events-none sticky bottom-0 z-10 h-8 w-full bg-gradient-to-t from-bg-0 to-transparent' />
            </div>
          </div>

          {/* Detail panel */}
          <div className='sticky top-24 h-fit w-[420px] shrink-0 self-start overflow-hidden rounded-2xl border border-white/[0.02] bg-[rgba(255,255,255,0.012)] shadow-[0_4px_60px_-12px_rgba(0,0,0,0.6)] backdrop-blur-sm'>
            <div className='h-[1px] w-full bg-gradient-to-r from-transparent via-warm/30 to-transparent' />
            <StackDetailPanel
              books={books}
              hoveredBook={hoveredBook}
              selectedBook={selectedBook}
              coverMap={coverMap}
              colors={colors}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * A single topic stack — a header + vertical list of book spines.
 */
function TopicStack({
  group,
  colors,
  hoveredBookId,
  selectedBookId,
  onHover,
  onSelect,
}: {
  group: StackGroup
  colors: BookColorMap
  hoveredBookId: string | null
  selectedBookId: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
}) {
  return (
    <div className='relative'>
      {/* Topic header */}
      <div className='mb-2 flex items-baseline gap-2'>
        <h2 className='font-newsreader text-sm italic text-text-1'>{group.label}</h2>
        <span className='font-mono text-[10px] text-text-3'>{group.books.length}</span>
        <div className='ml-2 h-[1px] flex-1 bg-white/[0.04]' />
      </div>

      {/* Vertical accent line + book spines */}
      <div className='border-l-[2px] pl-[6px]' style={{ borderColor: group.color + '55' }}>
        <div className='space-y-[1px]'>
          {group.books.map((book) => (
            <BookStripe
              key={book.id}
              book={book}
              color={getBookColor(colors, book.id)}
              isHovered={hoveredBookId === book.id}
              isSelected={selectedBookId === book.id}
              isMultiTopic={(book.topics?.length ?? 0) > 1}
              onHover={onHover}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
