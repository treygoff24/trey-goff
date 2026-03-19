'use client'

import clsx from 'clsx'
import { motion } from 'framer-motion'
import type { Book } from '@/lib/books/types'
import type { BookColorMap } from '@/lib/library/colors'
import type { SortMode } from '@/lib/library/sorting'
import { SORT_MODES } from '@/lib/library/sorting'

type StackMobileBarcodeProps = {
  books: Book[]
  colors: BookColorMap
  activeSort: SortMode
  onSortChange: (mode: SortMode) => void
  onBookSelect: (book: Book) => void
}

export function StackMobileBarcode({ books, colors, activeSort, onSortChange, onBookSelect }: StackMobileBarcodeProps) {
  return (
    <div className='space-y-4'>
      <div className='font-newsreader text-sm italic text-text-2'>{books.length} books</div>

      <div className='overflow-x-auto pb-1'>
        <div className='flex min-w-max gap-2 whitespace-nowrap'>
          {SORT_MODES.map((mode) => {
            const active = mode.key === activeSort

            return (
              <motion.button
                key={mode.key}
                type='button'
                onClick={() => onSortChange(mode.key)}
                whileTap={{ scale: 0.98 }}
                className={clsx(
                  'rounded-full px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors',
                  active ? 'bg-warm text-bg-0' : 'bg-surface-1 text-text-2 hover:bg-surface-2',
                )}
              >
                {mode.label}
              </motion.button>
            )
          })}
        </div>
      </div>

      <div className='overflow-x-auto overscroll-x-contain pb-2' style={{ scrollSnapType: 'x proximity' }}>
        <div className='flex min-w-max items-end'>
          {books.map((book) => (
            <motion.button
              key={book.id}
              type='button'
              layoutId={book.id}
              onClick={() => onBookSelect(book)}
              whileTap={{ scale: 0.96 }}
              className='shrink-0'
              aria-label={`Open ${book.title}`}
              style={{ scrollSnapAlign: 'start' }}
            >
              <div
                className='w-[4px]'
                style={{
                  height: '100px',
                  backgroundColor: colors[book.id] ?? '#1a1a2e',
                }}
              />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
