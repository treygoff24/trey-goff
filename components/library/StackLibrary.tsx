'use client'

import { useCallback, useMemo, useState } from 'react'
import { LayoutGroup } from 'framer-motion'
import type { Book } from '@/lib/books/types'
import type { BookColorMap } from '@/lib/library/colors'
import { getBookColor } from '@/lib/library/colors'
import { sortLibrary, type SortMode } from '@/lib/library/sorting'
import { BookStripe } from '@/components/library/BookStripe'
import { StackDetailPanel } from '@/components/library/StackDetailPanel'
import { StackSortControls } from '@/components/library/StackSortControls'
import { StackMobileBarcode } from '@/components/library/StackMobileBarcode'
import { StackBottomSheet } from '@/components/library/StackBottomSheet'

type StackLibraryProps = {
  books: Book[]
  colors: BookColorMap
  coverMap: Record<string, string>
}

export function StackLibrary({ books, colors, coverMap }: StackLibraryProps) {
  const [sortMode, setSortMode] = useState<SortMode>('reading-order')
  const [hoveredBookId, setHoveredBookId] = useState<string | null>(null)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [mobileSelectedBook, setMobileSelectedBook] = useState<Book | null>(null)

  const sortedBooks = useMemo(() => sortLibrary(books, sortMode), [books, sortMode])
  const hoveredBook = useMemo(() => books.find((b) => b.id === hoveredBookId) ?? null, [books, hoveredBookId])
  const selectedBook = useMemo(() => books.find((b) => b.id === selectedBookId) ?? null, [books, selectedBookId])

  const handleMobileSelect = useCallback((book: Book) => setMobileSelectedBook(book), [])
  const handleMobileClose = useCallback(() => setMobileSelectedBook(null), [])

  return (
    <div className='min-h-screen bg-bg-0 text-text-1'>
      {/* Mobile layout */}
      <div className='px-4 py-6 md:hidden'>
        <StackMobileBarcode
          books={sortedBooks}
          colors={colors}
          activeSort={sortMode}
          onSortChange={setSortMode}
          onBookSelect={handleMobileSelect}
        />
        <StackBottomSheet
          book={mobileSelectedBook}
          coverMap={coverMap}
          onClose={handleMobileClose}
        />
      </div>

      {/* Desktop layout */}
      <div className='mx-auto hidden max-w-[1800px] flex-col px-6 py-8 md:flex'>
        <div className='mb-5 flex items-baseline justify-between'>
          <span className='font-newsreader text-2xl italic tracking-tight text-text-1'>{books.length} books</span>
          <StackSortControls activeSort={sortMode} onSortChange={setSortMode} />
        </div>

        <div className='flex gap-6'>
          {/* Stack column */}
          <div className='w-[40%]'>
            <div
              className='stack-scrollbar relative max-h-[calc(100vh-160px)] overflow-y-auto'
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.12) transparent',
              }}
            >
              {/* Top fade gradient */}
              <div className='pointer-events-none sticky top-0 z-10 h-4 w-full bg-gradient-to-b from-bg-0 to-transparent' />
              <LayoutGroup>
                {sortedBooks.map((book) => (
                  <BookStripe
                    key={book.id}
                    book={book}
                    color={getBookColor(colors, book.id)}
                    isHovered={hoveredBookId === book.id}
                    isSelected={selectedBookId === book.id}
                    onHover={setHoveredBookId}
                    onSelect={setSelectedBookId}
                  />
                ))}
              </LayoutGroup>
              {/* Bottom fade gradient */}
              <div className='pointer-events-none sticky bottom-0 z-10 h-8 w-full bg-gradient-to-t from-bg-0 to-transparent' />
            </div>
          </div>

          {/* Detail panel — sticky right column */}
          <div className='sticky top-24 h-fit w-[60%] self-start overflow-hidden rounded-2xl border border-white/[0.02] bg-[rgba(255,255,255,0.012)] shadow-[0_4px_60px_-12px_rgba(0,0,0,0.6)] backdrop-blur-sm'>
            {/* Subtle warm accent top edge */}
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
