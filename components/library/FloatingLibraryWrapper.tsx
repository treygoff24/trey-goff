'use client'

/**
 * Client-side wrapper for FloatingLibrary with dynamic import.
 * This is needed because `ssr: false` requires a Client Component.
 */

import dynamic from 'next/dynamic'
import type { Book } from '@/lib/books/types'
import { LibraryClient } from './LibraryClient'

// Dynamic import FloatingLibrary to avoid SSR issues with Three.js
const FloatingLibrary = dynamic(
  () =>
    import('@/components/library/floating/FloatingLibrary').then(
      (mod) => mod.FloatingLibrary
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-bg-0">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-surface-2 border-t-warm" />
          <p className="text-sm text-text-2">Loading library...</p>
        </div>
      </div>
    ),
  }
)

interface FloatingLibraryWrapperProps {
  books: Book[]
}

/**
 * Classic library fallback - used when WebGL not supported or user preference
 */
function ClassicLibraryFallback() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <header className="mb-12">
        <h1 className="mb-4 font-satoshi text-4xl font-medium text-text-1">
          Library
        </h1>
        <p className="max-w-2xl text-lg text-text-2">
          Books that have shaped my thinking on governance, economics, and
          building better systems.
        </p>
      </header>

      <LibraryClient />
    </div>
  )
}

export function FloatingLibraryWrapper({ books }: FloatingLibraryWrapperProps) {
  return (
    <FloatingLibrary books={books} fallback={<ClassicLibraryFallback />} />
  )
}
