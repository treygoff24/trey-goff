'use client'

/**
 * AccessibleBookList - Hidden list of all books for screen reader accessibility.
 * Provides an accessible alternative to the 3D visualization.
 */

import { useMemo } from 'react'
import type { Book } from '@/lib/books/types'
import { useLibraryStore } from '@/lib/library/store'

// =============================================================================
// Types
// =============================================================================

interface AccessibleBookListProps {
  books: Book[]
}

// =============================================================================
// Component
// =============================================================================

export function AccessibleBookList({ books }: AccessibleBookListProps) {
  const selectBook = useLibraryStore((s) => s.selectBook)
  const statusFilter = useLibraryStore((s) => s.statusFilter)
  const topicFilter = useLibraryStore((s) => s.topicFilter)
  const searchQuery = useLibraryStore((s) => s.searchQuery)

  // Group books by topic
  const groupedBooks = useMemo(() => {
    const groups: Record<string, Book[]> = {}
    const orphans: Book[] = []

    for (const book of books) {
      // Apply filters
      if (statusFilter && book.status !== statusFilter) continue
      if (
        topicFilter &&
        !book.topics.some((t) => t.toLowerCase() === topicFilter.toLowerCase())
      ) {
        continue
      }
      const trimmedQuery = searchQuery.trim()
      if (trimmedQuery.length >= 2) {
        const query = trimmedQuery.toLowerCase()
        const matchesTitle = book.title.toLowerCase().includes(query)
        const matchesAuthor = book.author.toLowerCase().includes(query)
        if (!matchesTitle && !matchesAuthor) continue
      }

      // Group by primary topic
      const primaryTopic = book.topics[0]
      if (primaryTopic) {
        if (!groups[primaryTopic]) {
          groups[primaryTopic] = []
        }
        groups[primaryTopic].push(book)
      } else {
        orphans.push(book)
      }
    }

    return { groups, orphans }
  }, [books, statusFilter, topicFilter, searchQuery])

  const topics = Object.keys(groupedBooks.groups).sort()

  return (
    <div
      className="sr-only"
      role="region"
      aria-label="Book library (accessible list)"
    >
      <h2>Library Books</h2>
      <p>
        This is an accessible list of all books in the library. Use your screen
        reader&apos;s list navigation to browse books by topic.
      </p>

      {topics.map((topic) => {
        const topicBooks = groupedBooks.groups[topic]
        if (!topicBooks) return null

        return (
          <section key={topic} aria-labelledby={`topic-${topic}`}>
            <h3 id={`topic-${topic}`}>
              {topic} ({topicBooks.length} books)
            </h3>
            <ul>
              {topicBooks.map((book) => (
                <li key={book.id}>
                  <button
                    onClick={() => selectBook(book)}
                    className="text-left"
                    tabIndex={-1}
                    aria-label={`${book.title} by ${book.author}${
                      book.rating ? `, rated ${book.rating} out of 5` : ''
                    }`}
                  >
                    <span className="font-medium">{book.title}</span> by{' '}
                    {book.author}
                    {book.rating && ` (${book.rating}/5)`}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      {groupedBooks.orphans.length > 0 && (
        <section aria-labelledby="topic-uncategorized">
          <h3 id="topic-uncategorized">
            Uncategorized ({groupedBooks.orphans.length} books)
          </h3>
          <ul>
            {groupedBooks.orphans.map((book) => (
              <li key={book.id}>
                <button
                  onClick={() => selectBook(book)}
                  className="text-left"
                  tabIndex={-1}
                  aria-label={`${book.title} by ${book.author}${
                    book.rating ? `, rated ${book.rating} out of 5` : ''
                  }`}
                >
                  <span className="font-medium">{book.title}</span> by{' '}
                  {book.author}
                  {book.rating && ` (${book.rating}/5)`}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
