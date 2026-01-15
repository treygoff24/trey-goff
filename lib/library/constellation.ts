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
const CONSTELLATION_SPREAD_RADIUS = 160

/** Vertical spread for constellations */
const VERTICAL_SPREAD = 70


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
  // Range from 1 to -1, handle single constellation case
  const y = total <= 1 ? 0 : 1 - (index / (total - 1)) * 2

  // Subtle jitter to break perfect pattern without causing overlap
  const jitterX = (random() - 0.5) * 6
  const jitterY = (random() - 0.5) * VERTICAL_SPREAD * 0.15
  const jitterZ = (random() - 0.5) * 6

  const radiusAtY = Math.sqrt(1 - y * y)
  const x = Math.cos(theta) * radiusAtY * CONSTELLATION_SPREAD_RADIUS + jitterX
  const z = Math.sin(theta) * radiusAtY * CONSTELLATION_SPREAD_RADIUS + jitterZ
  const finalY = y * VERTICAL_SPREAD + jitterY

  return [x, finalY, z]
}

/**
 * Calculate book position within a constellation.
 * Returns LOCAL position (relative to constellation center).
 * Spreads books in 3D space within the nebula sphere.
 */
function calculateBookPosition(
  book: Book,
  index: number,
  total: number
): Position3D {
  // Nebula radius scales with book count (same formula as Constellation.tsx)
  const nebulaRadius = Math.max(15, Math.min(30, 10 + total * 0.5))
  
  // Use seeded random for deterministic but varied positions
  const seed = hashString(book.id)
  const random = createSeededRandom(seed)
  
  // Spherical distribution using fibonacci sphere for even spacing
  const goldenRatio = (1 + Math.sqrt(5)) / 2
  const theta = 2 * Math.PI * index / goldenRatio
  const phi = Math.acos(1 - 2 * (index + 0.5) / total)
  
  // Vary radius so books fill the nebula volume (not just surface)
  const radiusFactor = 0.3 + random() * 0.6 // 30-90% of nebula radius
  const radius = nebulaRadius * radiusFactor * 0.7 // Stay well inside nebula
  
  // Convert spherical to cartesian (LOCAL coordinates)
  const x = radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.sin(phi) * Math.sin(theta) * 0.6 // Flatten slightly
  const z = radius * Math.cos(phi) * 0.8 // Reduce Z spread
  
  return [x, y, z]
}


// =============================================================================
// Grouping Functions
// =============================================================================

/** Special topic for orphan books */
const RANDOM_TOPIC = 'random'

/**
 * Group books into constellations by primary topic.
 * Books with no topics or single-book topics go into a "Random" constellation.
 */
export function groupBooksIntoConstellations(
  books: Book[]
): ConstellationData[] {
  // Count books per primary topic
  const topicCounts = new Map<string, Book[]>()
  const orphanBooks: Book[] = []

  for (const book of books) {
    const primaryTopic = book.topics[0] ?? null
    if (primaryTopic) {
      const existing = topicCounts.get(primaryTopic) ?? []
      existing.push(book)
      topicCounts.set(primaryTopic, existing)
    } else {
      // No topic at all - orphan
      orphanBooks.push(book)
    }
  }

  // Separate valid topics from single-book topics
  const validTopics: [string, Book[]][] = []

  for (const [topic, topicBooks] of topicCounts.entries()) {
    if (topicBooks.length >= MIN_BOOKS_FOR_CONSTELLATION) {
      validTopics.push([topic, topicBooks])
    } else {
      // Single-book topic - add to orphans
      orphanBooks.push(...topicBooks)
    }
  }

  // Sort topics by book count for consistent ordering
  validTopics.sort((a, b) => b[1].length - a[1].length)

  // Total constellations (including Random if there are orphans)
  const totalConstellations = validTopics.length + (orphanBooks.length > 0 ? 1 : 0)

  // Create constellation data for regular topics
  const constellations: ConstellationData[] = validTopics.map(
    ([topic, topicBooks], index) => {
      const position = calculateConstellationPosition(
        topic,
        index,
        totalConstellations
      )
      const color = getTopicColor(topic)

      // Position books within constellation
      const booksWithPosition: BookWithPosition[] = topicBooks.map(
        (book, bookIndex) => ({
          ...book,
          position: calculateBookPosition(
            book,
            bookIndex,
            topicBooks.length
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

  // Add Random constellation for orphan books
  if (orphanBooks.length > 0) {
    const randomPosition = calculateConstellationPosition(
      RANDOM_TOPIC,
      validTopics.length, // Last position
      totalConstellations
    )
    const randomColor = getTopicColor(RANDOM_TOPIC)

    const randomBooksWithPosition: BookWithPosition[] = orphanBooks.map(
      (book, bookIndex) => ({
        ...book,
        position: calculateBookPosition(
          book,
          bookIndex,
          orphanBooks.length
        ),
        isDrifter: false,
        primaryTopic: RANDOM_TOPIC,
      })
    )

    constellations.push({
      topic: RANDOM_TOPIC,
      label: 'Random',
      color: randomColor,
      position: randomPosition,
      books: randomBooksWithPosition,
      bookCount: randomBooksWithPosition.length,
    })
  }

  return constellations
}

/**
 * Get all books with positions from all constellations.
 */
export function getAllBooksWithPositions(books: Book[]): BookWithPosition[] {
  const constellations = groupBooksIntoConstellations(books)
  return constellations.flatMap((c) => c.books)
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
    // Use seeded random based on book ID for deterministic Y positions
    const seed = hashString(book.id + '-filtered')
    const random = createSeededRandom(seed)

    const angle = (index / sorted.length) * Math.PI * 2 * 2 // 2 rotations
    const radius = 5 + (index / sorted.length) * 20 // Expand outward
    const y = (random() - 0.5) * 10

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

