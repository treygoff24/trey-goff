const FALLBACK_COLOR = '#1a1a2e'

export type BookColorMap = Record<string, string>

/**
 * Load book colors from the generated JSON.
 * Called server-side in page.tsx and passed to the client component.
 */
export async function loadBookColors(): Promise<BookColorMap> {
  try {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const filePath = path.join(process.cwd(), 'public', 'book-colors.json')
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as BookColorMap
  } catch {
    return {}
  }
}

/**
 * Get the dominant cover color for a book by its ID.
 * Falls back to a dark indigo if no color was extracted.
 */
export function getBookColor(colors: BookColorMap, bookId: string): string {
  return colors[bookId] ?? FALLBACK_COLOR
}
