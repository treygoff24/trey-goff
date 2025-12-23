import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  calculateReadingStats,
  sortBooks,
  filterBooks,
  getBooksByStatus,
  getBookById,
  getAllTopics,
  getAllGenres,
} from '@/lib/books'
import type { Book } from '@/lib/books/types'

function book(overrides: Partial<Book> = {}): Book {
  return {
    id: 'book',
    title: 'Book',
    author: 'Author',
    year: 2025,
    status: 'want',
    topics: [],
    whyILoveIt: 'Because.',
    ...overrides,
  }
}

test('averageRating is 0 when read books have no ratings', () => {
  const stats = calculateReadingStats([
    book({ id: 'a', status: 'read' }),
    book({ id: 'b', status: 'read' }),
  ])

  assert.equal(stats.read, 2)
  assert.equal(stats.averageRating, 0)
  assert.ok(Number.isFinite(stats.averageRating))
})

test('averageRating averages only rated read books', () => {
  const stats = calculateReadingStats([
    book({ id: 'a', status: 'read', rating: 5 }),
    book({ id: 'b', status: 'read' }),
    book({ id: 'c', status: 'read', rating: 3 }),
  ])

  assert.equal(stats.read, 3)
  assert.equal(stats.averageRating, 4)
})

test('stats for empty book array', () => {
  const stats = calculateReadingStats([])

  assert.equal(stats.total, 0)
  assert.equal(stats.read, 0)
  assert.equal(stats.reading, 0)
  assert.equal(stats.want, 0)
  assert.equal(stats.averageRating, 0)
  assert.ok(Number.isFinite(stats.averageRating))
})

test('fiveStarBooks counts only 5-star rated books', () => {
  const stats = calculateReadingStats([
    book({ id: 'a', status: 'read', rating: 5 }),
    book({ id: 'b', status: 'read', rating: 4 }),
    book({ id: 'c', status: 'read', rating: 5 }),
    book({ id: 'd', status: 'read' }), // No rating
  ])

  assert.equal(stats.fiveStarBooks, 2)
})

test('abandoned books are counted separately', () => {
  const stats = calculateReadingStats([
    book({ id: 'a', status: 'read' }),
    book({ id: 'b', status: 'abandoned' }),
    book({ id: 'c', status: 'abandoned' }),
  ])

  assert.equal(stats.abandoned, 2)
  assert.equal(stats.read, 1)
})

// ============================================
// sortBooks tests
// ============================================

describe('sortBooks', () => {
  const testBooks = [
    book({ id: 'a', title: 'Zephyr', author: 'Zach', year: 2020, rating: 3, dateRead: '2023-01-01' }),
    book({ id: 'b', title: 'Alpha', author: 'Alice', year: 2024, rating: 5, dateRead: '2024-06-15' }),
    book({ id: 'c', title: 'Mango', author: 'Mary', year: 2022, rating: 4, dateRead: '2023-06-01' }),
  ]

  test('sorts by title alphabetically', () => {
    const sorted = sortBooks(testBooks, 'title')
    assert.equal(sorted[0]!.title, 'Alpha')
    assert.equal(sorted[1]!.title, 'Mango')
    assert.equal(sorted[2]!.title, 'Zephyr')
  })

  test('sorts by author alphabetically', () => {
    const sorted = sortBooks(testBooks, 'author')
    assert.equal(sorted[0]!.author, 'Alice')
    assert.equal(sorted[1]!.author, 'Mary')
    assert.equal(sorted[2]!.author, 'Zach')
  })

  test('sorts by year descending (newest first)', () => {
    const sorted = sortBooks(testBooks, 'year')
    assert.equal(sorted[0]!.year, 2024)
    assert.equal(sorted[1]!.year, 2022)
    assert.equal(sorted[2]!.year, 2020)
  })

  test('sorts by rating descending (highest first)', () => {
    const sorted = sortBooks(testBooks, 'rating')
    assert.equal(sorted[0]!.rating, 5)
    assert.equal(sorted[1]!.rating, 4)
    assert.equal(sorted[2]!.rating, 3)
  })

  test('sorts by dateRead descending (most recent first)', () => {
    const sorted = sortBooks(testBooks, 'dateRead')
    assert.equal(sorted[0]!.dateRead, '2024-06-15')
    assert.equal(sorted[1]!.dateRead, '2023-06-01')
    assert.equal(sorted[2]!.dateRead, '2023-01-01')
  })

  test('handles undefined ratings (treats as 0)', () => {
    const booksWithMissing = [
      book({ id: 'a', rating: 3 }),
      book({ id: 'b' }), // No rating
      book({ id: 'c', rating: 5 }),
    ]
    const sorted = sortBooks(booksWithMissing, 'rating')
    assert.equal(sorted[0]!.rating, 5)
    assert.equal(sorted[1]!.rating, 3)
    assert.equal(sorted[2]!.rating, undefined)
  })

  test('handles undefined dateRead', () => {
    const booksWithMissing = [
      book({ id: 'a', dateRead: '2024-01-01' }),
      book({ id: 'b' }), // No dateRead
      book({ id: 'c', dateRead: '2023-01-01' }),
    ]
    const sorted = sortBooks(booksWithMissing, 'dateRead')
    assert.equal(sorted[0]!.dateRead, '2024-01-01')
    assert.equal(sorted[1]!.dateRead, '2023-01-01')
    assert.equal(sorted[2]!.dateRead, undefined)
  })

  test('does not mutate original array', () => {
    const original = [...testBooks]
    sortBooks(testBooks, 'title')
    assert.deepEqual(testBooks, original)
  })

  test('defaults to title sort', () => {
    const sorted = sortBooks(testBooks)
    assert.equal(sorted[0]!.title, 'Alpha')
  })
})

// ============================================
// filterBooks tests
// ============================================

describe('filterBooks', () => {
  const testBooks = [
    book({ id: 'a', status: 'read', topics: ['economics', 'history'], genre: 'non-fiction', rating: 5 }),
    book({ id: 'b', status: 'want', topics: ['philosophy'], genre: 'non-fiction', rating: undefined }),
    book({ id: 'c', status: 'reading', topics: ['economics'], genre: 'fiction', rating: 4 }),
    book({ id: 'd', status: 'read', topics: ['history'], genre: 'non-fiction', rating: 3 }),
  ]

  test('filters by status', () => {
    const filtered = filterBooks(testBooks, { status: 'read' })
    assert.equal(filtered.length, 2)
    assert.ok(filtered.every(b => b.status === 'read'))
  })

  test('filters by topic', () => {
    const filtered = filterBooks(testBooks, { topic: 'economics' })
    assert.equal(filtered.length, 2)
    assert.ok(filtered.every(b => b.topics.includes('economics')))
  })

  test('filters by genre', () => {
    const filtered = filterBooks(testBooks, { genre: 'fiction' })
    assert.equal(filtered.length, 1)
    assert.equal(filtered[0]!.id, 'c')
  })

  test('filters by minRating', () => {
    const filtered = filterBooks(testBooks, { minRating: 4 })
    assert.equal(filtered.length, 2)
    assert.ok(filtered.every(b => b.rating && b.rating >= 4))
  })

  test('minRating excludes books without rating', () => {
    const filtered = filterBooks(testBooks, { minRating: 1 })
    assert.ok(!filtered.some(b => b.id === 'b')) // Book b has no rating
  })

  test('combines multiple filters (AND logic)', () => {
    const filtered = filterBooks(testBooks, {
      status: 'read',
      genre: 'non-fiction',
      minRating: 4,
    })
    assert.equal(filtered.length, 1)
    assert.equal(filtered[0]!.id, 'a')
  })

  test('returns empty array when no matches', () => {
    const filtered = filterBooks(testBooks, { genre: 'mystery' })
    assert.equal(filtered.length, 0)
  })

  test('returns all books with empty filter object', () => {
    const filtered = filterBooks(testBooks, {})
    assert.equal(filtered.length, testBooks.length)
  })
})

// ============================================
// Integration tests with actual book data
// ============================================

describe('book data access functions', () => {
  test('getAllTopics returns sorted unique topics', () => {
    const topics = getAllTopics()
    assert.ok(Array.isArray(topics))
    // Should be alphabetically sorted
    const sorted = [...topics].sort()
    assert.deepEqual(topics, sorted)
    // Should have no duplicates
    const unique = [...new Set(topics)]
    assert.deepEqual(topics, unique)
  })

  test('getAllGenres returns sorted unique genres', () => {
    const genres = getAllGenres()
    assert.ok(Array.isArray(genres))
    // Should be alphabetically sorted
    const sorted = [...genres].sort()
    assert.deepEqual(genres, sorted)
    // Should have no duplicates
    const unique = [...new Set(genres)]
    assert.deepEqual(genres, unique)
  })

  test('getBookById returns undefined for non-existent id', () => {
    const book = getBookById('this-id-does-not-exist-xyz')
    assert.equal(book, undefined)
  })

  test('getBooksByStatus returns correct books', () => {
    const reading = getBooksByStatus('reading')
    assert.ok(Array.isArray(reading))
    assert.ok(reading.every(b => b.status === 'reading'))
  })
})
