'use client'

import { useCallback, useMemo, useState } from 'react'
import clsx from 'clsx'
import type { Book } from '@/lib/books/types'
import type { BookColorMap } from '@/lib/library/colors'
import { getBookColor } from '@/lib/library/colors'
import type { SortMode } from '@/lib/library/sorting'
import { SORT_MODES } from '@/lib/library/sorting'
import {
  groupBooksByAuthor,
  groupBooksByDecade,
  groupBooksByFamily,
  groupBooksByGenre,
} from '@/lib/library/topics'
import { BookStripe } from '@/components/library/BookStripe'
import { StackBottomSheet } from '@/components/library/StackBottomSheet'
import { StackDetailPanel } from '@/components/library/StackDetailPanel'
import { StackSortControls } from '@/components/library/StackSortControls'
import { useReducedMotion } from '@/hooks/useReducedMotion'

type StackLibraryProps = {
  books: Book[]
  colors: BookColorMap
  coverMap: Record<string, string>
  title: string
  description: string
}

type StackGroup = {
  id: string
  label: string
  color: string
  books: Book[]
}

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

function MobileView({
  books,
  colors,
  sortMode,
  onSortChange,
  selectedBook,
  onMobileSelect,
  onMobileClose,
  coverMap,
  title,
  stackCount,
  bookById,
  reducedMotion,
}: {
  books: Book[]
  colors: BookColorMap
  sortMode: SortMode
  onSortChange: (mode: SortMode) => void
  selectedBook: Book | null
  onMobileSelect: (book: Book) => void
  onMobileClose: () => void
  coverMap: Record<string, string>
  title: string
  stackCount: number
  bookById: Map<string, Book>
  reducedMotion: boolean
}) {
  const groups = useMemo(() => buildGroups(books, sortMode), [books, sortMode])

  return (
    <div className="px-4 py-6 md:hidden">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-newsreader text-2xl italic leading-tight tracking-tight text-text-1">
            {title}
          </h1>
          <p className="mt-1 font-mono text-xs text-text-2">
            {books.length} books · {stackCount} stacks
          </p>
          <p className="mt-1 max-w-[18rem] font-mono text-[10px] uppercase tracking-[0.18em] text-text-3">
            Swipe sideways through the shelf
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
        <div
          className="flex min-w-max gap-2 whitespace-nowrap"
          role="toolbar"
          aria-label="Sort book stacks"
        >
          {SORT_MODES.map((mode) => {
            const active = mode.key === sortMode
            return (
              <button
                key={mode.key}
                type="button"
                aria-pressed={active}
                onClick={() => onSortChange(mode.key)}
                className={clsx(
                  'touch-manipulation rounded-full px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors',
                  active ? 'bg-warm text-bg-0' : 'bg-surface-1 text-text-2 hover:bg-surface-2',
                )}
              >
                {mode.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="relative mt-5 rounded-[28px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] p-3 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.92)]">
        <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />
        <div className="pointer-events-none absolute inset-x-5 bottom-3 h-px bg-gradient-to-r from-transparent via-[#f5a25a]/25 to-transparent" />

        <div className="stack-scrollbar overflow-x-auto overscroll-x-contain pb-4 pr-2 touch-pan-x">
          <div className="flex min-w-max items-start gap-4 px-1 pt-1">
            {groups.map((group) => (
              <TopicStack
                key={group.id}
                group={group}
                colors={colors}
                hoveredBookId={null}
                selectedBookId={selectedBook?.id ?? null}
                reducedMotion={reducedMotion}
                onHover={() => {}}
                onSelect={(id) => {
                  const book = bookById.get(id)
                  if (book) onMobileSelect(book)
                }}
                widthClass="w-[222px]"
                compact
              />
            ))}
          </div>
        </div>
      </div>

      <StackBottomSheet book={selectedBook} coverMap={coverMap} onClose={onMobileClose} />
    </div>
  )
}

export function StackLibrary({ books, colors, coverMap, title, description }: StackLibraryProps) {
  const reducedMotion = useReducedMotion()
  const [sortMode, setSortMode] = useState<SortMode>('topic')
  const [hoveredBookId, setHoveredBookId] = useState<string | null>(null)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [mobileSelectedBook, setMobileSelectedBook] = useState<Book | null>(null)

  const bookById = useMemo(() => new Map<string, Book>(books.map((b) => [b.id, b])), [books])

  const groups = useMemo(() => buildGroups(books, sortMode), [books, sortMode])
  const hoveredBook = hoveredBookId ? (bookById.get(hoveredBookId) ?? null) : null
  const selectedBook = selectedBookId ? (bookById.get(selectedBookId) ?? null) : null

  const handleSelect = useCallback((id: string) => {
    setSelectedBookId((current) => (current === id ? null : id))
  }, [])

  const handleMobileSelect = useCallback((book: Book) => {
    setMobileSelectedBook(book)
  }, [])

  const handleMobileClose = useCallback(() => {
    setMobileSelectedBook(null)
  }, [])

  const topTopics = useMemo(() => {
    const topicCounts = new Map<string, number>()
    for (const book of books) {
      for (const topic of book.topics ?? []) {
        topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1)
      }
    }
    return [...topicCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic)
  }, [books])

  return (
    <div className="min-h-screen bg-bg-0 text-text-1">
      <MobileView
        books={books}
        colors={colors}
        sortMode={sortMode}
        onSortChange={setSortMode}
        selectedBook={mobileSelectedBook}
        onMobileSelect={handleMobileSelect}
        onMobileClose={handleMobileClose}
        coverMap={coverMap}
        title={title}
        stackCount={groups.length}
        bookById={bookById}
        reducedMotion={reducedMotion}
      />

      <div className="mx-auto hidden max-w-[2200px] px-6 py-8 md:block">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="font-newsreader text-[2rem] italic leading-none tracking-tight text-text-1">
              {title}
            </h1>
            <p className="mt-2 font-mono text-xs text-text-2">
              {books.length} books · {groups.length} stacks
            </p>
            <p className="mt-2 max-w-xl font-mono text-[10px] uppercase tracking-[0.22em] text-text-3">
              {topTopics.join(' · ')}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-2">
              {description} Scroll sideways through {groups.length} stacks, then click a spine to
              pin it in the detail panel.
            </p>
          </div>

          <div className="shrink-0 rounded-full border border-white/[0.06] bg-white/[0.02] p-1 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.85)]">
            <StackSortControls activeSort={sortMode} onSortChange={setSortMode} />
          </div>
        </div>

        <div className="flex items-start gap-6 xl:gap-8">
          <section className="min-w-0 flex-1">
            <div className="relative overflow-hidden rounded-[32px] border border-white/[0.06] bg-[radial-gradient(circle_at_top_left,rgba(62,214,200,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(245,162,90,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] shadow-[0_28px_120px_-60px_rgba(0,0,0,0.96)]">
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />
              <div className="pointer-events-none absolute inset-x-8 bottom-8 h-px bg-gradient-to-r from-transparent via-[#f5a25a]/25 to-transparent" />
              <div className="pointer-events-none absolute left-8 top-6 font-mono text-[10px] uppercase tracking-[0.22em] text-text-3/80">
                Shelf view
              </div>
              <div className="pointer-events-none absolute right-8 top-6 font-mono text-[10px] uppercase tracking-[0.22em] text-text-3/80">
                Scroll →
              </div>

              <div className="stack-scrollbar max-h-[calc(100vh-230px)] overflow-x-auto overflow-y-auto overscroll-x-contain overscroll-y-contain px-6 pb-8 pt-16 touch-pan-x">
                <div className="flex min-w-max items-start gap-5 pr-4 xl:gap-6">
                  {groups.map((group) => (
                    <TopicStack
                      key={group.id}
                      group={group}
                      colors={colors}
                      hoveredBookId={hoveredBookId}
                      selectedBookId={selectedBookId}
                      reducedMotion={reducedMotion}
                      onHover={setHoveredBookId}
                      onSelect={handleSelect}
                      widthClass="w-[240px] xl:w-[260px]"
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <aside className="sticky top-24 w-[380px] shrink-0 self-start xl:w-[430px]">
            <div className="overflow-hidden rounded-[28px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] shadow-[0_30px_90px_-55px_rgba(0,0,0,0.96)] backdrop-blur-md">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-[#f5a25a]/35 to-transparent" />
              <StackDetailPanel
                books={books}
                hoveredBook={hoveredBook}
                selectedBook={selectedBook}
                coverMap={coverMap}
                colors={colors}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function TopicStack({
  group,
  colors,
  hoveredBookId,
  selectedBookId,
  reducedMotion,
  onHover,
  onSelect,
  widthClass,
  compact = false,
}: {
  group: StackGroup
  colors: BookColorMap
  hoveredBookId: string | null
  selectedBookId: string | null
  reducedMotion: boolean
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
  widthClass: string
  compact?: boolean
}) {
  const hoveredIndex = hoveredBookId
    ? group.books.findIndex((book) => book.id === hoveredBookId)
    : -1

  return (
    <section className={clsx('relative shrink-0', widthClass)}>
      <div
        className={clsx(
          'mb-3 flex items-start gap-3',
          compact ? 'min-h-[3.25rem]' : 'min-h-[3.5rem]',
        )}
      >
        <div
          className={clsx(
            'mt-1 w-[3px] shrink-0 rounded-full shadow-[0_0_18px_currentColor]',
            compact ? 'h-4' : 'h-6',
          )}
          style={{ backgroundColor: group.color, color: group.color }}
        />
        <div className="min-w-0 flex-1">
          <h2
            className={clsx(
              'line-clamp-2 font-newsreader italic leading-snug text-text-1',
              compact ? 'text-sm' : 'text-lg',
            )}
          >
            {group.label}
          </h2>
          <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-text-3">
            {group.books.length} books
          </span>
        </div>
      </div>

      <div className="relative rounded-[22px] border border-white/[0.05] bg-white/[0.02] p-2 shadow-[0_18px_60px_-44px_rgba(0,0,0,0.9)]">
        <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
        <div className={compact ? 'space-y-1' : 'space-y-[2px]'}>
          {group.books.map((book, index) => (
            <BookStripe
              key={book.id}
              book={book}
              color={getBookColor(colors, book.id)}
              isHovered={hoveredBookId === book.id}
              isSelected={selectedBookId === book.id}
              isMultiTopic={(book.topics?.length ?? 0) > 1}
              hoverDistance={hoveredIndex >= 0 ? Math.abs(index - hoveredIndex) : null}
              compact={compact}
              reducedMotion={reducedMotion}
              onHover={onHover}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>

      <div className="mx-3 mt-2 h-[5px] rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.015),rgba(255,255,255,0.09),rgba(245,162,90,0.12),rgba(255,255,255,0.015))]" />
    </section>
  )
}
