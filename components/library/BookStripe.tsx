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
  isMultiTopic: boolean
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
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? 'rgba(5,6,10,0.88)' : 'rgba(255,255,255,0.92)'
}

export const BookStripe = memo(function BookStripe({
  book,
  color,
  isHovered,
  isSelected,
  isMultiTopic,
  onHover,
  onSelect,
}: BookStripeProps) {
  const active = isHovered || isSelected
  const textColor = textColorForBg(color)

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
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={clsx(
        'relative flex w-full cursor-pointer items-center overflow-hidden text-left outline-none',
        'focus-visible:ring-2 focus-visible:ring-warm focus-visible:ring-offset-1 focus-visible:ring-offset-bg-0',
        active
          ? 'shadow-[0_0_28px_rgba(245,162,90,0.22),0_0_8px_rgba(245,162,90,0.15),inset_0_0_0_1px_rgba(245,162,90,0.15)]'
          : 'hover:shadow-[0_0_12px_rgba(245,162,90,0.1)]',
      )}
      style={{
        backgroundColor: color,
        willChange: 'transform',
        height: 26,
        boxShadow: active ? undefined : 'inset 0 0 0 0.5px rgba(255,255,255,0.06)',
        transform: active ? 'translateX(4px)' : 'translateX(0)',
        transition: 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease',
      }}
    >
      {/* Title — left side */}
      <span
        className='truncate pl-3 pr-2 font-mono text-[11px] leading-none'
        style={{ color: textColor }}
      >
        {book.title}
      </span>

      {/* Author — right side, fades on narrow containers */}
      <span
        className='ml-auto shrink-0 truncate pl-2 pr-3 font-mono text-[10px] leading-none opacity-50'
        style={{ color: textColor }}
      >
        {book.author}
      </span>

      {/* Multi-topic dot indicator */}
      {isMultiTopic && (
        <span
          className='ml-1 mr-2 inline-block h-[5px] w-[5px] shrink-0 rounded-full'
          style={{ backgroundColor: textColor, opacity: 0.45 }}
        />
      )}
    </motion.div>
  )
})
