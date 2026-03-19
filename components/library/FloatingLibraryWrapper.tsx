'use client'

/**
 * Client-side wrapper for FloatingLibrary with dynamic import.
 * This is needed because `ssr: false` requires a Client Component.
 */

import dynamic from 'next/dynamic'
import type { Book } from '@/lib/books/types'
import { useId } from 'react'
import { LibraryClient } from './LibraryClient'

// Dynamic import FloatingLibrary to avoid SSR issues with Three.js
const FloatingLibrary = dynamic(
  () => import('@/components/library/floating/FloatingLibrary').then((mod) => mod.FloatingLibrary),
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
  },
)

interface FloatingLibraryWrapperProps {
  books: Book[]
  title: string
  description: string
}

/**
 * Classic library fallback - used when WebGL not supported or user preference
 */
function ClassicLibraryFallback({
  books,
  title,
  description,
}: {
  books: Book[]
  title: string
  description: string
}) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <header className="mb-12">
          <h2 className="mb-4 font-satoshi text-4xl font-medium text-text-1">{title}</h2>
          <p className="max-w-2xl text-lg text-text-2">{description}</p>
        </header>

        <LibraryClient books={books} />
      </div>
    </div>
  )
}

export function FloatingLibraryWrapper({ books, title, description }: FloatingLibraryWrapperProps) {
  const titleId = useId()
  const descriptionId = useId()

  return (
    <section
      className="fixed inset-0 z-10 h-screen w-screen bg-bg-0"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <header className="sr-only">
        <h1 id={titleId}>{title}</h1>
        <p id={descriptionId}>{description}</p>
      </header>

      <FloatingLibrary
        books={books}
        fallback={<ClassicLibraryFallback books={books} title={title} description={description} />}
      />
    </section>
  )
}
