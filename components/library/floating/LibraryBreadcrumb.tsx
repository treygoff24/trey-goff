'use client'

/**
 * LibraryBreadcrumb - Navigation breadcrumb for the 3D library.
 * Shows: Library > Topic > Book Title
 */

import { useCallback } from 'react'
import { ChevronRight, BookOpen } from 'lucide-react'
import { useLibraryStore } from '@/lib/library/store'

// =============================================================================
// Component
// =============================================================================

export function LibraryBreadcrumb() {
  const viewLevel = useLibraryStore((s) => s.viewLevel)
  const activeConstellation = useLibraryStore((s) => s.activeConstellation)
  const selectedBook = useLibraryStore((s) => s.selectedBook)
  const goToUniverse = useLibraryStore((s) => s.goToUniverse)
  const stepBack = useLibraryStore((s) => s.stepBack)

  // Handle click on Library (root)
  const handleLibraryClick = useCallback(() => {
    goToUniverse()
  }, [goToUniverse])

  // Handle click on constellation
  const handleConstellationClick = useCallback(() => {
    if (viewLevel === 'book' && activeConstellation) {
      // Go back to constellation view
      stepBack()
    }
  }, [viewLevel, activeConstellation, stepBack])

  // Capitalize topic name
  const topicLabel = activeConstellation
    ? activeConstellation.charAt(0).toUpperCase() + activeConstellation.slice(1)
    : null

  return (
    <nav
      className="fixed left-4 top-4 z-40 flex items-center gap-1 rounded-lg bg-bg-0/80 px-3 py-2 text-sm backdrop-blur-sm"
      aria-label="Library navigation"
    >
      {/* Library root */}
      <button
        onClick={handleLibraryClick}
        className={`flex items-center gap-1.5 transition-colors ${
          viewLevel === 'universe'
            ? 'text-warm'
            : 'text-text-2 hover:text-text-1'
        }`}
        aria-current={viewLevel === 'universe' ? 'page' : undefined}
      >
        <BookOpen size={16} />
        <span>Library</span>
      </button>

      {/* Constellation level */}
      {activeConstellation && (
        <>
          <ChevronRight size={14} className="text-text-3" />
          <button
            onClick={handleConstellationClick}
            className={`transition-colors ${
              viewLevel === 'constellation'
                ? 'text-warm'
                : 'text-text-2 hover:text-text-1'
            }`}
            aria-current={viewLevel === 'constellation' ? 'page' : undefined}
          >
            {topicLabel}
          </button>
        </>
      )}

      {/* Book level */}
      {selectedBook && (
        <>
          <ChevronRight size={14} className="text-text-3" />
          <span className="max-w-[150px] truncate text-warm" aria-current="page">
            {selectedBook.title}
          </span>
        </>
      )}
    </nav>
  )
}
