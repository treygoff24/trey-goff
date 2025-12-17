'use client'

import { useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { useCommandPalette } from '@/components/command/CommandProvider'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const modes = [
  {
    href: '/writing',
    label: 'Writing',
    description: 'Essays and notes',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    )
  },
  {
    href: '/library',
    label: 'Library',
    description: 'Books and reading',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>
    )
  },
  {
    href: '/graph',
    label: 'Graph',
    description: 'Connected ideas',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    )
  },
  {
    href: '/projects',
    label: 'Projects',
    description: "Things I've built",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    )
  },
]

export default function HomePage() {
  const { setOpen } = useCommandPalette()
  const reducedMotion = useReducedMotion()
  const tilesRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !tilesRef.current) return

    const rect = tilesRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setMousePos({ x, y })
  }, [reducedMotion])

  const handleMouseLeave = useCallback(() => {
    // Smoothly return to center
    setMousePos({ x: 0.5, y: 0.5 })
  }, [])

  // Calculate parallax offset for each tile based on its grid position
  const getParallaxStyle = (index: number) => {
    if (reducedMotion) return {}

    // Grid positions: 0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right (on mobile 2-col)
    // On desktop 4-col: 0, 1, 2, 3 are all in one row
    const col = index % 4
    const centerX = mousePos.x - 0.5
    const centerY = mousePos.y - 0.5

    // Each tile moves slightly based on distance from mouse
    // Tiles further from mouse move more (parallax depth effect)
    const tileCenter = (col + 0.5) / 4 // 0.125, 0.375, 0.625, 0.875
    const distanceFromMouse = tileCenter - mousePos.x

    // Subtle movement: max 4px
    const offsetX = distanceFromMouse * centerX * 8
    const offsetY = centerY * 4

    return {
      transform: `translate(${offsetX}px, ${offsetY}px)`,
      transition: 'transform 0.3s ease-out',
    }
  }

  return (
    <>
      {/* Ambient background - positioned outside overflow-hidden container */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-bg-0 via-bg-1 to-bg-1" />

        {/* Warm backlight - large glow from top */}
        <div
          className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[1200px] h-[800px] blur-3xl"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255, 184, 107, 0.25) 0%, rgba(255, 140, 50, 0.08) 50%, transparent 70%)',
          }}
        />

        {/* Accent glow - purple from left */}
        <div
          className="absolute top-[20%] -left-[100px] w-[600px] h-[600px] blur-3xl"
          style={{
            background: 'radial-gradient(circle at center, rgba(124, 92, 255, 0.2) 0%, transparent 60%)',
          }}
        />

        {/* Secondary warm glow - bottom right corner */}
        <div
          className="absolute bottom-0 right-0 w-[800px] h-[600px] blur-3xl"
          style={{
            background: 'radial-gradient(ellipse at bottom right, rgba(255, 184, 107, 0.18) 0%, transparent 60%)',
          }}
        />

        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative min-h-[calc(100vh-4rem)]">

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 py-24 sm:py-32">
        {/* Identity section with entrance animation */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="font-satoshi text-5xl sm:text-6xl font-medium text-text-1 mb-6 tracking-tight">
            Trey Goff
          </h1>
          <p className="text-xl sm:text-2xl text-text-2 max-w-xl mx-auto leading-relaxed font-light">
            Building better governance through acceleration zones and institutional innovation.
          </p>
        </div>

        {/* Command bar with glow effect */}
        <div className="animate-fade-in-up animation-delay-100">
          <button
            onClick={() => setOpen(true)}
            className="group mx-auto mb-20 flex w-full max-w-lg items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-left text-text-3 backdrop-blur-sm transition-all duration-300 hover:border-warm/30 hover:bg-white/[0.05] hover:shadow-[0_0_30px_-5px_rgba(255,184,107,0.15)]"
            aria-label="Open search"
          >
            <svg
              className="h-5 w-5 text-text-3 transition-colors group-hover:text-warm"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="text-base">Search everything...</span>
            <kbd className="ml-auto hidden rounded-md bg-white/5 border border-white/10 px-2.5 py-1 font-mono text-xs text-text-3 sm:inline-block">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Mode tiles with parallax and glow */}
        <div
          ref={tilesRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="grid grid-cols-2 gap-4 md:grid-cols-4 animate-fade-in-up animation-delay-200"
        >
          {modes.map((mode, index) => (
            <Link
              key={mode.href}
              href={mode.href}
              className="group relative rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 text-left transition-all duration-300 hover:border-warm/20 hover:bg-white/[0.04] hover:shadow-[0_0_40px_-10px_rgba(255,184,107,0.2)] hover:-translate-y-0.5"
              style={{
                animationDelay: `${(index + 3) * 75}ms`,
                ...getParallaxStyle(index)
              }}
            >
              {/* Subtle inner glow on hover */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-warm/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative">
                <div className="mb-3 text-text-3 transition-colors duration-300 group-hover:text-warm">
                  {mode.icon}
                </div>
                <h2 className="font-satoshi text-lg font-medium text-text-1 transition-colors duration-300 group-hover:text-warm">
                  {mode.label}
                </h2>
                <p className="mt-1 text-sm text-text-3">{mode.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      </div>
    </>
  )
}
