'use client'

import { CommandGroup, CommandItem } from '@/components/ui/command'
import type { SearchResult } from '@/lib/search/orama'
import type { SearchDocument } from '@/lib/search/types'
import { Home, FileText, BookOpen, Book, Folder, Terminal, Zap } from 'lucide-react'

/** The kinds a search hit can be — the same closed set the generated index is built from. */
type SearchResultType = SearchDocument['type']

interface CommandResultsProps {
  results: SearchResult[]
  onSelect: (url: string) => void
}

const typeLabels: Record<SearchResultType, string> = {
  page: 'Pages',
  essay: 'Essays',
  note: 'Notes',
  book: 'Books',
  project: 'Projects',
  tool: 'Workshop',
  action: 'Actions',
}

const typeIcons: Record<SearchResultType, React.ReactNode> = {
  page: <Home className="mr-2 h-4 w-4" />,
  essay: <FileText className="mr-2 h-4 w-4" />,
  note: <BookOpen className="mr-2 h-4 w-4" />,
  book: <Book className="mr-2 h-4 w-4" />,
  project: <Folder className="mr-2 h-4 w-4" />,
  tool: <Terminal className="mr-2 h-4 w-4" />,
  action: <Zap className="mr-2 h-4 w-4" />,
}

export function CommandResults({ results, onSelect }: CommandResultsProps) {
  const grouped = results.reduce<Partial<Record<SearchResultType, SearchResult[]>>>(
    (acc, result) => {
      const type = result.type
      const bucket = acc[type] ?? []
      bucket.push(result)
      acc[type] = bucket
      return acc
    },
    {},
  )

  // Order: pages first, then essays, notes, books, projects, actions
  const typeOrder: readonly SearchResultType[] = [
    'page',
    'essay',
    'note',
    'book',
    'project',
    'tool',
    'action',
  ]

  return (
    <>
      {typeOrder.map((type) => {
        const items = grouped[type]
        if (!items || items.length === 0) return null

        return (
          <CommandGroup key={type} heading={typeLabels[type]}>
            {items.map((result) => (
              <CommandItem key={result.id} value={result.id} onSelect={() => onSelect(result.url)}>
                {typeIcons[type]}
                <div className="flex flex-col">
                  <span>{result.title}</span>
                  {result.description && (
                    <span className="line-clamp-1 text-xs text-text-3">{result.description}</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )
      })}
    </>
  )
}
