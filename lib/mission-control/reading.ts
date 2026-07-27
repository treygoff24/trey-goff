import booksData from '@/content/library/books.json'
import { calculateReadingStats, getTopicBreakdown } from '@/lib/books'
import type { Book, BooksData } from '@/lib/books/types'
import { absentInstrument, isStale, type Instrument } from './instrument'

/** The slice of a `Book` the mission-control shelf renders, plus a resolved cover path. */
export type ReadingBook = Pick<Book, 'id' | 'title' | 'author' | 'rating'> & {
  cover: string
}

export interface ReadingData {
  counts: ReturnType<typeof calculateReadingStats>
  topics: Array<{ topic: string; count: number }>
  currentlyReading: ReadingBook[]
  topRated: ReadingBook[]
}

function toReadingBook(book: Book): ReadingBook {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    rating: book.rating,
    cover: book.coverUrl ?? `/covers/${book.id}.jpg`,
  }
}

function aggregateReading(source: BooksData, now = new Date()): Instrument<ReadingData> {
  if (!Array.isArray(source.books) || !source.lastUpdated) {
    return absentInstrument('content/library/books.json', now)
  }

  return {
    data: {
      counts: calculateReadingStats(source.books),
      topics: getTopicBreakdown(source.books),
      currentlyReading: source.books.filter((book) => book.status === 'reading').map(toReadingBook),
      topRated: source.books
        .filter((book) => typeof book.rating === 'number')
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.title.localeCompare(b.title))
        .slice(0, 6)
        .map(toReadingBook),
    },
    asOf: source.lastUpdated,
    source: 'content/library/books.json',
    stale: isStale(source.lastUpdated, 30, now),
  }
}

export function getReadingInstrument(now = new Date()): Instrument<ReadingData> {
  return aggregateReading(booksData as BooksData, now)
}
