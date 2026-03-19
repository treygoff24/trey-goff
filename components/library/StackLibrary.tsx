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
        <div className='mb-4 flex items-center justify-between'>
          <span className='font-newsreader text-lg italic text-text-2'>{books.length} books</span>
          <StackSortControls activeSort={sortMode} onSortChange={setSortMode} />
        </div>

        <div className='flex gap-8'>
          <div className='w-[40%]'>
            <div className='max-h-[calc(100vh-140px)] overflow-y-auto'>
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
            </div>
          </div>

          <div className='sticky top-24 h-fit w-[60%] self-start rounded-2xl border border-white/5 bg-surface-1/30'>
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
