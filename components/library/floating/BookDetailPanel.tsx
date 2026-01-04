'use client'

/**
 * BookDetailPanel - HTML overlay showing selected book details.
 * Slides from right on desktop, bottom sheet on mobile.
 */

import { useEffect, useRef, useCallback } from 'react'
import { X, ExternalLink, Star } from 'lucide-react'
import { useLibraryStore } from '@/lib/library/store'
import { isValidAmazonUrl } from '@/lib/library/amazon'
import { getTopicColor, DEFAULT_TOPIC_COLOR } from '@/lib/library/types'

// =============================================================================
// Component
// =============================================================================

export function BookDetailPanel() {
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const selectedBook = useLibraryStore((s) => s.selectedBook)
  const selectBook = useLibraryStore((s) => s.selectBook)

  // Close handler
  const handleClose = useCallback(() => {
    selectBook(null)
  }, [selectBook])

  // Focus management: store previous focus and restore on close
  useEffect(() => {
    if (selectedBook && panelRef.current) {
      // Store the element that had focus before opening
      previousFocusRef.current = document.activeElement as HTMLElement
      // Focus the first focusable element (close button)
      const firstFocusable = panelRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      firstFocusable?.focus()
    } else if (previousFocusRef.current) {
      // Restore focus when closing
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }, [selectedBook])

  // Focus trap: prevent tabbing outside the modal
  useEffect(() => {
    if (!selectedBook || !panelRef.current) return

    const panel = panelRef.current
    const focusableElements = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift+Tab: if on first element, wrap to last
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable?.focus()
        }
      } else {
        // Tab: if on last element, wrap to first
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable?.focus()
        }
      }
    }

    panel.addEventListener('keydown', handleKeyDown)
    return () => panel.removeEventListener('keydown', handleKeyDown)
  }, [selectedBook])

  if (!selectedBook) {
    return null
  }

  const primaryTopic = selectedBook.topics[0]?.toLowerCase()
  const topicColor = primaryTopic
    ? getTopicColor(primaryTopic)
    : DEFAULT_TOPIC_COLOR

  const hasValidAmazonUrl = isValidAmazonUrl(selectedBook.amazonUrl)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-title"
        tabIndex={-1}
        className="fixed z-50 overflow-y-auto bg-surface-1 shadow-2xl outline-none
          max-md:inset-x-0 max-md:bottom-0 max-md:rounded-t-2xl max-md:max-h-[85vh]
          md:right-0 md:top-0 md:h-full md:w-[400px] md:border-l md:border-surface-2"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-text-2 transition-colors hover:bg-surface-2 hover:text-text-1"
          aria-label="Close details"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-6 pt-12 md:pt-6">
          {/* Header */}
          <div className="mb-6">
            <h2
              id="book-title"
              className="font-newsreader text-2xl font-medium text-text-1"
            >
              {selectedBook.title}
            </h2>
            <p className="mt-1 text-text-2">{selectedBook.author}</p>
            <p className="mt-1 text-sm text-text-3">{selectedBook.year}</p>
          </div>

          {/* Rating */}
          {selectedBook.rating && (
            <div className="mb-4 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className={
                    i < selectedBook.rating!
                      ? 'fill-warm text-warm'
                      : 'text-surface-2'
                  }
                />
              ))}
              <span className="ml-2 text-sm text-text-3">
                {selectedBook.rating}/5
              </span>
            </div>
          )}

          {/* Topics */}
          {selectedBook.topics.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedBook.topics.map((topic, index) => (
                <span
                  key={topic}
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    backgroundColor:
                      index === 0
                        ? `${topicColor}20`
                        : `${getTopicColor(topic.toLowerCase())}15`,
                    color: index === 0 ? topicColor : getTopicColor(topic.toLowerCase()),
                  }}
                >
                  {topic}
                </span>
              ))}
            </div>
          )}

          {/* Why I Love It */}
          {selectedBook.whyILoveIt && (
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-medium text-text-2">
                Why I Love It
              </h3>
              <p className="font-newsreader text-text-1 leading-relaxed">
                {selectedBook.whyILoveIt}
              </p>
            </div>
          )}

          {/* Review */}
          {selectedBook.review && (
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-medium text-text-2">Review</h3>
              <p className="font-newsreader text-text-1 leading-relaxed">
                {selectedBook.review}
              </p>
            </div>
          )}

          {/* Status */}
          <div className="mb-6">
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                selectedBook.status === 'read'
                  ? 'bg-green-500/20 text-green-400'
                  : selectedBook.status === 'reading'
                    ? 'bg-blue-500/20 text-blue-400'
                    : selectedBook.status === 'want'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-red-500/20 text-red-400'
              }`}
            >
              {selectedBook.status === 'read'
                ? 'Read'
                : selectedBook.status === 'reading'
                  ? 'Currently Reading'
                  : selectedBook.status === 'want'
                    ? 'Want to Read'
                    : 'Abandoned'}
            </span>
          </div>

          {/* Amazon link */}
          {hasValidAmazonUrl && (
            <a
              href={selectedBook.amazonUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg bg-warm px-4 py-3 font-medium text-bg-0 transition-colors hover:bg-warm/90"
            >
              <span>Buy on Amazon</span>
              <ExternalLink size={16} />
            </a>
          )}

          {/* Goodreads link (if no Amazon) */}
          {!hasValidAmazonUrl && selectedBook.goodreadsUrl && (
            <a
              href={selectedBook.goodreadsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg bg-surface-2 px-4 py-3 font-medium text-text-1 transition-colors hover:bg-surface-2/80"
            >
              <span>View on Goodreads</span>
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>
    </>
  )
}
