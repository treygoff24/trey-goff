'use client'

import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { simplex2D } from '@/lib/library/noise'
import { useLibraryStore } from '@/lib/library/store'
import type { ViewLevel, Position3D } from '@/lib/library/types'

interface NebulaDustProps {
  topicColor: string
  radius: number
  position: Position3D
  viewLevel: ViewLevel
  isActive: boolean
  opacity?: number
  reducedMotion: boolean
}

const PARTICLE_COUNTS = {
  universe: 0,
  constellationInactive: 0,
  constellationActive: 150,
  book: 100,
} as const

const MIN_SIZE = 0.3
const MAX_SIZE = 1.2
const DRIFT_SPEED = 0.15
const NOISE_SCALE = 0.1

let dustTextureCache: THREE.Texture | null = null

function getDustTexture(): THREE.Texture {
  if (dustTextureCache) return dustTextureCache

  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // Create radial gradient for soft blob
  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  )
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)')
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.2)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  dustTextureCache = new THREE.CanvasTexture(canvas)
  dustTextureCache.needsUpdate = true

  return dustTextureCache
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return hash >>> 0
}

function shiftHue(hexColor: string, hueShift: number): THREE.Color {
  const color = new THREE.Color(hexColor)
  const hsl = { h: 0, s: 0, l: 0 }
  color.getHSL(hsl)
  hsl.h = (hsl.h + hueShift + 1) % 1
  color.setHSL(hsl.h, hsl.s, hsl.l)
  return color
}

function getParticleCount(viewLevel: ViewLevel, isActive: boolean): number {
  switch (viewLevel) {
    case 'universe':
      return PARTICLE_COUNTS.universe
    case 'constellation':
      return isActive ? PARTICLE_COUNTS.constellationActive : PARTICLE_COUNTS.constellationInactive
    case 'book':
      return PARTICLE_COUNTS.book
    default:
      return PARTICLE_COUNTS.universe
  }
}

interface ParticleData {
  positions: Float32Array
  sizes: Float32Array
  opacities: Float32Array
  colors: Float32Array
  phases: Float32Array
}

function generateParticles(
  count: number,
  radius: number,
  topicColor: string,
  seed: number
): ParticleData {
  const rng = seededRandom(seed)
  const positions = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const opacities = new Float32Array(count)
  const colors = new Float32Array(count * 3)
  const phases = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    let x: number, y: number, z: number, d: number
    do {
      x = rng() * 2 - 1
      y = rng() * 2 - 1
      z = rng() * 2 - 1
      d = x * x + y * y + z * z
    } while (d > 1)

    const dist = Math.sqrt(d)
    positions[i * 3] = x * radius * 0.9
    positions[i * 3 + 1] = y * radius * 0.7
    positions[i * 3 + 2] = z * radius * 0.9

    sizes[i] = MIN_SIZE + (MAX_SIZE - MIN_SIZE) * (1 - dist) * rng()
    opacities[i] = (0.3 + 0.7 * (1 - dist)) * (0.5 + 0.5 * rng())

    const hueShift = (rng() - 0.5) * 0.056
    const particleColor = shiftHue(topicColor, hueShift)
    colors[i * 3] = particleColor.r
    colors[i * 3 + 1] = particleColor.g
    colors[i * 3 + 2] = particleColor.b

    phases[i] = rng() * Math.PI * 2
  }

  return { positions, sizes, opacities, colors, phases }
}

export function NebulaDust({
  topicColor,
  radius,
  position,
  viewLevel,
  isActive,
  opacity = 1,
  reducedMotion,
}: NebulaDustProps) {
  const { invalidate } = useThree()
  const setIsParticleDrifting = useLibraryStore((s) => s.setIsParticleDrifting)

  const pointsRef = useRef<THREE.Points>(null)
  const isDriftingRef = useRef(false)
  const timeRef = useRef(0)

  const [currentCount, setCurrentCount] = useState(() => getParticleCount(viewLevel, isActive))
  const targetCount = getParticleCount(viewLevel, isActive)

  useEffect(() => {
    if (targetCount !== currentCount) {
      setCurrentCount(targetCount)
    }
  }, [targetCount, currentCount])

  const seed = useMemo(() => hashString(topicColor + '_dust'), [topicColor])
  const particleData = useMemo(
    () => generateParticles(currentCount, radius, topicColor, seed),
    [currentCount, radius, topicColor, seed]
  )

  const texture = useMemo(() => getDustTexture(), [])

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(particleData.positions, 3))
    geom.setAttribute('size', new THREE.BufferAttribute(particleData.sizes, 1))
    geom.setAttribute('opacity', new THREE.BufferAttribute(particleData.opacities, 1))
    geom.setAttribute('color', new THREE.BufferAttribute(particleData.colors, 3))
    geom.setAttribute('phase', new THREE.BufferAttribute(particleData.phases, 1))
    return geom
  }, [particleData])

  const shouldDrift = isActive && !reducedMotion

  useFrame((_, delta) => {
    if (!pointsRef.current) return

    if (shouldDrift) {
      if (!isDriftingRef.current) {
        isDriftingRef.current = true
        setIsParticleDrifting(true)
      }

      timeRef.current += delta * DRIFT_SPEED
      const positionAttr = pointsRef.current.geometry.getAttribute('position')
      const phaseAttr = pointsRef.current.geometry.getAttribute('phase')

      for (let i = 0; i < currentCount; i++) {
        const phase = phaseAttr.getX(i)
        const baseX = particleData.positions[i * 3]!
        const baseY = particleData.positions[i * 3 + 1]!
        const baseZ = particleData.positions[i * 3 + 2]!

        const t = timeRef.current + phase
        const noiseX = simplex2D(baseX * NOISE_SCALE, t, 0) * 0.5
        const noiseY = simplex2D(baseY * NOISE_SCALE, t, 100) * 0.5
        const noiseZ = simplex2D(baseZ * NOISE_SCALE, t, 200) * 0.5

        positionAttr.setXYZ(i, baseX + noiseX, baseY + noiseY, baseZ + noiseZ)
      }

      positionAttr.needsUpdate = true
      invalidate()
    } else if (isDriftingRef.current) {
      isDriftingRef.current = false
      setIsParticleDrifting(false)

      const positionAttr = pointsRef.current.geometry.getAttribute('position')
      for (let i = 0; i < currentCount; i++) {
        positionAttr.setXYZ(
          i,
          particleData.positions[i * 3]!,
          particleData.positions[i * 3 + 1]!,
          particleData.positions[i * 3 + 2]!
        )
      }
      positionAttr.needsUpdate = true
      invalidate()
    }
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isDriftingRef.current) {
        setIsParticleDrifting(false)
      }
    }
  }, [setIsParticleDrifting])

  // Reset drifting state when particle count drops to 0
  useEffect(() => {
    if (currentCount === 0 && isDriftingRef.current) {
      isDriftingRef.current = false
      setIsParticleDrifting(false)
    }
  }, [currentCount, setIsParticleDrifting])

  if (currentCount === 0) {
    return null
  }

  return (
    <points ref={pointsRef} position={position}>
      <primitive object={geometry} attach="geometry" />
      <pointsMaterial
        map={texture}
        transparent
        opacity={opacity * 0.6}
        size={0.8}
        sizeAttenuation
        vertexColors
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
}
