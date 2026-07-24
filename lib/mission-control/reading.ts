import booksData from '@/content/library/books.json'
import { calculateReadingStats, getTopicBreakdown } from '@/lib/books'
import type { Book, BooksData } from '@/lib/books/types'
import { attemptDate, isStale, type Instrument } from './instrument'

export interface ReadingBook {
  id: string
  title: string
  author: string
  rating?: number
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

export function aggregateReading(source: BooksData, now = new Date()): Instrument<ReadingData> {
  if (!Array.isArray(source.books) || !source.lastUpdated) throw new Error('Invalid books data')

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
  try {
    return aggregateReading(booksData as BooksData, now)
  } catch {
    return {
      data: null,
      asOf: attemptDate(now),
      source: 'content/library/books.json',
      stale: false,
    }
  }
}
