'use client'

/**
 * CameraController - Manages camera transitions and manual navigation controls.
 * Supports smooth animated transitions and user interaction (drag, zoom, touch).
 */

import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useLibraryStore, selectIsTransitioning } from '@/lib/library/store'

// =============================================================================
// Types
// =============================================================================

interface CameraControllerProps {
  reducedMotion: boolean
}

// =============================================================================
// Constants
// =============================================================================

/** Duration of camera transitions in seconds */
const TRANSITION_DURATION = 0.6

/** Lerp factor per frame (60fps baseline) */
const LERP_SPEED = 1 - Math.pow(0.001, 1 / (TRANSITION_DURATION * 60))

/** Distance threshold to consider transition complete */
const POSITION_THRESHOLD = 0.1

// =============================================================================
// Component
// =============================================================================

export function CameraController({ reducedMotion }: CameraControllerProps) {
  const { camera, invalidate } = useThree()
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null)

  // Reusable vectors for lerping (avoid allocations)
  const targetPositionRef = useRef(new THREE.Vector3())
  const targetLookAtRef = useRef(new THREE.Vector3())
  const currentLookAtRef = useRef(new THREE.Vector3())
  const startPositionRef = useRef(new THREE.Vector3())
  const totalDistanceRef = useRef(0)

  // Store subscriptions
  const cameraPosition = useLibraryStore((s) => s.cameraPosition)
  const cameraTarget = useLibraryStore((s) => s.cameraTarget)
  const isTransitioning = useLibraryStore(selectIsTransitioning)
  const viewLevel = useLibraryStore((s) => s.viewLevel)
  const setIsTransitioning = useLibraryStore((s) => s.setIsTransitioning)
  const setTransitionPhase = useLibraryStore((s) => s.setTransitionPhase)

  // Update target vectors when store changes and capture start position
  useEffect(() => {
    // Capture start position for transition phase calculation
    startPositionRef.current.copy(camera.position)
    targetPositionRef.current.set(...cameraPosition)
    targetLookAtRef.current.set(...cameraTarget)

    // Calculate total distance for phase tracking
    totalDistanceRef.current = startPositionRef.current.distanceTo(targetPositionRef.current)

    // Reset transition phase to 0 when new transition starts
    setTransitionPhase(0)
  }, [cameraPosition, cameraTarget, camera.position, setTransitionPhase])

  // Disable controls during transitions
  useEffect(() => {
    if (controlsRef.current) {
      // Disable controls during transitions or when viewing a book
      controlsRef.current.enabled = !isTransitioning && viewLevel !== 'book'
    }
  }, [isTransitioning, viewLevel])

  // Animate camera
  useFrame((_state, delta) => {
    if (!isTransitioning) return

    const targetPosition = targetPositionRef.current
    const targetLookAt = targetLookAtRef.current

    if (reducedMotion) {
      // Instant transition
      camera.position.copy(targetPosition)
      camera.lookAt(targetLookAt)
      setTransitionPhase(1) // Transition complete
      setIsTransitioning(false)

      // Update orbit controls target
      if (controlsRef.current) {
        controlsRef.current.target.copy(targetLookAt)
        controlsRef.current.update()
      }
      invalidate() // Final render
      return
    }

    // Smooth lerp transition
    const lerpFactor = Math.min(1, LERP_SPEED * delta * 60)

    camera.position.lerp(targetPosition, lerpFactor)

    // Lerp lookAt by interpolating the target
    currentLookAtRef.current.lerp(targetLookAt, lerpFactor)
    camera.lookAt(currentLookAtRef.current)

    // Update orbit controls target
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt, lerpFactor)
      controlsRef.current.update()
    }

    // Calculate and update transition phase (0-1)
    const currentDistance = camera.position.distanceTo(targetPosition)
    const totalDistance = totalDistanceRef.current
    const phase = totalDistance > 0
      ? Math.min(1, 1 - currentDistance / totalDistance)
      : 1
    setTransitionPhase(phase)

    // Check if transition is complete
    const positionDistance = currentDistance
    const lookAtDistance = currentLookAtRef.current.distanceTo(targetLookAt)

    if (positionDistance < POSITION_THRESHOLD && lookAtDistance < POSITION_THRESHOLD) {
      // Snap to final position
      camera.position.copy(targetPosition)
      camera.lookAt(targetLookAt)

      if (controlsRef.current) {
        controlsRef.current.target.copy(targetLookAt)
        controlsRef.current.update()
      }

      setTransitionPhase(1)
      setIsTransitioning(false)
    }

    // Keep rendering during transition
    invalidate()
  })

  // Initialize current lookAt from camera
  useEffect(() => {
    const direction = new THREE.Vector3()
    camera.getWorldDirection(direction)
    currentLookAtRef.current.copy(camera.position).add(direction.multiplyScalar(10))
  }, [camera])

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.05}
      // Pan limits
      enablePan={true}
      panSpeed={0.5}
      // Zoom limits
      enableZoom={true}
      zoomSpeed={0.8}
      minDistance={10}
      maxDistance={200}
      // Rotation limits
      enableRotate={true}
      rotateSpeed={0.5}
      maxPolarAngle={Math.PI * 0.85}
      minPolarAngle={Math.PI * 0.15}
      // Touch
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
    />
  )
}
