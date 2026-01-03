/**
 * Constellation grouping and positioning utilities for the Floating Library.
 * Groups books by primary topic, identifies drifters, and calculates 3D positions.
 */

import type { Book } from '@/lib/books/types'
import type {
  ConstellationData,
  BookWithPosition,
  Position3D,
  SortBy,
} from './types'
import { getTopicColor } from './types'

// =============================================================================
// Constants
// =============================================================================

/** Minimum books required for a topic to form a constellation (not a drifter) */
const MIN_BOOKS_FOR_CONSTELLATION = 2

/** Radius for spreading constellations in universe view */
const CONSTELLATION_SPREAD_RADIUS = 60

/** Radius for spreading books within a constellation */
const BOOK_SPREAD_RADIUS = 15

/** Vertical spread for constellations */
const VERTICAL_SPREAD = 20

/** Drifter orbit radius range */
const DRIFTER_ORBIT_MIN = 70
const DRIFTER_ORBIT_MAX = 90

// =============================================================================
// Hashing for Deterministic Positions
// =============================================================================

/**
 * Simple string hash function for deterministic random values.
 * Uses djb2 algorithm variant.
 */
function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return hash >>> 0 // Convert to unsigned 32-bit
}

/**
 * Seeded random number generator.
 * Returns a function that generates deterministic values [0, 1).
 */
function createSeededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }
}

// =============================================================================
// Position Calculation
// =============================================================================

/**
 * Calculate constellation position using spherical distribution.
 * Each topic gets a deterministic position based on its name hash.
 */
function calculateConstellationPosition(
  topic: string,
  index: number,
  total: number
): Position3D {
  const seed = hashString(topic)
  const random = createSeededRandom(seed)

  // Use golden angle for even spherical distribution
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  const theta = goldenAngle * index
  const y = 1 - (index / (total - 1)) * 2 // Range from 1 to -1

  // Add some randomness to break perfect pattern
  const jitterX = (random() - 0.5) * 10
  const jitterY = (random() - 0.5) * VERTICAL_SPREAD * 0.3
  const jitterZ = (random() - 0.5) * 10

  const radiusAtY = Math.sqrt(1 - y * y)
  const x = Math.cos(theta) * radiusAtY * CONSTELLATION_SPREAD_RADIUS + jitterX
  const z = Math.sin(theta) * radiusAtY * CONSTELLATION_SPREAD_RADIUS + jitterZ
  const finalY = y * VERTICAL_SPREAD + jitterY

  return [x, finalY, z]
}

/**
 * Calculate book position within a constellation.
 * Uses the book ID for deterministic placement.
 */
function calculateBookPosition(
  book: Book,
  index: number,
  total: number,
  constellationCenter: Position3D
): Position3D {
  const seed = hashString(book.id)
  const random = createSeededRandom(seed)

  // Spiral distribution with randomness
  const angle = (index / total) * Math.PI * 2 * 3 // 3 full rotations
  const radiusFactor = 0.3 + (index / total) * 0.7 // Start closer, expand out
  const radius = BOOK_SPREAD_RADIUS * radiusFactor

  // Add randomness
  const jitterAngle = (random() - 0.5) * 0.5
  const jitterRadius = (random() - 0.5) * 3
  const jitterY = (random() - 0.5) * 8

  const finalAngle = angle + jitterAngle
  const finalRadius = radius + jitterRadius

  const x = constellationCenter[0] + Math.cos(finalAngle) * finalRadius
  const y = constellationCenter[1] + jitterY
  const z = constellationCenter[2] + Math.sin(finalAngle) * finalRadius

  return [x, y, z]
}

/**
 * Calculate drifter book position on a lazy orbit.
 */
function calculateDrifterPosition(book: Book, _index: number): Position3D {
  const seed = hashString(book.id)
  const random = createSeededRandom(seed)

  // Random point on a sphere between inner and outer orbit
  const theta = random() * Math.PI * 2
  const phi = Math.acos(2 * random() - 1)
  const radius =
    DRIFTER_ORBIT_MIN + random() * (DRIFTER_ORBIT_MAX - DRIFTER_ORBIT_MIN)

  const x = radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.sin(phi) * Math.sin(theta) * 0.3 // Flatten vertically
  const z = radius * Math.cos(phi)

  return [x, y, z]
}

// =============================================================================
// Grouping Functions
// =============================================================================

/**
 * Group books into constellations by primary topic.
 * Books with no topics or single-book topics become drifters.
 */
export function groupBooksIntoConstellations(
  books: Book[]
): ConstellationData[] {
  // Count books per primary topic
  const topicCounts = new Map<string, Book[]>()

  for (const book of books) {
    const primaryTopic = book.topics[0] ?? null
    if (primaryTopic) {
      const existing = topicCounts.get(primaryTopic) ?? []
      existing.push(book)
      topicCounts.set(primaryTopic, existing)
    }
  }

  // Filter to topics with enough books
  const validTopics = Array.from(topicCounts.entries()).filter(
    ([, topicBooks]) => topicBooks.length >= MIN_BOOKS_FOR_CONSTELLATION
  )

  // Sort topics by book count for consistent ordering
  validTopics.sort((a, b) => b[1].length - a[1].length)

  // Create constellation data
  const constellations: ConstellationData[] = validTopics.map(
    ([topic, topicBooks], index) => {
      const position = calculateConstellationPosition(
        topic,
        index,
        validTopics.length
      )
      const color = getTopicColor(topic)

      // Position books within constellation
      const booksWithPosition: BookWithPosition[] = topicBooks.map(
        (book, bookIndex) => ({
          ...book,
          position: calculateBookPosition(
            book,
            bookIndex,
            topicBooks.length,
            position
          ),
          isDrifter: false,
          primaryTopic: topic,
        })
      )

      return {
        topic,
        label: capitalizeFirst(topic),
        color,
        position,
        books: booksWithPosition,
        bookCount: booksWithPosition.length,
      }
    }
  )

  return constellations
}

/**
 * Get books that should be drifters (no topic or single-book topic).
 */
export function getDrifterBooks(books: Book[]): BookWithPosition[] {
  // Count books per primary topic
  const topicCounts = new Map<string, number>()
  for (const book of books) {
    const primaryTopic = book.topics[0]
    if (primaryTopic) {
      topicCounts.set(primaryTopic, (topicCounts.get(primaryTopic) ?? 0) + 1)
    }
  }

  // Find books that are drifters
  const drifters: BookWithPosition[] = []
  let drifterIndex = 0

  for (const book of books) {
    const primaryTopic = book.topics[0] ?? null
    const isDrifter =
      !primaryTopic ||
      (topicCounts.get(primaryTopic) ?? 0) < MIN_BOOKS_FOR_CONSTELLATION

    if (isDrifter) {
      drifters.push({
        ...book,
        position: calculateDrifterPosition(book, drifterIndex),
        isDrifter: true,
        primaryTopic: null,
      })
      drifterIndex++
    }
  }

  return drifters
}

/**
 * Get all books with positions (both constellation and drifter books).
 */
export function getAllBooksWithPositions(books: Book[]): BookWithPosition[] {
  const constellations = groupBooksIntoConstellations(books)
  const drifters = getDrifterBooks(books)

  const allBooks: BookWithPosition[] = []

  for (const constellation of constellations) {
    allBooks.push(...constellation.books)
  }
  allBooks.push(...drifters)

  return allBooks
}

// =============================================================================
// Filtering and Sorting
// =============================================================================

/**
 * Filter books by search query, status, and topic.
 */
export function filterBooks(
  books: BookWithPosition[],
  filters: {
    statusFilter: Book['status'] | null
    topicFilter: string | null
    searchQuery: string
  }
): BookWithPosition[] {
  const { statusFilter, topicFilter, searchQuery } = filters
  const query = searchQuery.toLowerCase().trim()

  return books.filter((book) => {
    // Status filter
    if (statusFilter !== null && book.status !== statusFilter) {
      return false
    }

    // Topic filter (matches ANY topic in array, not just primary)
    if (topicFilter !== null && !book.topics.includes(topicFilter)) {
      return false
    }

    // Search filter (min 2 chars, matches title OR author)
    if (query.length >= 2) {
      const titleMatch = book.title.toLowerCase().includes(query)
      const authorMatch = book.author.toLowerCase().includes(query)
      if (!titleMatch && !authorMatch) {
        return false
      }
    }

    return true
  })
}

/**
 * Sort books according to the specified sort type.
 * Only used when filtered (seeded positions preserved when unfiltered).
 */
export function sortBooks(
  books: BookWithPosition[],
  sortBy: SortBy
): BookWithPosition[] {
  const sorted = [...books]

  switch (sortBy) {
    case 'rating':
      // Highest first, unrated last
      sorted.sort((a, b) => {
        if (a.rating === undefined && b.rating === undefined) return 0
        if (a.rating === undefined) return 1
        if (b.rating === undefined) return -1
        return b.rating - a.rating
      })
      break

    case 'title':
      // A -> Z
      sorted.sort((a, b) => a.title.localeCompare(b.title))
      break

    case 'author':
      // A -> Z (by last name if parseable)
      sorted.sort((a, b) => {
        const lastNameA = getLastName(a.author)
        const lastNameB = getLastName(b.author)
        return lastNameA.localeCompare(lastNameB)
      })
      break

    case 'year':
      // Newest first
      sorted.sort((a, b) => b.year - a.year)
      break
  }

  return sorted
}

/**
 * Calculate positions for filtered results in a central cluster.
 * Used when filters are active to group matching books together.
 */
export function calculateFilteredPositions(
  books: BookWithPosition[],
  sortBy: SortBy
): BookWithPosition[] {
  // Sort first
  const sorted = sortBooks(books, sortBy)

  // Position in a spiral at scene center
  return sorted.map((book, index) => {
    const angle = (index / sorted.length) * Math.PI * 2 * 2 // 2 rotations
    const radius = 5 + (index / sorted.length) * 20 // Expand outward
    const y = (Math.random() - 0.5) * 10

    return {
      ...book,
      position: [
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius,
      ] as Position3D,
    }
  })
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Capitalize the first letter of a string.
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Extract last name from author string (naive approach).
 */
function getLastName(author: string): string {
  const parts = author.trim().split(' ')
  return parts[parts.length - 1] ?? author
}

/**
 * Get stats about the library grouping.
 */
export function getGroupingStats(books: Book[]): {
  constellationCount: number
  drifterCount: number
  topics: string[]
} {
  const constellations = groupBooksIntoConstellations(books)
  const drifters = getDrifterBooks(books)

  return {
    constellationCount: constellations.length,
    drifterCount: drifters.length,
    topics: constellations.map((c) => c.topic),
  }
}
