'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { Book } from '@/lib/books/types'
import { Star } from 'lucide-react'
import { GenerativeBookCover } from './GenerativeBookCover'

interface BookCardProps {
  book: Book
  coverUrl?: string
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-24',
  md: 'w-32',
  lg: 'w-40',
}

const coverSizes = {
  sm: { width: 96, height: 144 },
  md: { width: 128, height: 192 },
  lg: { width: 160, height: 240 },
}

const statusBadges: Record<Book['status'], { label: string; className: string }> = {
  read: { label: 'Read', className: 'bg-success/20 text-success' },
  reading: { label: 'Reading', className: 'bg-warm/20 text-warm' },
  want: { label: 'Want to Read', className: 'bg-accent/20 text-accent' },
  abandoned: { label: 'Abandoned', className: 'bg-error/20 text-error' },
}

export function BookCard({
  book,
  coverUrl,
  onClick,
  size = 'md',
}: BookCardProps) {
  const { width, height } = coverSizes[size]
  const badge = statusBadges[book.status]

  return (
    <button
      type="button"
      className={cn(
        'group cursor-pointer bg-transparent text-left transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm focus-visible:ring-offset-2 focus-visible:ring-offset-bg-1',
        sizeClasses[size]
      )}
      onClick={onClick}
      aria-label={`View details for ${book.title}`}
    >
      {/* Cover */}
      <div className="relative mb-3 overflow-hidden rounded-lg shadow-lg">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={`Cover of ${book.title}`}
            width={width}
            height={height}
            className="aspect-[2/3] w-full object-cover transition-opacity group-hover:opacity-90"
            unoptimized={coverUrl.startsWith('data:') || coverUrl.startsWith('http')}
          />
        ) : (
          <GenerativeBookCover
            title={book.title}
            author={book.author}
            width={width}
            height={height}
          />
        )}

        {/* Status badge */}
        <div
          className={cn(
            'absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium',
            badge.className
          )}
        >
          {badge.label}
        </div>

        {/* Rating stars on hover */}
        {book.rating && (
          <div className="absolute bottom-2 left-2 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            {Array.from({ length: book.rating }).map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-warm text-warm" aria-hidden="true" />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1">
        <h3 className="line-clamp-2 font-satoshi text-sm font-medium text-text-1 group-hover:text-warm">
          {book.title}
        </h3>
        <p className="truncate text-xs text-text-3">{book.author}</p>
        {book.year && (
          <p className="text-xs text-text-3">{book.year}</p>
        )}
      </div>
    </button>
  )
}

// Rating display component
export function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Rating: ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-4 w-4',
            i < rating ? 'fill-warm text-warm' : 'text-text-3'
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}
