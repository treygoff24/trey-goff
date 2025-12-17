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
export function getReadingStats() {
  const books = getAllBooks()
  const readBooks = books.filter((b) => b.status === 'read')

  return {
    total: books.length,
    read: readBooks.length,
    reading: books.filter((b) => b.status === 'reading').length,
    want: books.filter((b) => b.status === 'want').length,
    abandoned: books.filter((b) => b.status === 'abandoned').length,
    averageRating:
      readBooks.length > 0
        ? readBooks.reduce((sum, b) => sum + (b.rating || 0), 0) /
          readBooks.filter((b) => b.rating).length
        : 0,
    fiveStarBooks: readBooks.filter((b) => b.rating === 5).length,
  }
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
