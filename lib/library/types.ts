/**
 * Type definitions for the Floating Library 3D experience.
 * Topic colors, constellation data structures, and book positioning.
 */

import type { Book } from '@/lib/books/types'

// =============================================================================
// Topic Colors
// =============================================================================

/**
 * Predefined colors for topic nebulae.
 * Each topic gets a distinct color for its constellation.
 */
export const TOPIC_COLORS: Record<string, string> = {
  philosophy: '#8B5CF6',
  economics: '#F59E0B',
  governance: '#14B8A6',
  technology: '#3B82F6',
  science: '#22C55E',
  history: '#A16207',
  fiction: '#F43F5E',
  biography: '#FB7185',
  'self-help': '#EAB308',
  libertarianism: '#EA580C',
  futurism: '#06B6D4',
}

/** Default color for topics not in TOPIC_COLORS */
export const DEFAULT_TOPIC_COLOR = '#6B7280'

/**
 * Get the color for a topic, falling back to default.
 */
export function getTopicColor(topic: string): string {
  return TOPIC_COLORS[topic.toLowerCase()] ?? DEFAULT_TOPIC_COLOR
}

// =============================================================================
// View Levels
// =============================================================================

/** The three zoom levels in the floating library */
export type ViewLevel = 'universe' | 'constellation' | 'book'

// =============================================================================
// Position Types
// =============================================================================

/** 3D position tuple [x, y, z] */
export type Position3D = [number, number, number]

// =============================================================================
// Book with Position
// =============================================================================

/**
 * A book with computed 3D position for rendering.
 */
export interface BookWithPosition extends Book {
  /** World position of this book */
  position: Position3D
  /** Whether this book is a drifter (no topic or single-book topic) */
  isDrifter: boolean
  /** Primary topic (first in topics array) or null for drifters */
  primaryTopic: string | null
}

// =============================================================================
// Constellation Data
// =============================================================================

/**
 * A constellation (nebula) containing books for a single topic.
 */
export interface ConstellationData {
  /** Topic name (e.g., "philosophy") */
  topic: string
  /** Display label (capitalized topic) */
  label: string
  /** Nebula color */
  color: string
  /** World position of constellation center */
  position: Position3D
  /** Books in this constellation with their local positions */
  books: BookWithPosition[]
  /** Number of books in this constellation */
  bookCount: number
}

// =============================================================================
// Filter State
// =============================================================================

/** Sort options for filtered results */
export type SortBy = 'rating' | 'title' | 'author' | 'year'

/**
 * Filter state for the library.
 */
export interface FilterState {
  statusFilter: Book['status'] | null
  topicFilter: string | null
  searchQuery: string
  sortBy: SortBy
}

// =============================================================================
// Quality Levels
// =============================================================================

/** Performance quality tiers for graceful degradation */
export type QualityLevel = 'full' | 'reduced' | 'minimal'
