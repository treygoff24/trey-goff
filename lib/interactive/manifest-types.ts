/**
 * Manifest types for Interactive route content.
 * These manifests are generated at build time from content sources.
 */

/**
 * The header every generated manifest carries. `scripts/generate-interactive-manifests.ts`
 * stamps both fields on every manifest it writes, so they live in one place rather than
 * being repeated per manifest.
 */
export interface ManifestEnvelope {
  /** Manifest schema version */
  version: string
  /** ISO timestamp of the generating build */
  generated: string
}

/** The common manifest shape: the envelope plus a flat list of entries. */
export interface EntriesManifest<Entry> extends ManifestEnvelope {
  entries: Entry[]
}

export interface EssayManifestEntry {
  /** Unique identifier (slug) */
  id: string
  /** URL slug for linking */
  slug: string
  /** Essay title */
  title: string
  /** Short excerpt/summary */
  excerpt: string
  /** Content tags */
  tags: string[]
  /** Cover image path (optional) */
  coverImage?: string
  /** Publication date (ISO string) */
  publishedAt: string
  /** Reading time in minutes */
  readingTime: number
  /** Publication status */
  status: 'draft' | 'published' | 'evergreen'
}

export type EssaysManifest = EntriesManifest<EssayManifestEntry>

export type BookTier = 'favorites' | 'recommended' | 'read' | 'reading' | 'want'

export interface BookManifestEntry {
  /** Unique identifier */
  id: string
  /** Book title */
  title: string
  /** Author name(s) */
  author: string
  /** Star rating (1-5) */
  rating?: number
  /** Review slug if review exists */
  reviewSlug?: string
  /** Cover image path */
  coverImage?: string
  /** Tier for shelf placement */
  tier: BookTier
  /** Why it's loved (short blurb) */
  blurb?: string
  /** Topics/tags */
  topics: string[]
  /** Publication year */
  year?: number
}

export type BooksManifest = EntriesManifest<BookManifestEntry>

export interface ProjectLink {
  label: string
  url: string
}

export interface ProjectManifestEntry {
  /** Unique identifier (slug) */
  id: string
  /** Project title */
  title: string
  /** One-line summary */
  summary: string
  /** External links */
  links: ProjectLink[]
  /** Image paths */
  images: string[]
  /** Tags */
  tags: string[]
  /** Project status */
  status: 'active' | 'shipped' | 'on-hold' | 'archived' | 'idea'
  /** Project type */
  type: 'software' | 'policy' | 'professional' | 'experiment'
  /** Featured rank for ordering */
  featuredRank?: number
}

export type ProjectsManifest = EntriesManifest<ProjectManifestEntry>

/** The three lifts the gym surfaces, in display order. */
export const LIFT_NAMES = ['squat', 'bench', 'deadlift'] as const

export type LiftName = (typeof LIFT_NAMES)[number]

export interface LiftRecord {
  /** Weight lifted */
  weight: number
  /** Unit (lb or kg) */
  unit: 'lb' | 'kg'
  /** Date achieved (ISO string) */
  date: string
  /** Competition or gym PR */
  type?: 'competition' | 'gym'
  /** Notes */
  notes?: string
}

export interface LiftsManifestEntry {
  /** Lift name */
  lift: LiftName
  /** Current PR */
  pr: LiftRecord
  /** Historical PRs (optional) */
  history?: LiftRecord[]
}

export interface LiftsManifest extends ManifestEnvelope {
  /** Total (sum of best squat, bench, deadlift) */
  total: LiftRecord
  /** Individual lift PRs */
  lifts: LiftsManifestEntry[]
}

export interface InteractiveManifests {
  essays: EssaysManifest
  books: BooksManifest
  projects: ProjectsManifest
  lifts: LiftsManifest
}
