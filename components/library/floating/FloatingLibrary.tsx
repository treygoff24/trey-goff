'use client'

/**
 * FloatingLibrary - Main R3F Canvas wrapper for the 3D library experience.
 * Handles WebGL detection, reduced motion, error boundaries, and fallback.
 */

import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useState, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Book } from '@/lib/books/types'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  useLibraryStore,
  selectPostprocessingEnabled,
  selectIsFiltered,
} from '@/lib/library/store'
import { groupBooksIntoConstellations } from '@/lib/library/constellation'
import { CameraController } from './CameraController'
import { Universe } from './Universe'
import { BookDetailPanel } from './BookDetailPanel'
import { LibraryBreadcrumb } from './LibraryBreadcrumb'
import { LibraryHUD } from './LibraryHUD'
import { AccessibleBookList } from './AccessibleBookList'
import { PostProcessingEffects } from './PostProcessingEffects'
import { AnimationDriver } from './AnimationDriver'

// =============================================================================
// Types
// =============================================================================

interface FloatingLibraryProps {
  books: Book[]
  fallback?: React.ReactNode
}

// =============================================================================
// WebGL Detection
// =============================================================================

function isWebGLSupported(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    return gl !== null
  } catch {
    return false
  }
}

// =============================================================================
// Loading Fallback
// =============================================================================

function LoadingState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-bg-0">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-surface-2 border-t-warm" />
        <p className="text-text-2 text-sm">Loading library...</p>
      </div>
    </div>
  )
}

// =============================================================================
// Error Boundary
// =============================================================================

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class LibraryErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[FloatingLibrary] Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-text-1 mb-2">Unable to load 3D library</p>
              <p className="text-text-3 text-sm">
                {this.state.error?.message ?? 'An error occurred'}
              </p>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}

// Need to import React for class component
import React from 'react'

// =============================================================================
// Main Component
// =============================================================================

export function FloatingLibrary({ books, fallback }: FloatingLibraryProps) {
  const [webGLSupported, setWebGLSupported] = useState<boolean | null>(null)
  const [isReady, setIsReady] = useState(false)
  const reducedMotion = useReducedMotion()
  const glRef = useRef<THREE.WebGLRenderer | null>(null)

  // Store subscriptions
  const showClassicFallback = useLibraryStore((s) => s.showClassicFallback)
  const viewLevel = useLibraryStore((s) => s.viewLevel)
  const stepBack = useLibraryStore((s) => s.stepBack)
  const postprocessingEnabled = useLibraryStore(selectPostprocessingEnabled)
  const isFiltered = useLibraryStore(selectIsFiltered)

  // Check WebGL support
  useEffect(() => {
    setWebGLSupported(isWebGLSupported())
  }, [])

  // Global Escape key handler for all view levels
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewLevel !== 'universe') {
        stepBack()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewLevel, stepBack])

  // Toggle renderer tone mapping based on postprocessing state
  // When postprocessing is enabled, we disable renderer tone mapping (handled by EffectComposer)
  // When postprocessing is disabled, we re-enable renderer tone mapping as fallback
  useEffect(() => {
    if (!glRef.current) return

    if (postprocessingEnabled) {
      // Postprocessing handles tone mapping via ToneMapping effect
      glRef.current.toneMapping = THREE.NoToneMapping
    } else {
      // Fallback: Use renderer's built-in ACES Filmic tone mapping
      glRef.current.toneMapping = THREE.ACESFilmicToneMapping
      glRef.current.toneMappingExposure = 1.0
    }
  }, [postprocessingEnabled])

  // Pre-compute constellation data (memoized to avoid recomputation)
  // Note: Orphan books are now included in a "Random" constellation
  const constellations = useMemo(
    () => groupBooksIntoConstellations(books),
    [books]
  )

  // Handle canvas ready
  const handleReady = useCallback(() => {
    setIsReady(true)
  }, [])

  // Show loading while checking WebGL
  if (webGLSupported === null) {
    return <LoadingState />
  }

  // Show fallback if WebGL not supported or user requested classic view
  if (!webGLSupported || showClassicFallback) {
    return fallback ?? null
  }

  return (
    <LibraryErrorBoundary fallback={fallback}>
      <div className="relative h-full w-full">
        {/* Loading overlay */}
        {!isReady && <LoadingState />}

        {/* 3D Canvas */}
        <Canvas
          dpr={[1, 2]} // Cap DPR to reduce GPU load on high-DPI displays
          frameloop="demand" // Only render when invalidated - massive GPU savings
          camera={{
            fov: 60,
            near: 0.1,
            far: 3000,
            position: [0, 20, 200],
          }}
          style={{
            background: '#070A0F',
            position: 'absolute',
            inset: 0,
          }}
          onCreated={({ gl }) => {
            // Configure renderer
            gl.setClearColor(0x070a0f, 1)
            // Start with NoToneMapping - postprocessing handles tone mapping
            // If postprocessing is disabled, useEffect will switch to ACESFilmicToneMapping
            gl.toneMapping = THREE.NoToneMapping
            gl.toneMappingExposure = 1.0
            gl.outputColorSpace = THREE.SRGBColorSpace
            glRef.current = gl
            handleReady()
          }}
          aria-hidden="true"
        >
          <Suspense fallback={null}>
            {/* Animation invalidation driver - must be first to catch all animations */}
            <AnimationDriver />

            {/* Camera system */}
            <CameraController reducedMotion={reducedMotion} />

            {/* Scene content */}
            <Universe
              constellations={constellations}
              reducedMotion={reducedMotion}
            />

            {/* Lighting setup for books */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[50, 80, 50]} intensity={0.6} />
            <directionalLight position={[-30, -20, -40]} intensity={0.3} color="#6366f1" />

            {/* Postprocessing effects (v2) */}
            <PostProcessingEffects
              viewLevel={viewLevel}
              enabled={postprocessingEnabled}
              disableDOF={isFiltered}
            />
          </Suspense>
        </Canvas>

        {/* Navigation breadcrumb */}
        {isReady && <LibraryBreadcrumb />}

        {/* Filter controls */}
        {isReady && <LibraryHUD books={books} />}

        {/* Book detail panel */}
        <BookDetailPanel />

        {/* Accessible book list for screen readers */}
        <AccessibleBookList books={books} />
      </div>
    </LibraryErrorBoundary>
  )
}
