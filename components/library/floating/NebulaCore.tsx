'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useLibraryStore } from '@/lib/library/store'

interface NebulaCoreProps {
  color: THREE.ColorRepresentation
  intensity?: number
  scale?: number | [number, number, number]
  reducedMotion: boolean
  opacity?: number
  isAnimating?: boolean
}

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vDistFromCenter;

  void main() {
    // Transform normal to view space
    vNormal = normalize(normalMatrix * normal);

    // Calculate view direction in view space
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);

    // Distance from center for radial falloff (0 at center, 1 at surface)
    vDistFromCenter = length(position);

    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uTime;
  uniform float uBreathingSpeed;
  uniform float uBreathingAmount;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vDistFromCenter;

  void main() {
    // Fresnel effect - stronger at glancing angles
    float fresnel = 1.0 - max(dot(vViewDir, vNormal), 0.0);
    fresnel = pow(fresnel, 2.0);

    // Soft core glow - inverse of fresnel (bright at center-facing surfaces)
    float core = 1.0 - fresnel;
    core = pow(core, 1.5);

    // Radial falloff from geometry center
    float radialFalloff = 1.0 - smoothstep(0.0, 1.0, vDistFromCenter);
    radialFalloff = pow(radialFalloff, 0.8);

    // Breathing animation - subtle intensity pulse
    float breath = 1.0 + uBreathingAmount * sin(uTime * uBreathingSpeed);

    // Rim highlight - visible at edges for definition
    float rim = fresnel * 0.5;

    // Combine all effects
    float intensity = (core * radialFalloff + rim) * uIntensity * breath;

    // HDR output for bloom pickup (values > 1.0)
    vec3 color = uColor * intensity * 1.5;

    // Alpha based on intensity for soft blending
    float alpha = clamp(intensity * 0.9, 0.0, 1.0);

    gl_FragColor = vec4(color, alpha);
  }
`

const BREATHING_SPEED = 0.3
const BREATHING_AMOUNT = 0.05
const GEOMETRY_DETAIL = 3

export function NebulaCore({
  color,
  intensity = 1.0,
  scale = 1.0,
  reducedMotion,
  opacity = 1.0,
  isAnimating = true,
}: NebulaCoreProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const setIsUvPanning = useLibraryStore((s) => s.setIsUvPanning)

  const colorVec = useMemo(() => new THREE.Color(color), [color])

  // Register animation state with store - AnimationDriver handles invalidation
  const shouldAnimate = !reducedMotion && isAnimating
  useEffect(() => {
    if (shouldAnimate) {
      setIsUvPanning(true)
    }
    return () => {
      // Clear on unmount or when animation stops
      if (shouldAnimate) {
        setIsUvPanning(false)
      }
    }
  }, [shouldAnimate, setIsUvPanning])

  const geometry = useMemo(
    () => new THREE.IcosahedronGeometry(1, GEOMETRY_DETAIL),
    []
  )

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color() },
      uIntensity: { value: 1.0 },
      uTime: { value: 0 },
      uBreathingSpeed: { value: BREATHING_SPEED },
      uBreathingAmount: { value: BREATHING_AMOUNT },
    }),
    []
  )

  useFrame((state) => {
    if (!materialRef.current) return

    const u = materialRef.current.uniforms as {
      uColor: { value: THREE.Color }
      uIntensity: { value: number }
      uTime: { value: number }
      uBreathingSpeed: { value: number }
      uBreathingAmount: { value: number }
    }

    if (!u.uColor.value.equals(colorVec)) {
      u.uColor.value.copy(colorVec)
    }

    u.uIntensity.value = intensity * opacity
    u.uBreathingSpeed.value = shouldAnimate ? BREATHING_SPEED : 0
    u.uBreathingAmount.value = shouldAnimate ? BREATHING_AMOUNT : 0

    if (shouldAnimate) {
      u.uTime.value = state.clock.elapsedTime
      // AnimationDriver handles invalidation via isUvPanning flag
    }
  })

  const scaleArray: [number, number, number] =
    typeof scale === 'number' ? [scale, scale, scale] : scale

  return (
    <mesh geometry={geometry} scale={scaleArray}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.FrontSide}
        toneMapped={false}
      />
    </mesh>
  )
}
