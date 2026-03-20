'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import type { Book } from '@/lib/books/types'
import clsx from 'clsx'

type BookStripeProps = {
  book: Book
  color: string
  isHovered: boolean
  isSelected: boolean
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
}

/**
 * Pick white or dark text based on the background luminance.
 */
function textColorForBg(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  // Relative luminance approximation
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? 'rgba(5,6,10,0.9)' : 'rgba(255,255,255,0.9)'
}

export const BookStripe = memo(function BookStripe({
  book,
  color,
  isHovered,
  isSelected,
  onHover,
  onSelect,
}: BookStripeProps) {
  const expanded = isHovered || isSelected

  return (
    <motion.div
      layout
      layoutId={book.id}
      role='button'
      tabIndex={0}
      aria-label={book.title}
      onMouseEnter={() => onHover(book.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(book.id)}
      onBlur={() => onHover(null)}
      onClick={() => onSelect(book.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(book.id)
        }
      }}
      animate={{ height: expanded ? 36 : 4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      className={clsx(
        'relative flex w-full cursor-pointer items-center overflow-hidden text-left outline-none',
        'focus-visible:ring-2 focus-visible:ring-warm focus-visible:ring-offset-1 focus-visible:ring-offset-bg-0',
        expanded && 'rounded-md shadow-[0_0_28px_rgba(245,162,90,0.22),0_0_8px_rgba(245,162,90,0.15),inset_0_0_0_1px_rgba(245,162,90,0.15)]',
      )}
      style={{
        backgroundColor: color,
        willChange: 'transform',
        boxShadow: expanded ? undefined : 'inset 0 0 0 0.5px rgba(255,255,255,0.04)',
      }}
    >
      {expanded && (
        <span
          className='truncate px-3 font-mono text-xs leading-none'
          style={{ color: textColorForBg(color) }}
        >
          {book.title}
        </span>
      )}
    </motion.div>
  )
})
