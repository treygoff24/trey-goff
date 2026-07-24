'use client'

import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { View } from '@react-three/drei'
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

const BloomPass = lazy(() =>
  import('@react-three/postprocessing').then(({ Bloom, EffectComposer }) => ({
    default: function MachineBloom() {
      return (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.5} luminanceThreshold={0.42} luminanceSmoothing={0.9} mipmapBlur />
        </EffectComposer>
      )
    },
  })),
)

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

const STRUCTURE_MODEL = '/machine/structure.glb'

// Guards the exposure ratio when an agent holds nothing at all.
const PARAMS_EPSILON = 1e-6

/**
 * Geometry for the structures instancer, or null to keep the plain box.
 *
 * Loaded imperatively rather than through drei's useGLTF on purpose. useGLTF
 * suspends, and a hook cannot be called conditionally, so it would suspend on
 * every visit including the default path where buildings are off — which blanks
 * the whole scene, since there is no Suspense boundary inside the View.
 *
 * The mesh is authored as a unit block anchored at its base so it drops into the
 * existing scale math untouched, and carries no material of its own so
 * instanceColor still drives the single-green palette.
 */
function useStructureGeometry(enabled: boolean) {
  const [geometry, setGeometry] = useState<import('three').BufferGeometry | null>(null)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    let loaded: import('three').BufferGeometry | undefined

    void import('three-stdlib').then(({ GLTFLoader }) => {
      new GLTFLoader().load(STRUCTURE_MODEL, (gltf) => {
        if (cancelled) return
        gltf.scene.traverse((node) => {
          const mesh = node as unknown as { geometry?: import('three').BufferGeometry }
          if (!loaded && mesh.geometry) loaded = mesh.geometry
        })
        if (loaded) setGeometry(loaded)
      })
    })

    return () => {
      cancelled = true
      loaded?.dispose()
    }
  }, [enabled])

  return geometry
}

function CityInstances({
  sim,
  reducedMotion,
  drawCount,
  buildings,
  mono,
}: {
  sim: MachineSim
  reducedMotion: boolean
  drawCount: number
  buildings: boolean
  mono: boolean
}) {
  const structureGeometry = useStructureGeometry(buildings)
  const agents = useRef<InstancedMesh>(null)
  const structures = useRef<InstancedMesh>(null)
  const lastTick = useRef(-1)
  const object = useMemo(() => new Object3D(), [])
  const color = useMemo(() => new Color(), [])
  const warm = useMemo(() => cssColor('--color-warm'), [])
  // Three states, three existing semantic tokens — no new hues in the palette.
  // Green compounds, amber is capital committed but not yet realised, red is
  // capital taken. This is what makes the levers legible: drop permitting and
  // the field yellows because investment sits exposed for longer, drop property
  // security and it starts flashing red because that exposure gets seized.
  const building = useMemo(() => cssColor('--color-warning'), [])
  const seized = useMemo(() => cssColor('--color-error'), [])
  const side = Math.ceil(Math.sqrt(sim.count))

  useLayoutEffect(() => {
    if (agents.current) agents.current.instanceMatrix.setUsage(DynamicDrawUsage)
    if (structures.current) structures.current.instanceMatrix.setUsage(DynamicDrawUsage)
    // The structures instancer remounts when the model arrives, so its matrices
    // start empty. Clearing the tick guard forces the next frame to refill them
    // instead of skipping as an already-drawn tick.
    lastTick.current = -1
  }, [structureGeometry])

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

      // A boxGeometry is centred on its origin, so it sits at half its height.
      // The structure model is anchored at its base and sits at zero.
      object.position.set(x, structureGeometry ? 0 : height * 0.5, z)
      object.scale.set(0.48 * (24 / side), height, 0.48 * (24 / side))
      object.rotation.set(0, 0, 0)
      object.updateMatrix()
      structures.current.setMatrixAt(index, object.matrix)

      if (mono) {
        color.copy(warm).multiplyScalar(brightness)
      } else if (sim.seizureFlash[index]! > 0) {
        // Seizure is an event, not a level, so it reads at fixed brightness
        // rather than scaling with capital. A rich agent losing everything and a
        // poor one losing everything are the same event.
        color.copy(seized).multiplyScalar(0.5)
      } else {
        // Exposure is the share of an agent's worth that is committed but not
        // yet realised — capital it could still lose. A binary "is building"
        // flag was useless here: investment resets to zero and immediately
        // starts accumulating again, so nearly every agent is mid-build on
        // nearly every tick and the whole field went amber. As a ratio it stays
        // green at rest and yellows exactly where the wait is long, which is
        // what the permitting lever actually does.
        const committed = sim.investment[index]!
        const exposure = committed / (committed + sim.capital[index]! + PARAMS_EPSILON)
        color
          .copy(warm)
          .lerp(building, Math.min(1, exposure * 2.2))
          .multiplyScalar(brightness)
      }
      structures.current.setColorAt(index, color)

      object.position.set(x, height + 0.055, z)
      object.scale.setScalar((reducedMotion ? 0.32 : 0.26) * (24 / side))
      object.updateMatrix()
      agents.current.setMatrixAt(index, object.matrix)
      // The agent dot sits above its structure. It stays green except when
      // seized, where dimming alone was nearly invisible against the field.
      if (!mono && sim.seizureFlash[index]! > 0) {
        color.copy(seized).multiplyScalar(0.85)
      } else {
        color.copy(warm).multiplyScalar(sim.seizureFlash[index]! > 0 ? 0.05 : 0.72 + brightness)
      }
      agents.current.setColorAt(index, color)
    }

    structures.current.instanceMatrix.needsUpdate = true
    agents.current.instanceMatrix.needsUpdate = true
    if (structures.current.instanceColor) structures.current.instanceColor.needsUpdate = true
    if (agents.current.instanceColor) agents.current.instanceColor.needsUpdate = true
  })

  return (
    <>
      {/*
        args are constructor arguments, applied once. The model resolves after
        first paint, so without a changing key the instancer would keep the box
        it was built with and the swap would silently never happen.
      */}
      <instancedMesh
        key={structureGeometry ? 'structure-model' : 'structure-box'}
        ref={structures}
        args={[structureGeometry ?? undefined, undefined, drawCount]}
        frustumCulled={false}
      >
        {structureGeometry ? null : <boxGeometry args={[1, 1, 1]} />}
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
  buildings,
  mono,
}: {
  sim: MachineSim
  panel: number
  highQuality: boolean
  drawCount: number
  reducedMotion: boolean
  split: boolean
  buildings: boolean
  mono: boolean
}) {
  return (
    <>
      <CameraMotion reducedMotion={reducedMotion} panel={panel} split={split} />
      <color attach="background" args={[cssColor('--color-bg-0')]} />
      <CityGround />
      <CityInstances
        sim={sim}
        reducedMotion={reducedMotion}
        drawCount={drawCount}
        buildings={buildings}
        mono={mono}
      />
      {highQuality && <TradeLinks sim={sim} />}
      {highQuality && !split && (
        <Suspense fallback={null}>
          <BloomPass />
        </Suspense>
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
  // Experiment toggle: /machine?buildings=1 swaps the structure bars for the
  // modelled skyline. Read once from the URL rather than threaded through the
  // console, so the default path stays exactly the shipped bars while the two
  // can be compared live. Promote to real UI only if the skyline wins.
  const params = useMemo(
    () =>
      typeof window === 'undefined'
        ? new URLSearchParams()
        : new URLSearchParams(window.location.search),
    [],
  )
  const buildings = params.has('buildings')
  // /machine?mono=1 restores the original single-green field for comparison.
  const mono = params.has('mono')

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
          buildings={buildings}
          mono={mono}
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
            buildings={buildings}
            mono={mono}
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
