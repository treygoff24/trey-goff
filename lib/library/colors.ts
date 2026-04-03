const FALLBACK_COLOR = '#1a1a2e'

export type BookColorMap = Record<string, string>

/**
 * Get the dominant cover color for a book by its ID.
 * Falls back to a dark indigo if no color was extracted.
 */
export function getBookColor(colors: BookColorMap, bookId: string): string {
  return colors[bookId] ?? FALLBACK_COLOR
}
