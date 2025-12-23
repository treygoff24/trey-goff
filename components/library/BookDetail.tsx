'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Book } from '@/lib/books/types'
import { RatingStars } from './BookCard'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ExternalLink, Calendar, BookOpen } from 'lucide-react'

interface BookDetailProps {
  book: Book
  coverUrl?: string
  onClose: () => void
}

export function BookDetail({ book, coverUrl, onClose }: BookDetailProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
        <div className="flex flex-col gap-6 sm:flex-row">
          {/* Cover */}
          <div className="shrink-0">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={`Cover of ${book.title}`}
                width={160}
                height={240}
                className="mx-auto rounded-lg shadow-lg sm:mx-0"
                unoptimized={coverUrl.startsWith('data:') || coverUrl.startsWith('http')}
              />
            ) : (
              <div className="mx-auto flex h-60 w-40 items-center justify-center rounded-lg bg-surface-1 sm:mx-0">
                <BookOpen className="h-12 w-12 text-text-3" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div>
              <DialogTitle className="font-satoshi text-2xl font-bold text-text-1">
                {book.title}
              </DialogTitle>
              <p className="mt-1 text-lg text-text-2">{book.author}</p>
              <p className="text-sm text-text-3">{book.year}</p>
            </div>

            {/* Rating */}
            {book.rating && (
              <div className="flex items-center gap-2">
                <RatingStars rating={book.rating} />
                <span className="text-sm text-text-3">({book.rating}/5)</span>
              </div>
            )}

            {/* Dates */}
            <div className="flex flex-wrap gap-4 text-sm text-text-3">
              {book.dateRead && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Read: {formatDate(book.dateRead)}</span>
                </div>
              )}
              {book.dateStarted && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Started: {formatDate(book.dateStarted)}</span>
                </div>
              )}
            </div>

            {/* Topics */}
            {book.topics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {book.topics.map((topic) => (
                  <Link
                    key={topic}
                    href={`/topics/${encodeURIComponent(topic)}`}
                    className="rounded-full border border-border-1 bg-surface-1 px-2 py-0.5 text-xs text-text-2 transition-colors hover:border-border-2 hover:text-text-1"
                  >
                    {topic}
                  </Link>
                ))}
              </div>
            )}

            {/* Why I Love It */}
            <div>
              <h3 className="mb-2 font-satoshi text-sm font-medium text-text-1">
                Why I Love It
              </h3>
              <p className="font-newsreader text-text-2">{book.whyILoveIt}</p>
            </div>

            {/* Review */}
            {book.review && (
              <div>
                <h3 className="mb-2 font-satoshi text-sm font-medium text-text-1">
                  Review
                </h3>
                <p className="font-newsreader text-text-2">{book.review}</p>
              </div>
            )}

            {/* Links */}
            <div className="flex flex-wrap gap-3 pt-2">
              {book.amazonUrl && (
                <ExternalLinkButton href={book.amazonUrl} label="Amazon" />
              )}
              {book.goodreadsUrl && (
                <ExternalLinkButton href={book.goodreadsUrl} label="Goodreads" />
              )}
              {book.bookshopUrl && (
                <ExternalLinkButton href={book.bookshopUrl} label="Bookshop" />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ExternalLinkButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-1 rounded-lg border border-border-1 px-3 py-1.5 text-sm text-text-2 transition-colors hover:border-border-2 hover:text-text-1'
      )}
    >
      {label}
      <ExternalLink className="h-3 w-3" />
    </a>
  )
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}
