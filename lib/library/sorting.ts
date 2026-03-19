import type { Book } from '@/lib/books/types'

export type SortMode = 'reading-order' | 'topic' | 'author' | 'year' | 'genre'

export const SORT_MODES: { key: SortMode; label: string }[] = [
  { key: 'reading-order', label: 'Reading Order' },
  { key: 'topic', label: 'Topic' },
  { key: 'author', label: 'Author' },
  { key: 'year', label: 'Year' },
  { key: 'genre', label: 'Genre' },
]

/**
 * Sort books by the given mode.
 * Reading order = original array order (by index).
 * All other sorts are stable (preserve relative order within ties).
 */
export function sortLibrary(books: Book[], mode: SortMode): Book[] {
  if (mode === 'reading-order') return books

  const sorted = [...books]

  switch (mode) {
    case 'topic':
      sorted.sort((a, b) => {
        const aTopic = a.topics[0] ?? ''
        const bTopic = b.topics[0] ?? ''
        return aTopic.localeCompare(bTopic) || a.title.localeCompare(b.title)
      })
      break
    case 'author':
      sorted.sort((a, b) => {
        const aLast = getLastName(a.author)
        const bLast = getLastName(b.author)
        return aLast.localeCompare(bLast) || a.title.localeCompare(b.title)
      })
      break
    case 'year':
      sorted.sort((a, b) => a.year - b.year || a.title.localeCompare(b.title))
      break
    case 'genre':
      sorted.sort((a, b) => {
        const aGenre = a.genre ?? ''
        const bGenre = b.genre ?? ''
        return aGenre.localeCompare(bGenre) || a.title.localeCompare(b.title)
      })
      break
  }

  return sorted
}

function getLastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  return parts[parts.length - 1] ?? fullName
}
