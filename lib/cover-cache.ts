/**
 * The on-disk cover cache shared by the book and appearance cover resolvers.
 *
 * Both resolvers persist the same record — a resolved URL, when it was resolved, and which
 * provider it came from — and differ only in which providers they can name. The provider
 * union is the type parameter so the two caches cannot drift on the fields they share.
 */

export interface CoverCacheEntry<Source extends string> {
  /** The resolved cover URL. */
  url: string
  /** ISO timestamp of the resolution. */
  resolvedAt: string
  /** Which provider the URL came from. */
  source: Source
}

/** A cover cache keyed by the id of whatever the cover belongs to. */
export type CoverCache<Source extends string> = {
  [id: string]: CoverCacheEntry<Source>
}
