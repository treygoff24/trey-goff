'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function NotFound() {
  const [glitchText, setGlitchText] = useState('404')
  const [scanLine, setScanLine] = useState(0)

  // Glitch effect for the 404 text
  useEffect(() => {
    const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`'
    const originalText = '404'

    const interval = setInterval(() => {
      if (Math.random() > 0.92) {
        const glitched = originalText
          .split('')
          .map((char) =>
            Math.random() > 0.7
              ? glitchChars[Math.floor(Math.random() * glitchChars.length)]
              : char
          )
          .join('')
        setGlitchText(glitched)

        setTimeout(() => setGlitchText(originalText), 100)
      }
    }, 150)

    return () => clearInterval(interval)
  }, [])

  // Scan line animation
  useEffect(() => {
    const interval = setInterval(() => {
      setScanLine((prev) => (prev + 1) % 100)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4">
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 184, 107, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 184, 107, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Scan line */}
      <div
        className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-warm/50 to-transparent"
        style={{
          top: `${scanLine}%`,
          boxShadow: '0 0 20px 2px rgba(255, 184, 107, 0.3)',
        }}
      />

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(7, 10, 15, 0.8) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Status indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-error" />
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-error">
            Signal Lost
          </span>
        </div>

        {/* 404 with glitch */}
        <h1
          className="relative mb-4 font-mono text-[8rem] font-bold leading-none tracking-tighter text-text-1 sm:text-[12rem]"
          style={{
            textShadow: `
              2px 0 rgba(255, 184, 107, 0.4),
              -2px 0 rgba(124, 92, 255, 0.4)
            `,
          }}
        >
          <span className="relative">
            {glitchText}
            {/* Glitch layers */}
            <span
              className="absolute inset-0 text-warm/30"
              style={{ clipPath: 'inset(20% 0 30% 0)', transform: 'translateX(-3px)' }}
              aria-hidden="true"
            >
              {glitchText}
            </span>
            <span
              className="absolute inset-0 text-accent/30"
              style={{ clipPath: 'inset(50% 0 10% 0)', transform: 'translateX(3px)' }}
              aria-hidden="true"
            >
              {glitchText}
            </span>
          </span>
        </h1>

        {/* Coordinates */}
        <div className="mb-6 font-mono text-xs text-text-3">
          <span className="text-warm">COORD:</span>{' '}
          <span className="text-text-2">NULL</span>
          <span className="mx-3 text-border-2">|</span>
          <span className="text-warm">SECTOR:</span>{' '}
          <span className="text-text-2">UNKNOWN</span>
          <span className="mx-3 text-border-2">|</span>
          <span className="text-warm">STATUS:</span>{' '}
          <span className="text-error">OFFLINE</span>
        </div>

        {/* Message */}
        <p className="mb-2 text-xl text-text-2">
          The requested coordinates could not be found.
        </p>
        <p className="mb-8 text-text-3">
          The page may have moved, or the signal was lost in transmission.
        </p>

        {/* Actions */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="group relative overflow-hidden rounded-lg bg-warm px-8 py-3 font-medium text-bg-0 transition-all hover:shadow-lg hover:shadow-warm/20"
          >
            <span className="relative z-10">Return to Base</span>
            <div className="absolute inset-0 -translate-x-full bg-white/20 transition-transform group-hover:translate-x-full" />
          </Link>

          <button
            onClick={() => {
              const event = new KeyboardEvent('keydown', {
                key: 'k',
                metaKey: true,
                bubbles: true,
              })
              document.dispatchEvent(event)
            }}
            className="flex items-center gap-2 rounded-lg border border-border-1 bg-surface-1 px-6 py-3 text-text-2 transition-all hover:border-border-2 hover:bg-surface-2 hover:text-text-1"
          >
            <span>Search</span>
            <kbd className="rounded bg-bg-0 px-2 py-0.5 font-mono text-xs text-text-3">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Decorative elements */}
        <div className="mt-16 flex justify-center gap-8 text-text-3/30">
          <div className="h-px w-24 self-center bg-gradient-to-r from-transparent to-border-1" />
          <span className="font-mono text-[10px] uppercase tracking-[0.5em]">
            End Transmission
          </span>
          <div className="h-px w-24 self-center bg-gradient-to-l from-transparent to-border-1" />
        </div>
      </div>
    </div>
  )
}
