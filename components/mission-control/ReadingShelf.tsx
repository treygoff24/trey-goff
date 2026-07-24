import Image from 'next/image'
import Link from 'next/link'
import type { ReadingBook } from '@/lib/mission-control/reading'

export const EMPTY_READING_COPY =
  'No book is marked in progress. The shelf is between readings, not guessing.'

interface ReadingShelfProps {
  currentlyReading: ReadingBook[]
  topRated: ReadingBook[]
}

export function ReadingShelf({ currentlyReading, topRated }: ReadingShelfProps) {
  return (
    <div className="space-y-8">
      <div className="border-t border-border-1 pt-5">
        <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-text-2">Reading shelf</h3>
        {currentlyReading.length > 0 ? (
          <p className="mt-3 text-sm leading-6 text-text-2">
            {currentlyReading.map((book) => book.title).join(' · ')}
          </p>
        ) : (
          <p data-reading-empty className="mt-3 max-w-xl text-sm leading-6 text-text-2">
            {EMPTY_READING_COPY}
          </p>
        )}
      </div>

      {topRated.length > 0 && (
        <div className="border-t border-border-1 pt-5">
          <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-text-2">
            Top-rated shelf
          </h3>
          <div className="mt-5 flex flex-wrap items-end gap-x-4 gap-y-6">
            {topRated.map((book) => (
              <Link
                key={book.id}
                href="/library"
                className="group w-20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-warm"
              >
                <Image
                  src={book.cover}
                  alt={`${book.title} cover`}
                  width={80}
                  height={120}
                  sizes="80px"
                  className="aspect-[2/3] w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                />
                <span className="mt-2 block text-[11px] leading-4 text-text-2 group-hover:text-warm">
                  {book.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
