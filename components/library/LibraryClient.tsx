'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  getAllBooks,
  getAllTopics,
  sortBooks,
  filterBooks,
  getReadingStats,
  getBooksReadByYear,
  getRatingDistribution,
  getTopicBreakdown,
} from '@/lib/books'
import type { Book, BookStatus } from '@/lib/books/types'
import { BookCard } from './BookCard'
import { BookDetail } from './BookDetail'
import { LibraryFilters } from './LibraryFilters'
import { ReadingStatsCharts } from './ReadingStatsCharts'
import { Book as BookIcon, Star, TrendingUp } from 'lucide-react'

interface CoverMap {
  [bookId: string]: string
}

export function LibraryClient() {
  const [statusFilter, setStatusFilter] = useState<BookStatus | null>(null)
  const [topicFilter, setTopicFilter] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<
    'title' | 'author' | 'year' | 'rating' | 'dateRead'
  >('rating')
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [coverMap, setCoverMap] = useState<CoverMap>({})

  // Load cover map
  useEffect(() => {
    fetch('/cover-map.json')
      .then((res) => res.json())
      .then((data) => setCoverMap(data))
      .catch(() => {
        // Cover map not yet generated, will use placeholders
      })
  }, [])

  const allBooks = useMemo(() => getAllBooks(), [])
  const allTopics = useMemo(() => getAllTopics(), [])
  const stats = useMemo(() => getReadingStats(), [])
  const booksPerYear = useMemo(() => getBooksReadByYear(allBooks), [allBooks])
  const ratingDistribution = useMemo(
    () => getRatingDistribution(allBooks),
    [allBooks]
  )
  const topicBreakdown = useMemo(() => getTopicBreakdown(allBooks), [allBooks])

  const filteredBooks = useMemo(() => {
    let books = allBooks

    // Apply filters
    books = filterBooks(books, {
      status: statusFilter ?? undefined,
      topic: topicFilter ?? undefined,
    })

    // Sort
    books = sortBooks(books, sortBy)

    return books
  }, [allBooks, statusFilter, topicFilter, sortBy])

  return (
    <>
      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={<BookIcon className="h-5 w-5" />}
          label="Total Books"
          value={stats.total}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Books Read"
          value={stats.read}
        />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          label="5-Star Books"
          value={stats.fiveStarBooks}
        />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          label="Avg Rating"
          value={stats.averageRating.toFixed(1)}
        />
      </div>

      <ReadingStatsCharts
        booksPerYear={booksPerYear}
        ratingDistribution={ratingDistribution}
        topicBreakdown={topicBreakdown}
      />

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar filters */}
        <aside className="shrink-0 lg:w-64">
          <LibraryFilters
            statusFilter={statusFilter}
            topicFilter={topicFilter}
            sortBy={sortBy}
            allTopics={allTopics}
            onStatusChange={setStatusFilter}
            onTopicChange={setTopicFilter}
            onSortChange={setSortBy}
          />
        </aside>

        {/* Book grid */}
        <main className="flex-1">
          <div className="mb-4 text-sm text-text-3" data-testid="library-book-count">
            {filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''}
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                coverUrl={coverMap[book.id]}
                onClick={() => setSelectedBook(book)}
              />
            ))}
          </div>

          {filteredBooks.length === 0 && (
            <div className="rounded-lg border border-border-1 bg-surface-1 p-8 text-center">
              <p className="text-text-3">No books match the current filters.</p>
            </div>
          )}
        </main>
      </div>

      {/* Book detail modal */}
      {selectedBook && (
        <BookDetail
          book={selectedBook}
          coverUrl={coverMap[selectedBook.id]}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
}) {
  return (
    <div className="rounded-lg border border-border-1 bg-surface-1 p-4">
      <div className="mb-2 flex items-center gap-2 text-text-3">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="font-satoshi text-2xl font-bold text-text-1">{value}</div>
    </div>
  )
}
