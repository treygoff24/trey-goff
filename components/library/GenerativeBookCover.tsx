'use client'

import { useMemo } from 'react'

interface GenerativeBookCoverProps {
  title: string
  author: string
  width: number
  height: number
}

// Simple hash function for consistent pseudo-random generation
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

// Seeded random number generator
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000
  return x - Math.floor(x)
}

// Color palette derived from the site's design tokens
const palette = {
  warm: '#FFB86B',
  warmDark: '#CC934A',
  accent: '#7C5CFF',
  accentDark: '#5A3ED9',
  surface: 'rgba(255, 255, 255, 0.06)',
  bg: '#0B1020',
  bgDark: '#070A0F',
}

export function GenerativeBookCover({
  title,
  author,
  width,
  height,
}: GenerativeBookCoverProps) {
  const design = useMemo(() => {
    const seed = hashString(title + author)
    const rand = (offset = 0) => seededRandom(seed + offset)

    // Choose a design variant (0-4)
    const variant = Math.floor(rand(0) * 5)

    // Generate colors based on the hash
    const useWarm = rand(1) > 0.5
    const primary = useWarm ? palette.warm : palette.accent
    const primaryDark = useWarm ? palette.warmDark : palette.accentDark

    // Generate geometric properties
    const rotation = rand(2) * 360
    const scale = 0.5 + rand(3) * 0.5
    const offsetX = (rand(4) - 0.5) * 20
    const offsetY = (rand(5) - 0.5) * 20

    return {
      variant,
      primary,
      primaryDark,
      rotation,
      scale,
      offsetX,
      offsetY,
      seed,
    }
  }, [title, author])

  // Generate SVG pattern based on variant
  const renderPattern = () => {
    switch (design.variant) {
      case 0: // Concentric circles
        return (
          <>
            <defs>
              <radialGradient id={`grad-${design.seed}`} cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor={design.primary} stopOpacity="0.3" />
                <stop offset="100%" stopColor={design.primaryDark} stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle
              cx={width / 2 + design.offsetX}
              cy={height / 2 + design.offsetY}
              r={Math.min(width, height) * 0.4 * design.scale}
              fill="none"
              stroke={design.primary}
              strokeWidth="1"
              opacity="0.4"
            />
            <circle
              cx={width / 2 + design.offsetX}
              cy={height / 2 + design.offsetY}
              r={Math.min(width, height) * 0.25 * design.scale}
              fill={`url(#grad-${design.seed})`}
            />
            <circle
              cx={width / 2 + design.offsetX}
              cy={height / 2 + design.offsetY}
              r={Math.min(width, height) * 0.1 * design.scale}
              fill={design.primary}
              opacity="0.6"
            />
          </>
        )

      case 1: // Diagonal lines
        return (
          <>
            <defs>
              <pattern
                id={`lines-${design.seed}`}
                width="12"
                height="12"
                patternUnits="userSpaceOnUse"
                patternTransform={`rotate(${design.rotation})`}
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="12"
                  stroke={design.primary}
                  strokeWidth="1"
                  opacity="0.2"
                />
              </pattern>
              <linearGradient id={`fade-${design.seed}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={design.primary} stopOpacity="0.15" />
                <stop offset="100%" stopColor={design.primaryDark} stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <rect width={width} height={height} fill={`url(#lines-${design.seed})`} />
            <rect width={width} height={height} fill={`url(#fade-${design.seed})`} />
          </>
        )

      case 2: // Abstract shapes
        return (
          <>
            <polygon
              points={`${width * 0.2},${height * 0.8} ${width * 0.5},${height * 0.2} ${width * 0.8},${height * 0.7}`}
              fill={design.primary}
              opacity="0.15"
              transform={`rotate(${design.rotation}, ${width / 2}, ${height / 2})`}
            />
            <circle
              cx={width * 0.7}
              cy={height * 0.3}
              r={width * 0.15 * design.scale}
              fill={design.primaryDark}
              opacity="0.2"
            />
            <line
              x1={width * 0.1}
              y1={height * 0.9}
              x2={width * 0.9}
              y2={height * 0.1}
              stroke={design.primary}
              strokeWidth="1"
              opacity="0.3"
            />
          </>
        )

      case 3: // Grid pattern
        return (
          <>
            <defs>
              <pattern
                id={`grid-${design.seed}`}
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <rect width="20" height="20" fill="none" stroke={design.primary} strokeWidth="0.5" opacity="0.15" />
              </pattern>
            </defs>
            <rect width={width} height={height} fill={`url(#grid-${design.seed})`} />
            <rect
              x={width * 0.15}
              y={height * 0.6}
              width={width * 0.7}
              height={height * 0.25}
              fill={design.primary}
              opacity="0.1"
            />
          </>
        )

      case 4: // Minimal corner accent
      default:
        return (
          <>
            <rect
              x={width * 0.7}
              y="0"
              width={width * 0.3}
              height={height * 0.4}
              fill={design.primary}
              opacity="0.12"
            />
            <line
              x1="0"
              y1={height * 0.85}
              x2={width}
              y2={height * 0.85}
              stroke={design.primary}
              strokeWidth="2"
              opacity="0.25"
            />
            <circle
              cx={width * 0.15}
              cy={height * 0.15}
              r="4"
              fill={design.primary}
              opacity="0.5"
            />
          </>
        )
    }
  }

  return (
    <div
      className="relative overflow-hidden bg-gradient-to-br from-bg-1 to-bg-0"
      style={{ width, height }}
    >
      {/* SVG Pattern */}
      <svg
        width={width}
        height={height}
        className="absolute inset-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        {renderPattern()}
      </svg>

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-3">
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-0/90 via-bg-0/40 to-transparent" />

        {/* Title */}
        <div className="relative z-10">
          <p
            className="line-clamp-3 font-satoshi text-xs font-medium leading-tight text-text-1"
            style={{ fontSize: Math.max(10, Math.min(12, width / 12)) }}
          >
            {title}
          </p>
          <p
            className="mt-1 truncate text-text-3"
            style={{ fontSize: Math.max(8, Math.min(10, width / 14)) }}
          >
            {author}
          </p>
        </div>
      </div>

      {/* Subtle border */}
      <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/10" />
    </div>
  )
}
