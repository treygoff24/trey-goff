import booksData from '@/content/library/books.json'
import type { Book, BooksData, BookStatus } from './types'

// Get all books
export function getAllBooks(): Book[] {
  return (booksData as BooksData).books
}

// Get books by status
export function getBooksByStatus(status: BookStatus): Book[] {
  return getAllBooks().filter((book) => book.status === status)
}

// Get a single book by ID
export function getBookById(id: string): Book | undefined {
  return getAllBooks().find((book) => book.id === id)
}

// Get all unique topics
export function getAllTopics(): string[] {
  const topics = new Set<string>()
  getAllBooks().forEach((book) => {
    book.topics.forEach((topic) => topics.add(topic))
  })
  return Array.from(topics).sort()
}

// Get all unique genres
export function getAllGenres(): string[] {
  const genres = new Set<string>()
  getAllBooks().forEach((book) => {
    if (book.genre) genres.add(book.genre)
  })
  return Array.from(genres).sort()
}

// Get reading statistics
export function calculateReadingStats(books: Book[]) {
  const readBooks = books.filter((b) => b.status === 'read')
  const ratedReadBooks = readBooks.filter((b) => typeof b.rating === 'number')

  return {
    total: books.length,
    read: readBooks.length,
    reading: books.filter((b) => b.status === 'reading').length,
    want: books.filter((b) => b.status === 'want').length,
    abandoned: books.filter((b) => b.status === 'abandoned').length,
    averageRating:
      ratedReadBooks.length > 0
        ? ratedReadBooks.reduce((sum, b) => sum + b.rating!, 0) /
          ratedReadBooks.length
        : 0,
    fiveStarBooks: readBooks.filter((b) => b.rating === 5).length,
  }
}

export function getReadingStats() {
  return calculateReadingStats(getAllBooks())
}

// Books read per year (based on dateRead)
export function getBooksReadByYear(books: Book[]) {
  const counts = new Map<number, number>()
  for (const book of books) {
    if (book.status !== 'read') continue
    const dateValue = book.dateRead || book.dateStarted
    if (!dateValue) continue
    const year = new Date(dateValue).getFullYear()
    if (Number.isNaN(year)) continue
    counts.set(year, (counts.get(year) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year)
}

// Rating distribution for read books
export function getRatingDistribution(books: Book[]) {
  const counts = new Map<number, number>()
  for (let rating = 1; rating <= 5; rating += 1) {
    counts.set(rating, 0)
  }

  for (const book of books) {
    if (book.status !== 'read') continue
    if (typeof book.rating !== 'number') continue
    const rating = Math.max(1, Math.min(5, Math.round(book.rating)))
    counts.set(rating, (counts.get(rating) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([rating, count]) => ({ rating, count }))
    .sort((a, b) => b.rating - a.rating)
}

// Topic breakdown for read books
export function getTopicBreakdown(books: Book[], limit = 6) {
  const counts = new Map<string, number>()
  for (const book of books) {
    if (book.status !== 'read') continue
    for (const topic of book.topics) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1)
    }
  }

  const entries = Array.from(counts.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic))

  if (entries.length <= limit) return entries

  const topEntries = entries.slice(0, limit - 1)
  const otherCount = entries
    .slice(limit - 1)
    .reduce((sum, entry) => sum + entry.count, 0)

  return [...topEntries, { topic: 'Other', count: otherCount }]
}

// Sort books
export function sortBooks(
  books: Book[],
  sortBy: 'title' | 'author' | 'year' | 'rating' | 'dateRead' = 'title'
): Book[] {
  return [...books].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'author':
        return a.author.localeCompare(b.author)
      case 'year':
        return b.year - a.year
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
      case 'dateRead':
        return (b.dateRead || '').localeCompare(a.dateRead || '')
      default:
        return 0
    }
  })
}

// Filter books
export function filterBooks(
  books: Book[],
  filters: {
    status?: BookStatus
    topic?: string
    genre?: string
    minRating?: number
  }
): Book[] {
  return books.filter((book) => {
    if (filters.status && book.status !== filters.status) return false
    if (filters.topic && !book.topics.includes(filters.topic)) return false
    if (filters.genre && book.genre !== filters.genre) return false
    if (filters.minRating && (!book.rating || book.rating < filters.minRating))
      return false
    return true
  })
}

export type { Book, BooksData, BookStatus } from './types'
