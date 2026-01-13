'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useState, useMemo, useRef } from 'react'
import * as THREE from 'three'
import React from 'react'
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

interface FloatingLibraryProps {
  books: Book[]
  fallback?: React.ReactNode
}

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

export function FloatingLibrary({ books, fallback }: FloatingLibraryProps) {
  const [webGLSupported, setWebGLSupported] = useState<boolean | null>(null)
  const [isReady, setIsReady] = useState(false)
  const reducedMotion = useReducedMotion()
  const glRef = useRef<THREE.WebGLRenderer | null>(null)

  const showClassicFallback = useLibraryStore((s) => s.showClassicFallback)
  const viewLevel = useLibraryStore((s) => s.viewLevel)
  const stepBack = useLibraryStore((s) => s.stepBack)
  const postprocessingEnabled = useLibraryStore(selectPostprocessingEnabled)
  const isFiltered = useLibraryStore(selectIsFiltered)

  useEffect(() => {
    setWebGLSupported(isWebGLSupported())
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewLevel !== 'universe') {
        stepBack()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewLevel, stepBack])

  useEffect(() => {
    if (!glRef.current) return

    glRef.current.toneMapping = postprocessingEnabled
      ? THREE.NoToneMapping
      : THREE.ACESFilmicToneMapping
    glRef.current.toneMappingExposure = 1.0
  }, [postprocessingEnabled])

  const constellations = useMemo(
    () => groupBooksIntoConstellations(books),
    [books]
  )

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
        {!isReady && <LoadingState />}

        <Canvas
          dpr={[1, 2]}
          frameloop="demand"
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
          onCreated={({ gl, invalidate }) => {
            gl.setClearColor(0x070a0f, 1)
            gl.toneMapping = THREE.NoToneMapping
            gl.toneMappingExposure = 1.0
            gl.outputColorSpace = THREE.SRGBColorSpace
            glRef.current = gl
            handleReady()
            setTimeout(() => invalidate(), 100)
          }}
          aria-hidden="true"
        >
          <Suspense fallback={null}>
            <AnimationDriver />
            <CameraController reducedMotion={reducedMotion} />
            <Universe
              constellations={constellations}
              reducedMotion={reducedMotion}
            />

            <ambientLight intensity={0.5} />
            <directionalLight position={[50, 80, 50]} intensity={0.6} />
            <directionalLight position={[-30, -20, -40]} intensity={0.3} color="#6366f1" />

            <PostProcessingEffects
              viewLevel={viewLevel}
              enabled={postprocessingEnabled}
              disableDOF={isFiltered}
            />
          </Suspense>
        </Canvas>

        {isReady && <LibraryBreadcrumb />}
        {isReady && <LibraryHUD books={books} />}

        <BookDetailPanel />
        <AccessibleBookList books={books} />
      </div>
    </LibraryErrorBoundary>
  )
}
