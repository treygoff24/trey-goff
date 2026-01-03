'use client'

/**
 * Constellation - A nebula containing books for a single topic.
 * Includes nebula cloud effect, topic label, and positioned books.
 */

import { useCallback } from 'react'
import { Html } from '@react-three/drei'
import type { ConstellationData } from '@/lib/library/types'
import { useLibraryStore } from '@/lib/library/store'
import { FloatingBook } from './FloatingBook'
import { NebulaCloud } from './NebulaCloud'

// =============================================================================
// Types
// =============================================================================

interface ConstellationProps {
  constellation: ConstellationData
  reducedMotion: boolean
  isActive: boolean
  opacity?: number
}

// =============================================================================
// Component
// =============================================================================

export function Constellation({
  constellation,
  reducedMotion,
  isActive,
  opacity = 1,
}: ConstellationProps) {
  const { topic, label, color, position, books } = constellation

  // Store
  const zoomToConstellation = useLibraryStore((s) => s.zoomToConstellation)
  const viewLevel = useLibraryStore((s) => s.viewLevel)

  // Handle label click
  const handleLabelClick = useCallback(() => {
    if (viewLevel !== 'constellation' || !isActive) {
      zoomToConstellation(topic, position)
    }
  }, [topic, position, viewLevel, isActive, zoomToConstellation])

  // Nebula radius based on book count
  const nebulaRadius = Math.max(15, Math.min(30, 10 + books.length * 0.5))

  // Label style - different based on active state
  const labelOpacity = isActive ? 1 : 0.8
  const labelScale = isActive ? 1.2 : 1

  return (
    <group position={position}>
      {/* Nebula cloud */}
      <NebulaCloud
        color={color}
        position={[0, 0, 0]}
        radius={nebulaRadius}
        particleCount={isActive ? 200 : 100}
        reducedMotion={reducedMotion}
        opacity={opacity}
      />

      {/* Topic label using Html for CSS styling */}
      <Html
        position={[0, nebulaRadius * 0.6, 0]}
        center
        occlude={false}
        style={{
          transform: `scale(${labelScale})`,
          transition: 'transform 0.3s ease-out',
          pointerEvents: viewLevel === 'universe' ? 'auto' : 'none',
        }}
      >
        <button
          onClick={handleLabelClick}
          className="group relative select-none"
          style={{
            opacity: labelOpacity * opacity,
          }}
        >
          {/* Glow effect */}
          <span
            className="absolute inset-0 blur-lg"
            style={{
              backgroundColor: color,
              opacity: 0.4,
            }}
          />

          {/* Label text */}
          <span
            className="relative block px-4 py-2 font-satoshi text-lg font-medium tracking-wide transition-all duration-200 group-hover:scale-110"
            style={{
              color: '#ffffff',
              textShadow: `0 0 20px ${color}, 0 0 40px ${color}`,
            }}
          >
            {label}
          </span>

          {/* Book count */}
          <span
            className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs font-medium"
            style={{
              color: color,
              opacity: 0.7,
            }}
          >
            {books.length} {books.length === 1 ? 'book' : 'books'}
          </span>
        </button>
      </Html>

      {/* Books */}
      {books.map((book) => (
        <FloatingBook
          key={book.id}
          book={book}
          reducedMotion={reducedMotion}
          opacity={opacity}
        />
      ))}
    </group>
  )
}
