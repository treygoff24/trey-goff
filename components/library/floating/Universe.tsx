'use client'

/**
 * Universe - Top-level scene component that renders constellations, drifters, and background.
 * This is the main 3D scene containing all library content.
 */

import { useCallback, useMemo } from 'react'
import type { ConstellationData, BookWithPosition } from '@/lib/library/types'
import { useLibraryStore, selectIsFiltered } from '@/lib/library/store'
import { filterBooks, calculateFilteredPositions } from '@/lib/library/constellation'
import { StarField } from './StarField'
import { Constellation } from './Constellation'
import { Drifter } from './Drifter'
import { FloatingBook } from './FloatingBook'
import { StatsConstellation } from './StatsConstellation'

// =============================================================================
// Types
// =============================================================================

interface UniverseProps {
  constellations: ConstellationData[]
  drifters: BookWithPosition[]
  reducedMotion: boolean
}

// =============================================================================
// Filtered Results Cluster
// =============================================================================

function FilteredCluster({
  books,
  reducedMotion,
}: {
  books: BookWithPosition[]
  reducedMotion: boolean
}) {
  if (books.length === 0) {
    // Empty state handled by HUD overlay in Phase 6
    return null
  }

  return (
    <group>
      {books.map((book) => (
        <FloatingBook
          key={book.id}
          book={book}
          reducedMotion={reducedMotion}
          targetPosition={book.position}
        />
      ))}
    </group>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function Universe({
  constellations,
  drifters,
  reducedMotion,
}: UniverseProps) {
  // Store state
  const viewLevel = useLibraryStore((s) => s.viewLevel)
  const activeConstellation = useLibraryStore((s) => s.activeConstellation)
  const isFiltered = useLibraryStore(selectIsFiltered)
  const statusFilter = useLibraryStore((s) => s.statusFilter)
  const topicFilter = useLibraryStore((s) => s.topicFilter)
  const searchQuery = useLibraryStore((s) => s.searchQuery)
  const sortBy = useLibraryStore((s) => s.sortBy)
  const stepBack = useLibraryStore((s) => s.stepBack)

  // Combine all books for filtering
  const allBooks = useMemo(() => {
    const books: BookWithPosition[] = []
    for (const c of constellations) {
      books.push(...c.books)
    }
    books.push(...drifters)
    return books
  }, [constellations, drifters])

  // Filter books when filters are active
  const filteredBooks = useMemo(() => {
    if (!isFiltered) return null

    const filtered = filterBooks(allBooks, {
      statusFilter,
      topicFilter,
      searchQuery,
    })

    return calculateFilteredPositions(filtered, sortBy)
  }, [allBooks, isFiltered, statusFilter, topicFilter, searchQuery, sortBy])

  // Handle backdrop click (step back)
  const handleBackdropClick = useCallback(() => {
    stepBack()
  }, [stepBack])

  // Calculate opacity for non-active constellations
  const getConstellationOpacity = useCallback(
    (topic: string) => {
      if (isFiltered) return 0 // Hidden when filtered
      if (viewLevel === 'universe') return 1
      if (viewLevel === 'constellation') {
        return activeConstellation === topic ? 1 : 0.2
      }
      if (viewLevel === 'book') {
        return activeConstellation === topic ? 0.5 : 0.1
      }
      return 1
    },
    [viewLevel, activeConstellation, isFiltered]
  )

  // Drifter opacity
  const drifterOpacity = useMemo(() => {
    if (isFiltered) return 0
    if (viewLevel === 'book') return 0.2
    if (viewLevel === 'constellation') return 0.4
    return 0.85
  }, [viewLevel, isFiltered])

  return (
    <group>
      {/* Star field background */}
      <StarField reducedMotion={reducedMotion} />

      {/* Invisible backdrop for click-to-go-back */}
      <mesh
        position={[0, 0, -500]}
        onClick={handleBackdropClick}
      >
        <planeGeometry args={[2000, 2000]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Constellations (hidden when filtered) */}
      {constellations.map((constellation) => (
        <Constellation
          key={constellation.topic}
          constellation={constellation}
          reducedMotion={reducedMotion}
          isActive={activeConstellation === constellation.topic}
          opacity={getConstellationOpacity(constellation.topic)}
        />
      ))}

      {/* Drifters (hidden when filtered) */}
      {drifterOpacity > 0 &&
        drifters.map((book) => (
          <group key={book.id} visible={drifterOpacity > 0}>
            <Drifter book={book} reducedMotion={reducedMotion} />
          </group>
        ))}

      {/* Stats constellation */}
      <StatsConstellation
        books={allBooks}
        position={[60, 30, -30]}
        reducedMotion={reducedMotion}
      />

      {/* Filtered results cluster */}
      {isFiltered && filteredBooks && (
        <FilteredCluster books={filteredBooks} reducedMotion={reducedMotion} />
      )}
    </group>
  )
}
