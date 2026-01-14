'use client'

/**
 * ONeillSkybox - Procedural O'Neill cylinder interior skybox.
 *
 * Renders the interior view of a rotating space habitat cylinder with:
 * - Alternating land strips and window panels
 * - Procedural terrain on land strips (grass, lakes, structures)
 * - Space view through window strips (stars, sun)
 * - Atmospheric haze and lighting effects
 * - Slow rotation animation
 *
 * The classic O'Neill "Island Three" design has 3 land valleys and 3 window strips.
 */

import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface ONeillSkyboxProps {
  radius?: number
  length?: number
  numStrips?: number
  rotationSpeed?: number
  sunAngle?: number
  reducedMotion?: boolean
  opacity?: number
}

const vertexShader = /* glsl */ `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;

    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uRadius;
  uniform float uLength;
  uniform float uNumStrips;
  uniform float uSunAngle;
  uniform float uRotation;
  uniform vec3 uSunColor;
  uniform vec3 uSkyColor;
  uniform vec3 uGroundColor;
  uniform vec3 uWaterColor;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  // Simplex noise functions
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
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

  // Fractal Brownian Motion
  float fbm(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 6; i++) {
      if (i >= octaves) break;
      value += amplitude * snoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }

  // Hash for stars
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Star field
  float stars(vec2 uv, float density) {
    vec2 cell = floor(uv * density);
    vec2 cellUv = fract(uv * density);

    float h = hash(cell);
    vec2 starPos = vec2(hash(cell + 0.1), hash(cell + 0.2));

    float dist = length(cellUv - starPos);
    float brightness = smoothstep(0.1, 0.0, dist) * step(0.97, h);

    return brightness * (0.5 + 0.5 * hash(cell + 0.3));
  }

  void main() {
    // Calculate cylindrical coordinates
    // Position is on the cylinder surface, we're viewing from inside
    float angle = atan(vPosition.y, vPosition.x) + uRotation;
    float normalizedAngle = mod(angle / (2.0 * 3.14159265), 1.0);
    float alongCylinder = (vPosition.z / uLength) + 0.5; // 0 to 1 along length

    // Determine which strip we're on (alternating land/window)
    float stripWidth = 1.0 / uNumStrips;
    float stripIndex = floor(normalizedAngle / stripWidth);
    float stripPhase = mod(normalizedAngle, stripWidth) / stripWidth; // 0-1 within strip
    bool isWindow = mod(stripIndex, 2.0) < 0.5;

    vec3 color;
    float alpha = 1.0;

    // Edge softening between strips
    float edgeDist = min(stripPhase, 1.0 - stripPhase);
    float edgeFade = smoothstep(0.0, 0.05, edgeDist);

    if (isWindow) {
      // Window strip - view of space
      vec2 spaceUv = vec2(stripPhase * 2.0 - 1.0, alongCylinder * 4.0);

      // Star field
      float starBrightness = stars(spaceUv, 50.0) + stars(spaceUv * 1.7, 80.0) * 0.5;

      // Sun position based on time and sun angle
      float sunPosY = 0.5 + 0.3 * sin(uSunAngle);
      float sunPosX = 0.5 + 0.3 * cos(uSunAngle);
      vec2 sunPos = vec2(sunPosX, sunPosY);

      // Only show sun in this window if it's approximately in view
      float sunDist = length(vec2(stripPhase, alongCylinder) - sunPos);
      float sunGlow = exp(-sunDist * 8.0) * 0.8;
      float sunCore = smoothstep(0.08, 0.02, sunDist);

      // Base space color (deep blue-black)
      vec3 spaceColor = vec3(0.02, 0.02, 0.06);

      // Add stars
      color = spaceColor + vec3(starBrightness * 0.8);

      // Add sun
      color += uSunColor * sunGlow;
      color += uSunColor * sunCore * 2.0;

      // Window frame effect at edges
      float frameEffect = 1.0 - smoothstep(0.0, 0.1, edgeDist);
      color = mix(color, vec3(0.1, 0.1, 0.12), frameEffect * 0.7);

    } else {
      // Land strip - procedural terrain
      vec2 terrainUv = vec2(stripPhase * 10.0, alongCylinder * 20.0);
      vec3 samplePos = vec3(terrainUv, uTime * 0.01);

      // Base terrain noise
      float terrain = fbm(samplePos * 0.5, 4);
      float detailNoise = fbm(samplePos * 2.0, 3) * 0.3;
      terrain += detailNoise;

      // Water bodies (lower areas)
      float waterThreshold = -0.1;
      bool isWater = terrain < waterThreshold;

      // Terrain coloring
      vec3 grassColor = mix(
        vec3(0.15, 0.35, 0.1),  // Dark grass
        vec3(0.25, 0.45, 0.15), // Light grass
        smoothstep(-0.2, 0.3, terrain)
      );

      // Add some variation
      float colorNoise = fbm(samplePos * 4.0, 2) * 0.15;
      grassColor += vec3(colorNoise * 0.5, colorNoise, colorNoise * 0.3);

      // Water coloring with reflection
      vec3 waterCol = mix(
        vec3(0.1, 0.2, 0.4),
        vec3(0.2, 0.4, 0.6),
        0.5 + 0.5 * sin(alongCylinder * 50.0 + uTime * 0.5)
      );

      // Buildings/structures (high frequency noise peaks)
      float structureNoise = snoise(samplePos * 8.0);
      bool hasStructure = structureNoise > 0.7 && !isWater;
      vec3 structureColor = vec3(0.5, 0.5, 0.55);

      // Combine terrain
      if (isWater) {
        color = waterCol;
      } else if (hasStructure) {
        color = mix(grassColor, structureColor, smoothstep(0.7, 0.85, structureNoise));
      } else {
        color = grassColor;
      }

      // Atmospheric haze from the "overhead" land
      // In an O'Neill cylinder, looking up you see the opposite land strip
      float atmosphereHeight = 0.3 + 0.1 * sin(alongCylinder * 3.14159);
      vec3 atmosphereColor = mix(uSkyColor, vec3(0.7, 0.75, 0.85), 0.3);

      // Distance fog effect - further along cylinder = more haze
      float distFade = smoothstep(0.3, 0.7, abs(alongCylinder - 0.5) * 2.0);
      color = mix(color, atmosphereColor * 0.8, distFade * 0.4);

      // Sunlight on the land (based on sun angle through windows)
      float sunlightIntensity = max(0.0, cos(uSunAngle - normalizedAngle * 6.28318));
      sunlightIntensity = pow(sunlightIntensity, 2.0) * 0.5 + 0.5;
      color *= 0.7 + sunlightIntensity * 0.5;

      // Add warm sunlight tint
      color = mix(color, color * uSunColor, sunlightIntensity * 0.2);
    }

    // Cloud layer (applies to land strips mostly)
    if (!isWindow) {
      vec3 cloudPos = vec3(stripPhase * 5.0, alongCylinder * 10.0, uTime * 0.02);
      float clouds = fbm(cloudPos, 3);
      clouds = smoothstep(0.2, 0.6, clouds);

      vec3 cloudColor = vec3(0.95, 0.95, 1.0);
      color = mix(color, cloudColor, clouds * 0.4);
    }

    // Endcap darkening (at the ends of the cylinder)
    float endFade = smoothstep(0.0, 0.15, alongCylinder) * smoothstep(1.0, 0.85, alongCylinder);
    color *= endFade * 0.7 + 0.3;

    // Very subtle vignette for depth
    float vignette = 1.0 - (1.0 - endFade) * 0.3;
    color *= vignette;

    gl_FragColor = vec4(color, alpha);
  }
`

const DEFAULT_SUN_COLOR = new THREE.Color(1.0, 0.95, 0.8)
const DEFAULT_SKY_COLOR = new THREE.Color(0.5, 0.7, 0.95)
const DEFAULT_GROUND_COLOR = new THREE.Color(0.2, 0.4, 0.15)
const DEFAULT_WATER_COLOR = new THREE.Color(0.15, 0.3, 0.5)

export function ONeillSkybox({
  radius = 800,
  length = 1600,
  numStrips = 6,
  rotationSpeed = 0.02,
  sunAngle = 0,
  reducedMotion = false,
  opacity = 1.0,
}: ONeillSkyboxProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { invalidate } = useThree()

  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(radius, radius, length, 64, 1, true)
    return geo
  }, [radius, length])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRadius: { value: radius },
      uLength: { value: length },
      uNumStrips: { value: numStrips },
      uSunAngle: { value: sunAngle },
      uRotation: { value: 0 },
      uSunColor: { value: DEFAULT_SUN_COLOR.clone() },
      uSkyColor: { value: DEFAULT_SKY_COLOR.clone() },
      uGroundColor: { value: DEFAULT_GROUND_COLOR.clone() },
      uWaterColor: { value: DEFAULT_WATER_COLOR.clone() },
    }),
    [radius, length, numStrips, sunAngle]
  )

  useFrame((state) => {
    if (!materialRef.current) return

    const u = materialRef.current.uniforms as {
      uTime: { value: number }
      uRotation: { value: number }
      uSunAngle: { value: number }
    }

    if (!reducedMotion) {
      u.uTime.value = state.clock.elapsedTime
      u.uRotation.value = state.clock.elapsedTime * rotationSpeed
      u.uSunAngle.value = sunAngle + state.clock.elapsedTime * 0.1
      invalidate()
    }
  })

  return (
    <mesh geometry={geometry} rotation={[Math.PI / 2, 0, 0]}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        transparent={opacity < 1}
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  )
}
