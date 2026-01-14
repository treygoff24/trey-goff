'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Billboard } from '@react-three/drei'
import { useLibraryStore } from '@/lib/library/store'

interface NebulaWispsProps {
  topic: string
  color: THREE.ColorRepresentation
  count: number
  radius: number
  opacity?: number
  reducedMotion: boolean
}

interface WispData {
  position: THREE.Vector3
  scale: number
  rotation: number
  uvOffset: [number, number]
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Simplex noise implementation + fbm + domain warping
const fragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  uniform vec2 uUvOffset;

  varying vec2 vUv;

  // Simplex 3D noise - optimized version
  vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 1.0 / 7.0;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  // Fractal Brownian Motion - 4 octaves
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 4; i++) {
      value += amplitude * snoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }

    return value;
  }

  void main() {
    vec2 uv = vUv - 0.5;
    float dist = length(uv);

    // Apply UV offset for variety between wisps
    vec3 p = vec3((uv + uUvOffset) * 3.0, uTime * 0.08);

    // Domain warping - displace coordinates based on noise
    float warp = fbm(p);
    p.xy += warp * 0.6;

    // Second pass of fbm for detail
    float noise = fbm(p) * 0.5 + 0.5;

    // Radial falloff - soft edges
    float falloff = 1.0 - smoothstep(0.15, 0.5, dist);
    falloff = pow(falloff, 1.2);

    // Combine noise and falloff
    float alpha = noise * falloff * uOpacity;

    // Add subtle variation based on distance
    alpha *= 1.0 + 0.3 * snoise(vec3(uv * 5.0, uTime * 0.05));

    // HDR color for bloom
    vec3 color = uColor * 1.8;

    gl_FragColor = vec4(color, alpha);
  }
`

function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return hash >>> 0
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function generateWispData(topic: string, count: number, radius: number): WispData[] {
  const seed = hashString(topic + '_wisps')
  const rng = seededRandom(seed)
  const wisps: WispData[] = []

  for (let i = 0; i < count; i++) {
    // Position within ellipsoid
    const theta = rng() * Math.PI * 2
    const phi = Math.acos(2 * rng() - 1)
    const r = radius * (0.3 + rng() * 0.5)

    const x = r * Math.sin(phi) * Math.cos(theta)
    const y = r * Math.sin(phi) * Math.sin(theta) * 0.7
    const z = r * Math.cos(phi) * 0.8

    wisps.push({
      position: new THREE.Vector3(x, y, z),
      scale: radius * (0.6 + rng() * 0.6),
      rotation: rng() * Math.PI * 2,
      uvOffset: [rng() * 2 - 1, rng() * 2 - 1],
    })
  }

  return wisps
}

interface SingleWispProps {
  data: WispData
  color: THREE.Color
  opacity: number
  reducedMotion: boolean
}

function SingleWisp({ data, color, opacity, reducedMotion }: SingleWispProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color() },
      uOpacity: { value: 1.0 },
      uTime: { value: 0 },
      uUvOffset: { value: new THREE.Vector2() },
    }),
    []
  )

  useFrame((state) => {
    if (!materialRef.current) return

    const u = materialRef.current.uniforms as {
      uColor: { value: THREE.Color }
      uOpacity: { value: number }
      uTime: { value: number }
      uUvOffset: { value: THREE.Vector2 }
    }

    u.uColor.value.copy(color)
    u.uOpacity.value = opacity
    u.uUvOffset.value.set(data.uvOffset[0], data.uvOffset[1])

    if (!reducedMotion) {
      u.uTime.value = state.clock.elapsedTime
      // Don't call invalidate here - NebulaWisps parent manages animation state
    }
  })

  return (
    <Billboard position={data.position} follow lockX={false} lockY={false} lockZ={false}>
      <mesh rotation={[0, 0, data.rotation]}>
        <planeGeometry args={[data.scale, data.scale]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </Billboard>
  )
}

export function NebulaWisps({
  topic,
  color,
  count,
  radius,
  opacity = 1.0,
  reducedMotion,
}: NebulaWispsProps) {
  const colorObj = useMemo(() => new THREE.Color(color), [color])
  const setIsUvPanning = useLibraryStore((s) => s.setIsUvPanning)

  const wisps = useMemo(
    () => generateWispData(topic, count, radius),
    [topic, count, radius]
  )

  // Register animation state with store - AnimationDriver handles invalidation
  useEffect(() => {
    if (!reducedMotion && count > 0) {
      setIsUvPanning(true)
    }
    return () => {
      // Only clear if we set it (avoid race conditions with other wisps)
      // The last wisp to unmount will clear it
      setIsUvPanning(false)
    }
  }, [reducedMotion, count, setIsUvPanning])

  return (
    <group>
      {wisps.map((wisp, i) => (
        <SingleWisp
          key={`wisp-${i}`}
          data={wisp}
          color={colorObj}
          opacity={opacity}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  )
}
