'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { View } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import {
  Color,
  DynamicDrawUsage,
  InstancedMesh,
  Object3D,
  PerspectiveCamera,
  ShaderMaterial,
} from 'three'
import { createAutoTuneState, recordFrameSample } from '@/lib/interactive/quality'
import type { QualityTier } from '@/lib/interactive/capabilities'
import type { MachineSim } from '@/lib/machine/sim'
import { getMachineQuality } from '@/lib/machine/quality'
import styles from './machine.module.css'

interface MachineWorldProps {
  left: MachineSim
  right: MachineSim
  split: boolean
  tier: Exclude<QualityTier, 'auto'>
  reducedMotion: boolean
  paused: boolean
  isMobile: boolean
  version: number
  onTierChange: (tier: Exclude<QualityTier, 'auto'>) => void
  onReady: () => void
}

function cssColor(name: string): Color {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value ? new Color(value) : new Color()
}

function CameraMotion({
  reducedMotion,
  panel,
  split,
}: {
  reducedMotion: boolean
  panel: number
  split: boolean
}) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const distance = split ? 1.35 : 1

  useEffect(() => {
    camera.position.set((panel === 0 ? 16 : -16) * distance, 21 * distance, 27 * distance)
    camera.lookAt(0, 0, 0)
  }, [camera, distance, panel])

  useFrame((state) => {
    if (reducedMotion) return
    const time = state.clock.elapsedTime
    camera.position.x =
      (panel === 0 ? 16 : -16) * distance + Math.sin(time * 0.08) * 0.8 + state.pointer.x * 0.35
    camera.position.y = 21 * distance + state.pointer.y * 0.2
    camera.lookAt(0, 0, 0)
  })

  return null
}

function CityGround() {
  const material = useMemo(() => {
    const background = cssColor('--color-bg-0')
    const surface = cssColor('--color-bg-1')
    const glow = cssColor('--color-warm')
    return new ShaderMaterial({
      uniforms: {
        background: { value: background },
        surface: { value: surface },
        glow: { value: glow },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 background;
        uniform vec3 surface;
        uniform vec3 glow;
        varying vec2 vUv;
        void main() {
          float distanceFromCenter = distance(vUv, vec2(0.5));
          float districtLight = max(0.0, 0.34 - distanceFromCenter) * 0.13;
          vec3 base = mix(surface, background, smoothstep(0.08, 0.72, distanceFromCenter));
          gl_FragColor = vec4(base + glow * districtLight, 1.0);
        }
      `,
    })
  }, [])

  useEffect(() => () => material.dispose(), [material])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
      <planeGeometry args={[29, 29, 1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

function CityInstances({
  sim,
  reducedMotion,
  drawCount,
}: {
  sim: MachineSim
  reducedMotion: boolean
  drawCount: number
}) {
  const agents = useRef<InstancedMesh>(null)
  const structures = useRef<InstancedMesh>(null)
  const lastTick = useRef(-1)
  const object = useMemo(() => new Object3D(), [])
  const color = useMemo(() => new Color(), [])
  const warm = useMemo(() => cssColor('--color-warm'), [])
  const side = Math.ceil(Math.sqrt(sim.count))

  useEffect(() => {
    if (agents.current) agents.current.instanceMatrix.setUsage(DynamicDrawUsage)
    if (structures.current) structures.current.instanceMatrix.setUsage(DynamicDrawUsage)
  }, [])

  useFrame(() => {
    if (lastTick.current === sim.tick) return
    lastTick.current = sim.tick
    if (!agents.current || !structures.current) return

    for (let index = 0; index < drawCount; index++) {
      const column = index % side
      const row = Math.floor(index / side)
      const x = ((column + 0.5) / side - 0.5) * 24
      const z = ((row + 0.5) / side - 0.5) * 24
      const height = Math.min(4.5, 0.12 + sim.structureHeight[index]! * 0.035)
      const brightness = Math.min(0.22, 0.04 + Math.log1p(sim.capital[index]!) * 0.024)

      object.position.set(x, height * 0.5, z)
      object.scale.set(0.48 * (24 / side), height, 0.48 * (24 / side))
      object.rotation.set(0, 0, 0)
      object.updateMatrix()
      structures.current.setMatrixAt(index, object.matrix)
      color.copy(warm).multiplyScalar(brightness)
      structures.current.setColorAt(index, color)

      object.position.set(x, height + 0.055, z)
      object.scale.setScalar((reducedMotion ? 0.32 : 0.26) * (24 / side))
      object.updateMatrix()
      agents.current.setMatrixAt(index, object.matrix)
      color.copy(warm).multiplyScalar(sim.seizureFlash[index]! > 0 ? 0.05 : 0.72 + brightness)
      agents.current.setColorAt(index, color)
    }

    structures.current.instanceMatrix.needsUpdate = true
    agents.current.instanceMatrix.needsUpdate = true
    if (structures.current.instanceColor) structures.current.instanceColor.needsUpdate = true
    if (agents.current.instanceColor) agents.current.instanceColor.needsUpdate = true
  })

  return (
    <>
      <instancedMesh
        ref={structures}
        args={[undefined, undefined, drawCount]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={agents} args={[undefined, undefined, drawCount]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </>
  )
}

function TradeLinks({ sim }: { sim: MachineSim }) {
  const positions = useMemo(() => new Float32Array(sim.tradeA.length * 6), [sim.tradeA.length])
  const attribute = useRef<import('three').BufferAttribute>(null)
  const lastTick = useRef(-1)
  const side = Math.ceil(Math.sqrt(sim.count))

  useFrame(() => {
    if (lastTick.current === sim.tick || !attribute.current) return
    lastTick.current = sim.tick
    for (let pair = 0; pair < sim.tradeCount; pair++) {
      const first = sim.tradeA[pair]!
      const second = sim.tradeB[pair]!
      const offset = pair * 6
      positions[offset] = (((first % side) + 0.5) / side - 0.5) * 24
      positions[offset + 1] = 0.08
      positions[offset + 2] = ((Math.floor(first / side) + 0.5) / side - 0.5) * 24
      positions[offset + 3] = (((second % side) + 0.5) / side - 0.5) * 24
      positions[offset + 4] = 0.08
      positions[offset + 5] = ((Math.floor(second / side) + 0.5) / side - 0.5) * 24
    }
    attribute.current.needsUpdate = true
  })

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute ref={attribute} attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        color={cssColor('--color-warm')}
        transparent
        opacity={0.12}
        toneMapped={false}
      />
    </lineSegments>
  )
}

function CityScene({
  sim,
  panel,
  highQuality,
  drawCount,
  reducedMotion,
  split,
}: {
  sim: MachineSim
  panel: number
  highQuality: boolean
  drawCount: number
  reducedMotion: boolean
  split: boolean
}) {
  return (
    <>
      <CameraMotion reducedMotion={reducedMotion} panel={panel} split={split} />
      <color attach="background" args={[cssColor('--color-bg-0')]} />
      <CityGround />
      <CityInstances sim={sim} reducedMotion={reducedMotion} drawCount={drawCount} />
      {highQuality && <TradeLinks sim={sim} />}
      {highQuality && !split && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.5} luminanceThreshold={0.42} luminanceSmoothing={0.9} mipmapBlur />
        </EffectComposer>
      )}
    </>
  )
}

function FrameMonitor({
  tier,
  isMobile,
  reducedMotion,
  onTierChange,
}: Pick<MachineWorldProps, 'tier' | 'isMobile' | 'reducedMotion' | 'onTierChange'>) {
  const tuner = useRef<ReturnType<typeof createAutoTuneState> | null>(null)
  if (!tuner.current) {
    const state = createAutoTuneState(isMobile)
    state.currentTier = tier
    tuner.current = state
  }

  useFrame((_, delta) => {
    if (reducedMotion) return
    const nextTier = recordFrameSample(tuner.current!, delta * 1000)
    if (nextTier && nextTier !== tier) {
      if (nextTier === 'low' || (nextTier === 'medium' && tier === 'high')) {
        onTierChange(nextTier)
      } else {
        tuner.current!.currentTier = tier
      }
    }
  })
  return null
}

function StillInvalidator({ version }: { version: number }) {
  const invalidate = useThree((state) => state.invalidate)
  useEffect(() => invalidate(), [invalidate, version])
  return null
}

export function MachineWorld({
  left,
  right,
  split,
  tier,
  reducedMotion,
  paused,
  isMobile,
  version,
  onTierChange,
  onReady,
}: MachineWorldProps) {
  const quality = getMachineQuality(tier, split)
  const worldRef = useRef<HTMLDivElement>(null)

  useEffect(onReady, [onReady])
  useEffect(() => {
    if (!reducedMotion || !worldRef.current) return
    worldRef.current.animate([{ opacity: 0.72 }, { opacity: 1 }], {
      duration: 320,
      easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    })
  }, [reducedMotion, version])

  return (
    <div ref={worldRef} className={styles.world} data-split={split || undefined}>
      <View className={styles.viewport} index={1} frames={reducedMotion ? 1 : Infinity}>
        <CityScene
          sim={left}
          panel={0}
          highQuality={quality.bloom}
          drawCount={Math.min(left.count, quality.agentCount)}
          reducedMotion={reducedMotion}
          split={split}
        />
      </View>
      {split && (
        <View className={styles.viewport} index={2} frames={reducedMotion ? 1 : Infinity}>
          <CityScene
            sim={right}
            panel={1}
            highQuality={quality.bloom}
            drawCount={Math.min(right.count, quality.agentCount)}
            reducedMotion={reducedMotion}
            split={split}
          />
        </View>
      )}
      <Canvas
        className={styles.canvas}
        aria-hidden="true"
        dpr={quality.dpr}
        frameloop={reducedMotion || paused ? 'demand' : 'always'}
        gl={{
          antialias: quality.antialias,
          alpha: false,
          depth: true,
          stencil: false,
          powerPreference: 'high-performance',
        }}
        camera={{ fov: 38, near: 0.1, far: 100, position: [16, 21, 27] }}
      >
        <FrameMonitor
          tier={tier}
          isMobile={isMobile}
          reducedMotion={reducedMotion}
          onTierChange={onTierChange}
        />
        {reducedMotion && <StillInvalidator version={version} />}
        <View.Port />
      </Canvas>
    </div>
  )
}
