'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import type { Book } from '@/lib/books/types'

type BookStripeProps = {
  book: Book
  color: string
  isHovered: boolean
  isSelected: boolean
  isMultiTopic: boolean
  hoverDistance: number | null
  compact?: boolean
  reducedMotion: boolean
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
}

const NOISE_TEXTURE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='26' viewBox='0 0 120 26'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.05' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='26' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")"

function textColorForBg(hex: string): string {
  const raw = hex.startsWith('#') ? hex.slice(1) : '667085'
  const normalized =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw
  if (normalized.length !== 6) return 'rgba(255,255,255,0.94)'
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  if ([r, g, b].some((n) => Number.isNaN(n))) return 'rgba(255,255,255,0.94)'
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.52 ? 'rgba(6,8,12,0.92)' : 'rgba(255,255,255,0.94)'
}

export const BookStripe = memo(function BookStripe({
  book,
  color,
  isHovered,
  isSelected,
  isMultiTopic,
  hoverDistance,
  compact = false,
  reducedMotion,
  onHover,
  onSelect,
}: BookStripeProps) {
  const active = isHovered || isSelected
  const isAdjacent = hoverDistance === 1
  const isNearby = hoverDistance === 2
  const textColor = textColorForBg(color)

  const springTransition = { type: 'spring' as const, stiffness: 320, damping: 28, mass: 0.7 }
  const instantTransition = { duration: 0 }

  const hoverTitle = `${book.title} — ${book.author}`

  return (
    <motion.button
      type="button"
      tabIndex={0}
      title={hoverTitle}
      aria-label={hoverTitle}
      onMouseEnter={() => onHover(book.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(book.id)}
      onBlur={() => onHover(null)}
      onClick={() => onSelect(book.id)}
      whileHover={
        reducedMotion
          ? {}
          : {
              x: compact ? 6 : 10,
              scaleY: compact ? 1.015 : 1.025,
              transition: { type: 'spring', stiffness: 340, damping: 24, mass: 0.65 },
            }
      }
      whileTap={reducedMotion ? {} : { scaleY: 0.99, x: compact ? 5 : 9 }}
      animate={{
        x: isSelected ? (compact ? 6 : 10) : isAdjacent ? -1 : 0,
        scaleY: isSelected ? (compact ? 1.015 : 1.025) : isAdjacent ? 0.985 : isNearby ? 0.992 : 1,
        scaleX: isAdjacent ? 0.997 : 1,
        zIndex: active ? 20 : isAdjacent ? 8 : 2,
      }}
      transition={reducedMotion ? instantTransition : springTransition}
      className={clsx(
        'group relative flex w-full touch-manipulation items-center overflow-hidden rounded-[7px] border text-left outline-none',
        compact ? 'h-[36px]' : 'h-[26px]',
        active ? 'border-white/22' : 'border-white/6',
        'focus-visible:ring-2 focus-visible:ring-warm focus-visible:ring-offset-2 focus-visible:ring-offset-bg-0',
      )}
      style={{
        backgroundColor: color,
        color: textColor,
        boxShadow: active
          ? '0 0 0 1px rgba(255,255,255,0.06), 12px 0 26px rgba(245,162,90,0.22), 4px 0 12px rgba(245,162,90,0.16), inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -7px 10px rgba(0,0,0,0.12)'
          : '0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -7px 10px rgba(0,0,0,0.12)',
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: NOISE_TEXTURE, backgroundSize: '120px 26px' }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/15"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-[2px] right-0 w-[14px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background:
            'linear-gradient(90deg, rgba(245,162,90,0), rgba(245,162,90,0.22) 50%, rgba(255,255,255,0.15) 100%)',
          opacity: active ? 1 : undefined,
        }}
      />

      <span
        className={clsx(
          'relative z-[1] min-w-0 truncate font-mono text-[11px] leading-none tracking-[0.01em]',
          compact ? 'flex-1 pl-2.5 pr-1' : 'pl-3 pr-2',
        )}
        style={{
          color: textColor,
          opacity: active ? 1 : 0.82,
          textShadow: '0 1px 0 rgba(0,0,0,0.32), 0 -1px 0 rgba(255,255,255,0.1)',
        }}
      >
        {book.title}
      </span>

      <span
        className={clsx(
          'relative z-[1] shrink-0 truncate pl-1 font-mono leading-none',
          compact
            ? 'max-w-[min(48%,7.5rem)] text-right text-[10px] pr-2.5'
            : 'ml-auto max-w-[46%] pr-3 pl-2 text-[10px]',
        )}
        style={{
          color: textColor,
          opacity: active ? 0.96 : 0.56,
          textShadow: '0 1px 0 rgba(0,0,0,0.24), 0 -1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {book.author}
      </span>

      {isMultiTopic ? (
        <span
          aria-hidden="true"
          className="relative z-[1] mr-2 inline-block h-[5px] w-[5px] shrink-0 rounded-full"
          style={{ backgroundColor: textColor, opacity: active ? 0.75 : 0.45 }}
        />
      ) : null}
    </motion.button>
  )
})
