'use client'

import { cn } from '@/lib/utils'
import type { BookStatus } from '@/lib/books/types'

interface LibraryFiltersProps {
  statusFilter: BookStatus | null
  topicFilter: string | null
  sortBy: 'title' | 'author' | 'year' | 'rating' | 'dateRead'
  allTopics: string[]
  onStatusChange: (status: BookStatus | null) => void
  onTopicChange: (topic: string | null) => void
  onSortChange: (sort: 'title' | 'author' | 'year' | 'rating' | 'dateRead') => void
}

const statuses: { value: BookStatus | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'read', label: 'Read' },
  { value: 'reading', label: 'Reading' },
  { value: 'want', label: 'Want to Read' },
  { value: 'abandoned', label: 'Abandoned' },
]

const sortOptions: { value: LibraryFiltersProps['sortBy']; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'author', label: 'Author' },
  { value: 'year', label: 'Year' },
  { value: 'rating', label: 'Rating' },
  { value: 'dateRead', label: 'Date Read' },
]

export function LibraryFilters({
  statusFilter,
  topicFilter,
  sortBy,
  allTopics,
  onStatusChange,
  onTopicChange,
  onSortChange,
}: LibraryFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Status filter */}
      <div>
        <label className="mb-2 block text-sm font-medium text-text-3">
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <button
              key={status.value ?? 'all'}
              onClick={() => onStatusChange(status.value)}
              className={cn(
                'rounded-full px-3 py-1 text-sm transition-colors',
                statusFilter === status.value
                  ? 'bg-warm text-bg-0'
                  : 'bg-surface-1 text-text-2 hover:bg-surface-2'
              )}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Topic filter */}
      <div>
        <label className="mb-2 block text-sm font-medium text-text-3">
          Topic
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onTopicChange(null)}
            className={cn(
              'rounded-full px-3 py-1 text-sm transition-colors',
              topicFilter === null
                ? 'bg-warm text-bg-0'
                : 'bg-surface-1 text-text-2 hover:bg-surface-2'
            )}
          >
            All
          </button>
          {allTopics.map((topic) => (
            <button
              key={topic}
              onClick={() => onTopicChange(topic)}
              className={cn(
                'rounded-full px-3 py-1 text-sm transition-colors',
                topicFilter === topic
                  ? 'bg-warm text-bg-0'
                  : 'bg-surface-1 text-text-2 hover:bg-surface-2'
              )}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="mb-2 block text-sm font-medium text-text-3">
          Sort by
        </label>
        <select
          value={sortBy}
          onChange={(e) =>
            onSortChange(e.target.value as LibraryFiltersProps['sortBy'])
          }
          className="rounded-lg border border-border-1 bg-surface-1 px-3 py-2 text-sm text-text-1 focus:border-warm focus:outline-none"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
