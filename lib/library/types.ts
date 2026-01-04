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
  random: '#9CA3AF', // Gray for miscellaneous/orphan books
}

/** Default color for topics not in TOPIC_COLORS */
export const DEFAULT_TOPIC_COLOR = '#6B7280'

// =============================================================================
// Helpers
// =============================================================================

function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return hash >>> 0
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hPrime = h / 60
  const x = c * (1 - Math.abs((hPrime % 2) - 1))

  let r1 = 0
  let g1 = 0
  let b1 = 0

  if (hPrime >= 0 && hPrime < 1) {
    r1 = c
    g1 = x
  } else if (hPrime < 2) {
    r1 = x
    g1 = c
  } else if (hPrime < 3) {
    g1 = c
    b1 = x
  } else if (hPrime < 4) {
    g1 = x
    b1 = c
  } else if (hPrime < 5) {
    r1 = x
    b1 = c
  } else {
    r1 = c
    b1 = x
  }

  const m = l - c / 2
  const r = Math.round((r1 + m) * 255)
  const g = Math.round((g1 + m) * 255)
  const b = Math.round((b1 + m) * 255)

  const toHex = (value: number) =>
    Math.min(255, Math.max(0, value)).toString(16).padStart(2, '0')

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function generateTopicColor(topic: string): string {
  const hash = hashString(topic)
  const hue = hash % 360
  const saturation = 0.6 + ((hash >> 8) % 100) / 500
  const lightness = 0.55 + ((hash >> 16) % 100) / 500

  return hslToHex(hue, saturation, lightness)
}

/**
 * Get the color for a topic, falling back to default.
 */
export function getTopicColor(topic: string): string {
  const normalized = topic.toLowerCase().trim()
  if (!normalized) return DEFAULT_TOPIC_COLOR

  return TOPIC_COLORS[normalized] ?? generateTopicColor(normalized)
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

// =============================================================================
// Postprocessing Config (v2)
// =============================================================================

/** Configuration for bloom effect */
export interface BloomConfig {
  threshold: number
  intensity: number
  smoothing: number
}

/** Configuration for depth of field effect (null to disable) */
export interface DOFConfig {
  focusDistance: number
  focalLength: number
  bokehScale: number
}

/** Configuration for vignette effect */
export interface VignetteConfig {
  offset: number
  darkness: number
}

/** Configuration for noise effect */
export interface NoiseConfig {
  opacity: number
}

/** Full postprocessing configuration for a view level */
export interface PostProcessingConfig {
  bloom: BloomConfig
  dof: DOFConfig | null
  vignette: VignetteConfig
  noise: NoiseConfig
}

/**
 * Per-view postprocessing configurations.
 * Universe: light effects, everything mostly in focus
 * Constellation: medium effects, DOF on nebula center
 * Book: strong effects, tight DOF on selected book
 */
export const VIEW_POSTPROCESSING: Record<ViewLevel, PostProcessingConfig> = {
  universe: {
    bloom: { threshold: 0.9, intensity: 0.3, smoothing: 0.3 },
    dof: { focusDistance: 0, focalLength: 0.01, bokehScale: 1 },
    vignette: { offset: 0.3, darkness: 0.3 },
    noise: { opacity: 0.015 },
  },
  constellation: {
    bloom: { threshold: 0.9, intensity: 0.5, smoothing: 0.3 },
    dof: { focusDistance: 0, focalLength: 0.02, bokehScale: 2 },
    vignette: { offset: 0.3, darkness: 0.4 },
    noise: { opacity: 0.02 },
  },
  book: {
    bloom: { threshold: 0.85, intensity: 0.6, smoothing: 0.4 },
    dof: { focusDistance: 0, focalLength: 0.04, bokehScale: 3 },
    vignette: { offset: 0.2, darkness: 0.5 },
    noise: { opacity: 0.02 },
  },
}
