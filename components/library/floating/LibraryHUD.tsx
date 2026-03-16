'use client'

import { useCallback, useState, useEffect, useMemo, useRef } from 'react'
import { Search, ChevronDown, X, Settings } from 'lucide-react'
import { useLibraryStore } from '@/lib/library/store'
import { TOPIC_COLORS, DEFAULT_TOPIC_COLOR } from '@/lib/library/types'
import type { QualityLevel } from '@/lib/library/types'
import type { Book } from '@/lib/books/types'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface LibraryHUDProps {
  books: Book[]
}

type StatusOption = Book['status'] | null
type SortOption = 'rating' | 'title' | 'author' | 'year'

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

const QUALITY_OPTIONS: { value: QualityLevel; label: string; description: string }[] = [
  { value: 'full', label: 'Full', description: 'All effects' },
  { value: 'reduced', label: 'Reduced', description: 'No particles' },
  { value: 'minimal', label: 'Minimal', description: 'No postprocessing' },
]

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

interface SelectProps<T extends string | null> {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  'aria-label': string
}

function Select<T extends string | null>({
  value,
  options,
  onChange,
  'aria-label': ariaLabel,
}: SelectProps<T>) {
  return (
    <div className="relative">
      <select
        value={value ?? ''}
        onChange={(e) => {
          const newValue = e.target.value === '' ? null : e.target.value
          onChange(newValue as T)
        }}
        className="min-h-11 w-full appearance-none rounded-xl bg-surface-1/90 py-2 pl-3 pr-8 text-sm text-text-1 backdrop-blur-sm transition-colors hover:bg-surface-2/90 focus:outline-none focus:ring-2 focus:ring-warm/50 sm:w-auto"
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
        className="min-h-11 w-full appearance-none rounded-xl bg-surface-1/90 py-2 pl-3 pr-8 text-sm text-text-1 backdrop-blur-sm transition-colors hover:bg-surface-2/90 focus:outline-none focus:ring-2 focus:ring-warm/50 sm:w-auto"
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
            backgroundColor: TOPIC_COLORS[value.toLowerCase()] ?? DEFAULT_TOPIC_COLOR,
          }}
        />
      )}
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-3">
        <ChevronDown size={14} />
      </div>
    </div>
  )
}

export function LibraryHUD({ books }: LibraryHUDProps) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const statusFilter = useLibraryStore((s) => s.statusFilter)
  const topicFilter = useLibraryStore((s) => s.topicFilter)
  const searchQuery = useLibraryStore((s) => s.searchQuery)
  const sortBy = useLibraryStore((s) => s.sortBy)
  const setFilters = useLibraryStore((s) => s.setFilters)
  const clearFilters = useLibraryStore((s) => s.clearFilters)
  const isFiltered = useLibraryStore((s) => s.isFiltered)

  // Quality settings
  const qualityLevel = useLibraryStore((s) => s.qualityLevel)
  const setQualityLevel = useLibraryStore((s) => s.setQualityLevel)
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const qualityMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setShowGuide(window.localStorage.getItem('library-guide-dismissed') !== 'true')
  }, [])

  // Close quality menu on outside click
  useEffect(() => {
    if (!showQualityMenu) return

    const handleClickOutside = (e: MouseEvent) => {
      if (qualityMenuRef.current && !qualityMenuRef.current.contains(e.target as Node)) {
        setShowQualityMenu(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowQualityMenu(false)
      }
    }

    // Delay to avoid closing immediately from the button click
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showQualityMenu])

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

      // Search filter (case-insensitive, min 2 chars, trimmed)
      const trimmedQuery = searchQuery.trim()
      if (trimmedQuery.length >= 2) {
        const query = trimmedQuery.toLowerCase()
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
  // Note: setFilters already handles zooming out to universe view when filters change
  const handleStatusChange = useCallback(
    (value: StatusOption) => {
      setFilters({ statusFilter: value })
    },
    [setFilters],
  )

  // Handle topic filter change
  const handleTopicChange = useCallback(
    (value: string | null) => {
      setFilters({ topicFilter: value })
    },
    [setFilters],
  )

  // Handle sort change
  const handleSortChange = useCallback(
    (value: SortOption | null) => {
      if (value) {
        setFilters({ sortBy: value })
      }
    },
    [setFilters],
  )

  // Handle search input
  const handleSearchInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value)
  }, [])

  // Handle search clear
  const handleSearchClear = useCallback(() => {
    setLocalSearch('')
    setFilters({ searchQuery: '' })
  }, [setFilters])

  // Handle clear all filters
  const handleClearAll = useCallback(() => {
    setLocalSearch('')
    clearFilters()
  }, [clearFilters])

  const dismissGuide = useCallback(() => {
    setShowGuide(false)
    window.localStorage.setItem('library-guide-dismissed', 'true')
  }, [])

  return (
    <div
      className="fixed left-3 right-3 top-[4.75rem] z-40 sm:left-4 sm:right-auto sm:top-16 sm:max-w-[22rem]"
      role="region"
      aria-label="Library filters"
    >
      <div className="glass-panel rounded-[1.5rem] p-3 sm:p-4">
        {showGuide && (
          <div className="mb-3 rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="max-w-sm">
                <p className="eyebrow text-text-3">Library</p>
                <h1 className="mt-3 font-satoshi text-xl font-medium text-text-1 sm:text-2xl">
                  Browse the research universe.
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-text-2">
                  {isMobile
                    ? 'Search or filter first, then tap a constellation to move from cosmos to shelf.'
                    : 'Search by title or author, filter down to a topic, then zoom into a constellation once something catches your eye.'}
                </p>
              </div>
              <button
                onClick={dismissGuide}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-1 bg-white/[0.03] text-text-3 transition hover:border-warm/40 hover:text-text-1"
                aria-label="Dismiss library guide"
              >
                <X size={16} />
              </button>
            </div>

            {isMobile ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/8 bg-white/[0.02] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-text-2">
                  Search first
                </span>
                <span className="rounded-full border border-white/8 bg-white/[0.02] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-text-2">
                  Tap to zoom
                </span>
                <span className="rounded-full border border-white/8 bg-white/[0.02] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-text-2">
                  Escape to step back
                </span>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-text-3">Search</p>
                  <p className="mt-2 text-sm text-text-2">
                    Find a title, author, or thread instantly.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-text-3">Zoom</p>
                  <p className="mt-2 text-sm text-text-2">
                    Click a constellation to move from cosmos to shelf.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-text-3">Reset</p>
                  <p className="mt-2 text-sm text-text-2">
                    Use Escape or breadcrumbs to step back out.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="mb-2 pl-1 font-mono text-[11px] uppercase tracking-[0.24em] text-text-3">
          Library controls
        </p>

        {/* Search input */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
          <input
            type="search"
            value={localSearch}
            onChange={handleSearchInput}
            placeholder="Search books..."
            className="min-h-11 w-full rounded-xl bg-surface-1/90 py-2 pl-9 pr-8 text-sm text-text-1 placeholder:text-text-3 backdrop-blur-sm transition-colors hover:bg-surface-2/90 focus:bg-surface-2/90 focus:outline-none focus:ring-2 focus:ring-warm/50"
            aria-label="Search books by title or author"
          />
          {localSearch && (
            <button
              onClick={handleSearchClear}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-text-3 transition hover:bg-surface-2 hover:text-text-1"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Select
            value={statusFilter}
            options={STATUS_OPTIONS}
            onChange={handleStatusChange}
            aria-label="Filter by status"
          />
          <TopicSelect value={topicFilter} topics={topics} onChange={handleTopicChange} />
          <div className="sm:col-span-2">
            <Select
              value={sortBy}
              options={SORT_OPTIONS}
              onChange={handleSortChange}
              aria-label="Sort by"
            />
          </div>
        </div>

        {/* Filter status and clear button */}
        {isFiltered && (
          <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-text-2">
              {filteredCount === 0 ? (
                <span className="text-red-400">No books match the current filters.</span>
              ) : (
                <span>
                  {filteredCount} {filteredCount === 1 ? 'book' : 'books'} in view
                </span>
              )}
            </span>
            <button
              onClick={handleClearAll}
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-warm/20 px-4 text-xs font-medium text-warm transition-colors hover:bg-warm/30"
            >
              <X size={12} />
              <span>Clear filters</span>
            </button>
          </div>
        )}

        {/* Quality settings button */}
        <div className="relative mt-3">
          <button
            onClick={() => setShowQualityMenu((prev) => !prev)}
            className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl bg-surface-1/90 px-3 py-2 text-sm text-text-2 backdrop-blur-sm transition-colors hover:bg-surface-2/90"
            aria-label="Quality settings"
            aria-expanded={showQualityMenu}
          >
            <span className="flex items-center gap-2">
              <Settings size={14} />
              <span>Quality</span>
            </span>
            <span className="text-text-1">
              {QUALITY_OPTIONS.find((o) => o.value === qualityLevel)?.label}
            </span>
          </button>

          {/* Quality dropdown */}
          {showQualityMenu && (
            <div
              ref={qualityMenuRef}
              role="listbox"
              className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl bg-surface-1/95 p-1 shadow-lg backdrop-blur-sm"
            >
              {QUALITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  role="option"
                  aria-selected={qualityLevel === option.value}
                  onClick={() => {
                    setQualityLevel(option.value)
                    setShowQualityMenu(false)
                  }}
                  className={`flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    qualityLevel === option.value
                      ? 'bg-warm/20 text-warm'
                      : 'text-text-1 hover:bg-surface-2'
                  }`}
                >
                  <span>{option.label}</span>
                  <span className="text-xs text-text-3">{option.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
