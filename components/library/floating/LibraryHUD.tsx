'use client'

/**
 * LibraryHUD - Filter controls floating over the 3D scene.
 * Position: top-left corner with semi-transparent background.
 */

import { useCallback, useState, useEffect, useMemo } from 'react'
import { Search, Filter, ChevronDown, X } from 'lucide-react'
import { useLibraryStore } from '@/lib/library/store'
import { TOPIC_COLORS } from '@/lib/library/types'
import type { Book } from '@/lib/books/types'

// =============================================================================
// Types
// =============================================================================

interface LibraryHUDProps {
  books: Book[]
}

type StatusOption = Book['status'] | null
type SortOption = 'rating' | 'title' | 'author' | 'year'

// =============================================================================
// Constants
// =============================================================================

const STATUS_OPTIONS: { value: StatusOption; label: string }[] = [
  { value: null, label: 'All Status' },
  { value: 'read', label: 'Read' },
  { value: 'reading', label: 'Reading' },
  { value: 'want', label: 'Want to Read' },
  { value: 'abandoned', label: 'Abandoned' },
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'rating', label: 'Rating' },
  { value: 'title', label: 'Title' },
  { value: 'author', label: 'Author' },
  { value: 'year', label: 'Year' },
]

// =============================================================================
// Debounce Hook
// =============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// =============================================================================
// Select Component
// =============================================================================

interface SelectProps<T extends string | null> {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  icon?: React.ReactNode
  'aria-label': string
}

function Select<T extends string | null>({
  value,
  options,
  onChange,
  icon,
  'aria-label': ariaLabel,
}: SelectProps<T>) {
  const selectedLabel = options.find((opt) => opt.value === value)?.label ?? ''

  return (
    <div className="relative">
      <select
        value={value ?? ''}
        onChange={(e) => {
          const newValue = e.target.value === '' ? null : e.target.value
          onChange(newValue as T)
        }}
        className="appearance-none rounded-lg bg-surface-1/90 py-2 pl-3 pr-8 text-sm text-text-1 backdrop-blur-sm transition-colors hover:bg-surface-2/90 focus:outline-none focus:ring-2 focus:ring-warm/50"
        aria-label={ariaLabel}
      >
        {options.map((opt) => (
          <option key={opt.value ?? 'null'} value={opt.value ?? ''}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-3">
        <ChevronDown size={14} />
      </div>
    </div>
  )
}

// =============================================================================
// Topic Select Component
// =============================================================================

interface TopicSelectProps {
  value: string | null
  topics: string[]
  onChange: (value: string | null) => void
}

function TopicSelect({ value, topics, onChange }: TopicSelectProps) {
  return (
    <div className="relative">
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
        className="appearance-none rounded-lg bg-surface-1/90 py-2 pl-3 pr-8 text-sm text-text-1 backdrop-blur-sm transition-colors hover:bg-surface-2/90 focus:outline-none focus:ring-2 focus:ring-warm/50"
        aria-label="Filter by topic"
      >
        <option value="">All Topics</option>
        {topics.map((topic) => (
          <option key={topic} value={topic}>
            {topic.charAt(0).toUpperCase() + topic.slice(1)}
          </option>
        ))}
      </select>
      {value && (
        <div
          className="absolute left-1.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
          style={{
            backgroundColor:
              TOPIC_COLORS[value.toLowerCase()] ?? TOPIC_COLORS.default,
          }}
        />
      )}
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-3">
        <ChevronDown size={14} />
      </div>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function LibraryHUD({ books }: LibraryHUDProps) {
  const statusFilter = useLibraryStore((s) => s.statusFilter)
  const topicFilter = useLibraryStore((s) => s.topicFilter)
  const searchQuery = useLibraryStore((s) => s.searchQuery)
  const sortBy = useLibraryStore((s) => s.sortBy)
  const setFilters = useLibraryStore((s) => s.setFilters)
  const clearFilters = useLibraryStore((s) => s.clearFilters)
  const goToUniverse = useLibraryStore((s) => s.goToUniverse)
  const isFiltered = useLibraryStore((s) => s.isFiltered)

  // Calculate filtered book count
  const filteredCount = useMemo(() => {
    if (!isFiltered) return books.length

    return books.filter((book) => {
      // Status filter
      if (statusFilter && book.status !== statusFilter) return false

      // Topic filter (matches any topic in array)
      if (topicFilter && !book.topics.some((t) => t.toLowerCase() === topicFilter.toLowerCase())) {
        return false
      }

      // Search filter (case-insensitive, min 2 chars)
      if (searchQuery.length >= 2) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = book.title.toLowerCase().includes(query)
        const matchesAuthor = book.author.toLowerCase().includes(query)
        if (!matchesTitle && !matchesAuthor) return false
      }

      return true
    }).length
  }, [books, isFiltered, statusFilter, topicFilter, searchQuery])

  // Local search state (debounced)
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const debouncedSearch = useDebounce(localSearch, 300)

  // Extract unique topics from books
  const topics = useMemo(() => {
    const topicSet = new Set<string>()
    books.forEach((book) => {
      book.topics.forEach((topic) => topicSet.add(topic.toLowerCase()))
    })
    return Array.from(topicSet).sort()
  }, [books])

  // Sync debounced search to store
  useEffect(() => {
    if (debouncedSearch.length >= 2 || debouncedSearch.length === 0) {
      setFilters({ searchQuery: debouncedSearch })
    }
  }, [debouncedSearch, setFilters])

  // Handle status filter change
  const handleStatusChange = useCallback(
    (value: StatusOption) => {
      setFilters({ statusFilter: value })
      goToUniverse()
    },
    [setFilters, goToUniverse]
  )

  // Handle topic filter change
  const handleTopicChange = useCallback(
    (value: string | null) => {
      setFilters({ topicFilter: value })
      goToUniverse()
    },
    [setFilters, goToUniverse]
  )

  // Handle sort change
  const handleSortChange = useCallback(
    (value: SortOption | null) => {
      if (value) {
        setFilters({ sortBy: value })
      }
    },
    [setFilters]
  )

  // Handle search input
  const handleSearchInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalSearch(e.target.value)
    },
    []
  )

  // Handle search clear
  const handleSearchClear = useCallback(() => {
    setLocalSearch('')
    setFilters({ searchQuery: '' })
  }, [setFilters])

  // Handle clear all filters
  const handleClearAll = useCallback(() => {
    setLocalSearch('')
    clearFilters()
    goToUniverse()
  }, [clearFilters, goToUniverse])

  return (
    <div
      className="fixed left-4 top-16 z-40 flex flex-col gap-2"
      role="region"
      aria-label="Library filters"
    >
      {/* Search input */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
        />
        <input
          type="search"
          value={localSearch}
          onChange={handleSearchInput}
          placeholder="Search books..."
          className="w-48 rounded-lg bg-surface-1/90 py-2 pl-9 pr-8 text-sm text-text-1 placeholder:text-text-3 backdrop-blur-sm transition-colors hover:bg-surface-2/90 focus:bg-surface-2/90 focus:outline-none focus:ring-2 focus:ring-warm/50"
          aria-label="Search books by title or author"
        />
        {localSearch && (
          <button
            onClick={handleSearchClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-3 hover:text-text-1"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2">
        <Select
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={handleStatusChange}
          icon={<Filter size={14} />}
          aria-label="Filter by status"
        />
        <TopicSelect value={topicFilter} topics={topics} onChange={handleTopicChange} />
        <Select
          value={sortBy}
          options={SORT_OPTIONS}
          onChange={handleSortChange}
          aria-label="Sort by"
        />
      </div>

      {/* Filter status and clear button */}
      {isFiltered && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-2">
            {filteredCount === 0 ? (
              <span className="text-red-400">No books match filters</span>
            ) : (
              <span>
                {filteredCount} {filteredCount === 1 ? 'book' : 'books'} found
              </span>
            )}
          </span>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 rounded-lg bg-warm/20 px-3 py-1.5 text-xs font-medium text-warm transition-colors hover:bg-warm/30"
          >
            <X size={12} />
            <span>Clear</span>
          </button>
        </div>
      )}
    </div>
  )
}
