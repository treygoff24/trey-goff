export type SortMode = 'topic' | 'year' | 'author' | 'genre'

export const SORT_MODES: { key: SortMode; label: string }[] = [
  { key: 'topic', label: 'Topic' },
  { key: 'year', label: 'Year' },
  { key: 'author', label: 'Author' },
  { key: 'genre', label: 'Genre' },
]
