'use client'

import { CommandGroup, CommandItem } from '@/components/ui/command'
import type { SearchResult } from '@/lib/search/orama'
import {
  Home,
  FileText,
  BookOpen,
  Book,
  Folder,
  Zap,
} from 'lucide-react'

interface CommandResultsProps {
  results: SearchResult[]
  onSelect: (url: string) => void
}

const typeLabels: Record<string, string> = {
  page: 'Pages',
  essay: 'Essays',
  note: 'Notes',
  book: 'Books',
  project: 'Projects',
  action: 'Actions',
}

const typeIcons: Record<string, React.ReactNode> = {
  page: <Home className="mr-2 h-4 w-4" />,
  essay: <FileText className="mr-2 h-4 w-4" />,
  note: <BookOpen className="mr-2 h-4 w-4" />,
  book: <Book className="mr-2 h-4 w-4" />,
  project: <Folder className="mr-2 h-4 w-4" />,
  action: <Zap className="mr-2 h-4 w-4" />,
}

export function CommandResults({ results, onSelect }: CommandResultsProps) {
  // Group results by type
  const grouped = results.reduce(
    (acc, result) => {
      const type = result.type
      if (!acc[type]) acc[type] = []
      acc[type].push(result)
      return acc
    },
    {} as Record<string, SearchResult[]>
  )

  // Order: pages first, then essays, notes, books, projects, actions
  const typeOrder = ['page', 'essay', 'note', 'book', 'project', 'action']

  return (
    <>
      {typeOrder.map((type) => {
        const items = grouped[type]
        if (!items || items.length === 0) return null

        return (
          <CommandGroup key={type} heading={typeLabels[type]}>
            {items.map((result) => (
              <CommandItem
                key={result.id}
                value={result.id}
                onSelect={() => onSelect(result.url)}
              >
                {typeIcons[type]}
                <div className="flex flex-col">
                  <span>{result.title}</span>
                  {result.description && (
                    <span className="line-clamp-1 text-xs text-text-3">
                      {result.description}
                    </span>
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
