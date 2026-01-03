'use client'

/**
 * StatsConstellation - Special nebula showing reading statistics as floating artifacts.
 * Positioned among topic nebulae, shows stats when zoomed in.
 */

import { useMemo, useRef, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Book } from '@/lib/books/types'
import { calculateReadingStats, getBooksReadByYear, getRatingDistribution } from '@/lib/books'
import { useLibraryStore } from '@/lib/library/store'
import type { Position3D } from '@/lib/library/types'

// =============================================================================
// Types
// =============================================================================

interface StatsConstellationProps {
  books: Book[]
  position: Position3D
  reducedMotion: boolean
}

// =============================================================================
// Constants
// =============================================================================

const STATS_LABEL = 'Stats'
const STATS_COLOR = '#7C5CFF' // accent color

// =============================================================================
// Stat Card Component (HTML overlay inside 3D space)
// =============================================================================

interface StatCardProps {
  label: string
  value: string | number
  subtext?: string
  position: Position3D
  delay?: number
}

function StatCard({ label, value, subtext, position, delay = 0 }: StatCardProps) {
  return (
    <group position={position}>
      <Html
        center
        distanceFactor={20}
        style={{
          animationDelay: `${delay}ms`,
          animation: 'fadeIn 0.5s ease-out forwards',
          opacity: 0,
        }}
      >
        <div className="rounded-lg bg-surface-1/95 px-4 py-3 text-center backdrop-blur-sm">
          <div className="text-xs font-medium uppercase tracking-wider text-text-3">
            {label}
          </div>
          <div className="font-newsreader text-3xl font-medium text-text-1">
            {value}
          </div>
          {subtext && <div className="text-xs text-text-2">{subtext}</div>}
        </div>
      </Html>
    </group>
  )
}

// =============================================================================
// Stats Glow Effect
// =============================================================================

function StatsGlow({ color }: { color: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)

  useFrame(({ clock }) => {
    if (materialRef.current) {
      // Gentle pulse
      const t = clock.getElapsedTime()
      materialRef.current.opacity = 0.15 + Math.sin(t * 0.5) * 0.05
    }
  })

  return (
    <mesh ref={meshRef} scale={[15, 15, 1]}>
      <circleGeometry args={[1, 32]} />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={0.15}
        depthWrite={false}
      />
    </mesh>
  )
}

// =============================================================================
// Year Timeline (simple bar chart in 3D)
// =============================================================================

interface YearTimelineProps {
  data: { year: number; count: number }[]
  position: Position3D
}

function YearTimeline({ data, position }: YearTimelineProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  // Only show last 5 years
  const recentData = data.slice(-5)

  return (
    <group position={position}>
      {recentData.map((item, index) => {
        const height = (item.count / maxCount) * 4
        const x = (index - 2) * 2.5

        return (
          <group key={item.year} position={[x, 0, 0]}>
            {/* Bar */}
            <mesh position={[0, height / 2, 0]}>
              <boxGeometry args={[1.5, height, 0.3]} />
              <meshStandardMaterial
                color={STATS_COLOR}
                emissive={STATS_COLOR}
                emissiveIntensity={0.2}
              />
            </mesh>
            {/* Year label */}
            <Html position={[0, -1, 0]} center distanceFactor={20}>
              <span className="text-xs text-text-3">{item.year}</span>
            </Html>
            {/* Count label */}
            <Html position={[0, height + 0.5, 0]} center distanceFactor={20}>
              <span className="text-xs font-medium text-text-1">{item.count}</span>
            </Html>
          </group>
        )
      })}
    </group>
  )
}

// =============================================================================
// Rating Stars Display
// =============================================================================

interface RatingDisplayProps {
  distribution: { rating: number; count: number }[]
  position: Position3D
}

function RatingDisplay({ distribution, position }: RatingDisplayProps) {
  return (
    <group position={position}>
      <Html center distanceFactor={20}>
        <div className="rounded-lg bg-surface-1/95 px-3 py-2 backdrop-blur-sm">
          <div className="mb-1 text-center text-xs font-medium uppercase tracking-wider text-text-3">
            Ratings
          </div>
          <div className="space-y-0.5">
            {distribution.map((item) => (
              <div key={item.rating} className="flex items-center gap-2 text-xs">
                <span className="w-4 text-right text-warm">{'★'.repeat(item.rating)}</span>
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-warm"
                    style={{
                      width: `${Math.min(100, (item.count / Math.max(...distribution.map((d) => d.count), 1)) * 100)}%`,
                    }}
                  />
                </div>
                <span className="w-4 text-text-2">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </Html>
    </group>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function StatsConstellation({
  books,
  position,
  reducedMotion,
}: StatsConstellationProps) {
  const viewLevel = useLibraryStore((s) => s.viewLevel)
  const activeConstellation = useLibraryStore((s) => s.activeConstellation)
  const isFiltered = useLibraryStore((s) => s.isFiltered)
  const zoomToConstellation = useLibraryStore((s) => s.zoomToConstellation)

  const isActive = activeConstellation === STATS_LABEL.toLowerCase()
  const isVisible = viewLevel === 'universe' || isActive

  // Calculate stats
  const stats = useMemo(() => calculateReadingStats(books), [books])
  const yearData = useMemo(() => getBooksReadByYear(books), [books])
  const ratingDistribution = useMemo(() => getRatingDistribution(books), [books])

  // Handle label click
  const handleClick = useCallback(() => {
    zoomToConstellation(STATS_LABEL.toLowerCase(), position)
  }, [zoomToConstellation, position])

  if (!isVisible || isFiltered) {
    return null
  }

  return (
    <group position={position}>
      {/* Glow effect */}
      <StatsGlow color={STATS_COLOR} />

      {/* Label (visible from universe view) */}
      {viewLevel === 'universe' && (
        <Html center distanceFactor={40} zIndexRange={[100, 0]}>
          <button
            onClick={handleClick}
            className="rounded-full bg-surface-1/80 px-4 py-2 text-sm font-medium text-text-1 backdrop-blur-sm transition-all hover:bg-surface-2/80 hover:scale-105"
            style={{ color: STATS_COLOR }}
          >
            {STATS_LABEL}
          </button>
        </Html>
      )}

      {/* Stats cards (visible when zoomed in) */}
      {isActive && (
        <>
          {/* Total books */}
          <StatCard
            label="Total Books"
            value={stats.total}
            position={[-8, 5, 0]}
            delay={0}
          />

          {/* Books read */}
          <StatCard
            label="Books Read"
            value={stats.read}
            subtext={`${Math.round((stats.read / stats.total) * 100)}% of library`}
            position={[0, 8, 0]}
            delay={100}
          />

          {/* Average rating */}
          <StatCard
            label="Average Rating"
            value={stats.averageRating.toFixed(1)}
            subtext={`${stats.fiveStarBooks} five-star books`}
            position={[8, 5, 0]}
            delay={200}
          />

          {/* Currently reading */}
          <StatCard
            label="Reading Now"
            value={stats.reading}
            position={[-6, -2, 0]}
            delay={300}
          />

          {/* Want to read */}
          <StatCard
            label="Want to Read"
            value={stats.want}
            position={[6, -2, 0]}
            delay={400}
          />

          {/* Year timeline */}
          {yearData.length > 0 && (
            <YearTimeline data={yearData} position={[0, -8, 0]} />
          )}

          {/* Rating distribution */}
          <RatingDisplay
            distribution={ratingDistribution}
            position={[12, 0, 0]}
          />
        </>
      )}
    </group>
  )
}
