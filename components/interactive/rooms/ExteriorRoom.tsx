"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { THREE_COLORS } from "@/lib/interactive/colors";
import { DoorTrigger } from "../DoorTrigger";
import type { RoomId } from "@/lib/interactive/types";

// =============================================================================
// Types
// =============================================================================

interface ExteriorRoomProps {
	/** Show debug visualizations */
	debug?: boolean;
	/** Callback when door is activated */
	onDoorActivate?: (targetRoom: RoomId, spawnPosition: [number, number, number], spawnRotation: number) => void;
}

// =============================================================================
// Constants
// =============================================================================

const GROUND_SIZE = 100;
const MANSION_WIDTH = 20;
const MANSION_DEPTH = 15;
const MANSION_HEIGHT = 12;

// =============================================================================
// Shaders
// =============================================================================

const skyVertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragmentShader = /* glsl */ `
  precision highp float;
  
  uniform vec3 uZenithColor;
  uniform vec3 uHorizonColor;
  uniform vec3 uGroundColor;
  uniform float uTime;
  
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  
  void main() {
    vec3 viewDir = normalize(vWorldPosition);
    float height = viewDir.y;
    
    // Gradient from ground to zenith
    vec3 color;
    if (height < 0.0) {
      color = uGroundColor;
    } else {
      float t = pow(height, 0.5);
      color = mix(uHorizonColor, uZenithColor, t);
    }
    
    // Subtle aurora-like shimmer near horizon
    float shimmer = sin(vWorldPosition.x * 0.02 + uTime * 0.1) * 
                    sin(vWorldPosition.z * 0.015 + uTime * 0.08);
    shimmer = shimmer * 0.5 + 0.5;
    shimmer *= smoothstep(0.0, 0.3, height) * smoothstep(0.6, 0.2, height);
    color += vec3(0.1, 0.05, 0.2) * shimmer * 0.15;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

const cylinderVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const cylinderFragmentShader = /* glsl */ `
  precision highp float;
  
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uGlowIntensity;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  
  void main() {
    // Fresnel for rim glow
    float fresnel = 1.0 - max(dot(vViewDir, vNormal), 0.0);
    fresnel = pow(fresnel, 2.5);
    
    // Panel lines along the cylinder
    float panels = sin(vUv.y * 40.0) * 0.5 + 0.5;
    panels = smoothstep(0.4, 0.6, panels);
    
    // Window lights pattern
    float windows = sin(vUv.x * 80.0) * sin(vUv.y * 200.0);
    windows = step(0.7, windows) * 0.3;
    
    // Base metallic color
    vec3 baseColor = uColor * (0.3 + panels * 0.2);
    
    // Add rim glow
    vec3 rimColor = vec3(0.4, 0.6, 1.0) * fresnel * uGlowIntensity;
    
    // Add window lights
    vec3 windowColor = vec3(1.0, 0.9, 0.7) * windows;
    
    vec3 finalColor = baseColor + rimColor + windowColor;
    float alpha = 0.4 + fresnel * 0.3;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

const terrainVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vNormal;
  
  // Simplex noise for terrain
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * snoise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
  
  void main() {
    vUv = uv;
    
    // Generate terrain height
    vec2 noiseCoord = position.xz * 0.02;
    float elevation = fbm(noiseCoord) * 15.0;
    
    // Add sharp ridges for sci-fi look
    float ridges = abs(snoise(noiseCoord * 2.0)) * 8.0;
    elevation += ridges;
    
    // Flatten near center (where buildings are)
    float distFromCenter = length(position.xz);
    float flattenFactor = smoothstep(30.0, 60.0, distFromCenter);
    elevation *= flattenFactor;
    
    vElevation = elevation;
    
    vec3 newPosition = position;
    newPosition.y += elevation;
    
    // Approximate normal
    float e = 0.01;
    float hL = fbm((position.xz + vec2(-e, 0.0)) * 0.02) * 15.0;
    float hR = fbm((position.xz + vec2(e, 0.0)) * 0.02) * 15.0;
    float hD = fbm((position.xz + vec2(0.0, -e)) * 0.02) * 15.0;
    float hU = fbm((position.xz + vec2(0.0, e)) * 0.02) * 15.0;
    vNormal = normalize(vec3(hL - hR, 2.0 * e, hD - hU));
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const terrainFragmentShader = /* glsl */ `
  precision highp float;
  
  uniform vec3 uBaseColor;
  uniform vec3 uHighColor;
  uniform vec3 uGlowColor;
  uniform float uTime;
  
  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vNormal;
  
  void main() {
    // Height-based coloring
    float heightFactor = smoothstep(0.0, 20.0, vElevation);
    vec3 color = mix(uBaseColor, uHighColor, heightFactor);
    
    // Grid lines for sci-fi effect
    vec2 grid = abs(fract(vUv * 50.0) - 0.5);
    float gridLine = smoothstep(0.02, 0.0, min(grid.x, grid.y));
    color += uGlowColor * gridLine * 0.3;
    
    // Simple lighting
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
    float diffuse = max(dot(vNormal, lightDir), 0.0);
    color *= 0.5 + diffuse * 0.5;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Procedural sky dome with gradient and subtle effects.
 */
function ProceduralSky() {
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	
	const uniforms = useMemo(() => ({
		uZenithColor: { value: new THREE.Color("#050812") },
		uHorizonColor: { value: new THREE.Color("#0a1525") },
		uGroundColor: { value: new THREE.Color("#030508") },
		uTime: { value: 0 },
	}), []);
	
	useFrame((state) => {
		if (materialRef.current?.uniforms.uTime) {
			materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
		}
	});

	return (
		<mesh rotation={[0, 0, 0]} position={[0, -10, 0]}>
			<sphereGeometry args={[200, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
			<shaderMaterial
				ref={materialRef}
				vertexShader={skyVertexShader}
				fragmentShader={skyFragmentShader}
				uniforms={uniforms}
				side={THREE.BackSide}
			/>
		</mesh>
	);
}

/**
 * Single O'Neill cylinder with its own shader material.
 */
function ONeillCylinder({
	position,
	rotation,
	scale,
}: {
	position: [number, number, number];
	rotation: number;
	scale: number;
}) {
	const materialRef = useRef<THREE.ShaderMaterial>(null);

	const uniforms = useMemo(
		() => ({
			uColor: { value: new THREE.Color("#2a3a5a") },
			uTime: { value: 0 },
			uGlowIntensity: { value: 0.5 },
		}),
		[]
	);

	useFrame((state) => {
		if (materialRef.current?.uniforms.uTime) {
			materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
		}
	});

	return (
		<mesh
			position={position}
			rotation={[0, 0, Math.PI / 6 + rotation]}
			scale={scale}
		>
			<cylinderGeometry args={[4, 4, 30, 32, 8, true]} />
			<shaderMaterial
				ref={materialRef}
				vertexShader={cylinderVertexShader}
				fragmentShader={cylinderFragmentShader}
				uniforms={uniforms}
				transparent
				side={THREE.DoubleSide}
				depthWrite={false}
			/>
		</mesh>
	);
}

/**
 * O'Neill cylinder habitats floating in the sky.
 */
function ONeillCylinders() {
	const groupRef = useRef<THREE.Group>(null);

	const cylinderData = useMemo(
		() => [
			{ pos: [-80, 40, -150] as [number, number, number], scale: 1.0, rotation: 0.3 },
			{ pos: [60, 50, -180] as [number, number, number], scale: 1.2, rotation: -0.2 },
			{ pos: [20, 35, -200] as [number, number, number], scale: 0.8, rotation: 0.5 },
			{ pos: [-40, 55, -220] as [number, number, number], scale: 0.6, rotation: 0.1 },
		],
		[]
	);

	useFrame((state) => {
		if (groupRef.current) {
			groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.02) * 0.02;
		}
	});

	return (
		<group ref={groupRef}>
			{cylinderData.map((data, i) => (
				<ONeillCylinder
					key={i}
					position={data.pos}
					rotation={data.rotation}
					scale={data.scale}
				/>
			))}
		</group>
	);
}

/**
 * Complete sky with all elements.
 */
function Sky() {
	return (
		<group>
			<ProceduralSky />
			<ONeillCylinders />
			<Stars radius={180} depth={50} count={3000} factor={4} saturation={0.2} />
		</group>
	);
}

/**
 * Procedural sci-fi terrain with ridges and grid overlay.
 */
function SciFiTerrain() {
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	
	const geometry = useMemo(() => {
		const geo = new THREE.PlaneGeometry(200, 200, 128, 128);
		geo.rotateX(-Math.PI / 2);
		return geo;
	}, []);
	
	const uniforms = useMemo(() => ({
		uBaseColor: { value: new THREE.Color("#0a0f18") },
		uHighColor: { value: new THREE.Color("#1a2535") },
		uGlowColor: { value: new THREE.Color(THREE_COLORS.accent) },
		uTime: { value: 0 },
	}), []);
	
	useFrame((state) => {
		if (materialRef.current?.uniforms.uTime) {
			materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
		}
	});

	return (
		<mesh geometry={geometry} position={[0, 0, -80]}>
			<shaderMaterial
				ref={materialRef}
				vertexShader={terrainVertexShader}
				fragmentShader={terrainFragmentShader}
				uniforms={uniforms}
			/>
		</mesh>
	);
}

// Seeded pseudo-random number generator (mulberry32)
function seededRandom(seed: number): () => number {
	return () => {
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// Pre-computed building data (deterministic)
const CITY_BUILDINGS: { pos: [number, number, number]; width: number; height: number; depth: number }[] = (() => {
	const random = seededRandom(42);
	const result: { pos: [number, number, number]; width: number; height: number; depth: number }[] = [];

	for (let i = 0; i < 30; i++) {
		const angle = Math.PI * 0.3 + random() * Math.PI * 0.4;
		const distance = 120 + random() * 40;
		const x = Math.cos(angle) * distance;
		const z = -Math.sin(angle) * distance;
		const height = 8 + random() * 25;
		const width = 3 + random() * 6;
		const depth = 3 + random() * 6;

		result.push({
			pos: [x, height / 2, z],
			width,
			height,
			depth,
		});
	}
	return result;
})();

/**
 * Distant city silhouettes for atmosphere.
 */
function CitySilhouettes() {
	const buildings = CITY_BUILDINGS;
	
	return (
		<group>
			{buildings.map((b, i) => (
				<mesh key={i} position={b.pos} castShadow>
					<boxGeometry args={[b.width, b.height, b.depth]} />
					<meshStandardMaterial
						color="#080c12"
						roughness={0.9}
						metalness={0.1}
						emissive={THREE_COLORS.accent}
						emissiveIntensity={0.02}
					/>
				</mesh>
			))}
			
			{/* Occasional lit windows */}
			{buildings.slice(0, 10).map((b, i) => (
				<pointLight
					key={`light-${i}`}
					position={[b.pos[0], b.pos[1] + b.height * 0.3, b.pos[2] + b.depth]}
					color={THREE_COLORS.warm}
					intensity={0.5}
					distance={15}
				/>
			))}
		</group>
	);
}

/**
 * Enhanced mansion facade with sci-fi architectural details.
 */
function MansionFacade() {
	return (
		<group position={[0, 0, -20]}>
			{/* Main building - darker, more imposing */}
			<mesh position={[0, MANSION_HEIGHT / 2, 0]} castShadow receiveShadow>
				<boxGeometry args={[MANSION_WIDTH, MANSION_HEIGHT, MANSION_DEPTH]} />
				<meshStandardMaterial
					color="#1a1a25"
					roughness={0.5}
					metalness={0.5}
				/>
			</mesh>

			{/* Metallic trim bands */}
			{[2, 6, 10].map((y) => (
				<mesh key={y} position={[0, y, MANSION_DEPTH / 2 + 0.05]}>
					<boxGeometry args={[MANSION_WIDTH + 0.5, 0.3, 0.1]} />
					<meshStandardMaterial
						color="#4a4a5a"
						roughness={0.2}
						metalness={0.9}
					/>
				</mesh>
			))}

			{/* Sci-fi roof with antenna elements */}
			<mesh position={[0, MANSION_HEIGHT + 1.5, 0]} castShadow>
				<boxGeometry args={[MANSION_WIDTH * 0.9, 3, MANSION_DEPTH * 0.9]} />
				<meshStandardMaterial
					color="#12121a"
					roughness={0.6}
					metalness={0.4}
				/>
			</mesh>
			
			{/* Roof antenna */}
			<mesh position={[0, MANSION_HEIGHT + 5, 0]}>
				<cylinderGeometry args={[0.2, 0.3, 4, 8]} />
				<meshStandardMaterial
					color="#3a3a4a"
					roughness={0.2}
					metalness={0.9}
					emissive={THREE_COLORS.accent}
					emissiveIntensity={0.3}
				/>
			</mesh>
			
			{/* Antenna light */}
			<pointLight
				position={[0, MANSION_HEIGHT + 7, 0]}
				color={THREE_COLORS.accent}
				intensity={2}
				distance={20}
			/>

			{/* Entrance door frame - glowing */}
			<mesh position={[0, 2.5, MANSION_DEPTH / 2 + 0.1]}>
				<boxGeometry args={[5, 5, 0.4]} />
				<meshStandardMaterial
					color={THREE_COLORS.warm}
					roughness={0.3}
					metalness={0.7}
					emissive={THREE_COLORS.warm}
					emissiveIntensity={0.4}
				/>
			</mesh>
			
			{/* Inner door (darker) */}
			<mesh position={[0, 2.5, MANSION_DEPTH / 2 + 0.2]}>
				<boxGeometry args={[3.5, 4, 0.2]} />
				<meshStandardMaterial
					color="#0a0a10"
					roughness={0.5}
					metalness={0.6}
				/>
			</mesh>

			{/* Glowing windows with proper framing */}
			{[-6, 6].map((x) =>
				[3.5, 7.5].map((y) => (
					<group key={`${x}-${y}`} position={[x, y, MANSION_DEPTH / 2]}>
						{/* Window frame */}
						<mesh position={[0, 0, 0.05]}>
							<boxGeometry args={[2.6, 3.1, 0.15]} />
							<meshStandardMaterial
								color="#3a3a4a"
								roughness={0.3}
								metalness={0.8}
							/>
						</mesh>
						{/* Window glass - emissive */}
						<mesh position={[0, 0, 0.12]}>
							<planeGeometry args={[2.2, 2.7]} />
							<meshStandardMaterial
								color={THREE_COLORS.accent}
								emissive={THREE_COLORS.accent}
								emissiveIntensity={0.8}
								transparent
								opacity={0.9}
							/>
						</mesh>
						{/* Window light */}
						<pointLight
							position={[0, 0, 2]}
							color={THREE_COLORS.accent}
							intensity={1}
							distance={8}
						/>
					</group>
				))
			)}
			
			{/* Side panel accents */}
			{[-MANSION_WIDTH / 2 - 0.05, MANSION_WIDTH / 2 + 0.05].map((x, i) => (
				<mesh key={i} position={[x, MANSION_HEIGHT / 2, 0]}>
					<boxGeometry args={[0.1, MANSION_HEIGHT, MANSION_DEPTH]} />
					<meshStandardMaterial
						color="#2a2a3a"
						roughness={0.4}
						metalness={0.7}
						emissive={THREE_COLORS.accent}
						emissiveIntensity={0.1}
					/>
				</mesh>
			))}
		</group>
	);
}

/**
 * Improved mech with glowing visor and metallic materials.
 */
function Mech({ reducedMotion = false }: { reducedMotion?: boolean }) {
	const groupRef = useRef<THREE.Group>(null);
	const visorRef = useRef<THREE.Mesh>(null);

	useFrame((state) => {
		if (!groupRef.current || reducedMotion) return;
		// Subtle idle sway
		groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.03;
		groupRef.current.position.y = 5 + Math.sin(state.clock.elapsedTime * 0.4) * 0.15;
		
		// Pulsing visor
		if (visorRef.current) {
			const mat = visorRef.current.material as THREE.MeshStandardMaterial;
			mat.emissiveIntensity = 1.5 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
		}
	});

	return (
		<group ref={groupRef} position={[25, 5, -10]}>
			{/* Torso - more detailed */}
			<mesh castShadow>
				<boxGeometry args={[5, 6, 4]} />
				<meshStandardMaterial
					color="#2a2a35"
					roughness={0.2}
					metalness={0.9}
				/>
			</mesh>
			
			{/* Chest plate */}
			<mesh position={[0, 0.5, 2.1]}>
				<boxGeometry args={[4, 4, 0.3]} />
				<meshStandardMaterial
					color="#3a3a45"
					roughness={0.1}
					metalness={0.95}
				/>
			</mesh>
			
			{/* Reactor core in chest */}
			<mesh position={[0, 0, 2.3]}>
				<circleGeometry args={[0.8, 16]} />
				<meshStandardMaterial
					color={THREE_COLORS.warm}
					emissive={THREE_COLORS.warm}
					emissiveIntensity={2}
				/>
			</mesh>
			<pointLight position={[0, 0, 3]} color={THREE_COLORS.warm} intensity={3} distance={10} />

			{/* Head - angular */}
			<mesh position={[0, 4.5, 0]} castShadow>
				<boxGeometry args={[2.5, 2.5, 2.5]} />
				<meshStandardMaterial
					color="#1a1a25"
					roughness={0.2}
					metalness={0.9}
				/>
			</mesh>
			
			{/* Head crest */}
			<mesh position={[0, 5.8, 0]}>
				<boxGeometry args={[0.5, 0.8, 2]} />
				<meshStandardMaterial
					color="#3a3a4a"
					roughness={0.2}
					metalness={0.9}
				/>
			</mesh>

			{/* Visor - glowing */}
			<mesh ref={visorRef} position={[0, 4.5, 1.3]}>
				<boxGeometry args={[2, 0.6, 0.2]} />
				<meshStandardMaterial
					color={THREE_COLORS.warm}
					emissive={THREE_COLORS.warm}
					emissiveIntensity={1.5}
				/>
			</mesh>
			<pointLight position={[0, 4.5, 2]} color={THREE_COLORS.warm} intensity={2} distance={8} />

			{/* Shoulders */}
			{[-3.5, 3.5].map((x) => (
				<mesh key={x} position={[x, 2, 0]} castShadow>
					<boxGeometry args={[2, 2, 3]} />
					<meshStandardMaterial
						color="#2a2a35"
						roughness={0.2}
						metalness={0.9}
					/>
				</mesh>
			))}

			{/* Arms */}
			{[-3.5, 3.5].map((x) => (
				<group key={x} position={[x, 0, 0]}>
					{/* Upper arm */}
					<mesh position={[0, -1.5, 0]} castShadow>
						<boxGeometry args={[1.8, 3.5, 2]} />
						<meshStandardMaterial
							color="#25252f"
							roughness={0.25}
							metalness={0.85}
						/>
					</mesh>
					{/* Lower arm */}
					<mesh position={[0, -4.5, 0]} castShadow>
						<boxGeometry args={[1.5, 3, 1.8]} />
						<meshStandardMaterial
							color="#1f1f28"
							roughness={0.2}
							metalness={0.9}
						/>
					</mesh>
					{/* Hand/fist */}
					<mesh position={[0, -6.5, 0]} castShadow>
						<boxGeometry args={[1.2, 1.2, 1.5]} />
						<meshStandardMaterial
							color="#2a2a35"
							roughness={0.3}
							metalness={0.85}
						/>
					</mesh>
				</group>
			))}

			{/* Legs */}
			{[-1.8, 1.8].map((x) => (
				<group key={x} position={[x, -5, 0]}>
					{/* Upper leg */}
					<mesh castShadow>
						<boxGeometry args={[2, 4, 2.5]} />
						<meshStandardMaterial
							color="#1f1f28"
							roughness={0.2}
							metalness={0.9}
						/>
					</mesh>
					{/* Lower leg */}
					<mesh position={[0, -3.5, 0]} castShadow>
						<boxGeometry args={[1.8, 3.5, 2.2]} />
						<meshStandardMaterial
							color="#25252f"
							roughness={0.25}
							metalness={0.85}
						/>
					</mesh>
					{/* Foot */}
					<mesh position={[0, -5.8, 0.5]} castShadow>
						<boxGeometry args={[2, 1, 3]} />
						<meshStandardMaterial
							color="#2a2a35"
							roughness={0.3}
							metalness={0.85}
						/>
					</mesh>
				</group>
			))}

			{/* Goff Industries logo plate */}
			<mesh position={[0, 1.5, 2.15]}>
				<planeGeometry args={[3.5, 1]} />
				<meshStandardMaterial
					color={THREE_COLORS.accent}
					emissive={THREE_COLORS.accent}
					emissiveIntensity={0.5}
					transparent
					opacity={0.9}
				/>
			</mesh>
		</group>
	);
}

/**
 * Ground with landing pad and pathway lighting.
 */
function Ground() {
	const lightsRef = useRef<THREE.Group>(null);
	
	useFrame((state) => {
		if (!lightsRef.current) return;
		// Animate pathway lights
		lightsRef.current.children.forEach((light, i) => {
			if (light instanceof THREE.PointLight) {
				light.intensity = 0.5 + Math.sin(state.clock.elapsedTime * 2 + i * 0.5) * 0.2;
			}
		});
	});
	
	return (
		<group>
			{/* Main ground */}
			<mesh
				rotation={[-Math.PI / 2, 0, 0]}
				position={[0, 0, 0]}
				receiveShadow
				name="ground"
			>
				<planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
				<meshStandardMaterial
					color="#0a0a15"
					roughness={0.85}
					metalness={0.15}
				/>
			</mesh>

			{/* Landing pad - hexagonal feel */}
			<mesh
				rotation={[-Math.PI / 2, 0, 0]}
				position={[0, 0.02, 5]}
				receiveShadow
			>
				<circleGeometry args={[8, 6]} />
				<meshStandardMaterial
					color="#15151f"
					roughness={0.7}
					metalness={0.3}
				/>
			</mesh>
			
			{/* Landing pad inner circle */}
			<mesh
				rotation={[-Math.PI / 2, 0, 0]}
				position={[0, 0.03, 5]}
			>
				<ringGeometry args={[5, 6, 32]} />
				<meshStandardMaterial
					color={THREE_COLORS.warm}
					emissive={THREE_COLORS.warm}
					emissiveIntensity={0.3}
				/>
			</mesh>
			
			{/* Landing pad center mark */}
			<mesh
				rotation={[-Math.PI / 2, 0, 0]}
				position={[0, 0.03, 5]}
			>
				<ringGeometry args={[1, 1.5, 32]} />
				<meshStandardMaterial
					color={THREE_COLORS.accent}
					emissive={THREE_COLORS.accent}
					emissiveIntensity={0.5}
				/>
			</mesh>

			{/* Path to mansion */}
			<mesh
				rotation={[-Math.PI / 2, 0, 0]}
				position={[0, 0.01, -5]}
				receiveShadow
			>
				<planeGeometry args={[5, 22]} />
				<meshStandardMaterial
					color="#12121a"
					roughness={0.75}
					metalness={0.25}
				/>
			</mesh>
			
			{/* Path edge lines */}
			{[-2.3, 2.3].map((x) => (
				<mesh
					key={x}
					rotation={[-Math.PI / 2, 0, 0]}
					position={[x, 0.02, -5]}
				>
					<planeGeometry args={[0.15, 22]} />
					<meshStandardMaterial
						color={THREE_COLORS.accent}
						emissive={THREE_COLORS.accent}
						emissiveIntensity={0.3}
					/>
				</mesh>
			))}

			{/* Pathway lights */}
			<group ref={lightsRef}>
				{[-3, 3].map((x) =>
					[0, -4, -8, -12].map((z) => (
						<group key={`${x}-${z}`} position={[x, 0, z]}>
							{/* Light post */}
							<mesh position={[0, 0.5, 0]}>
								<cylinderGeometry args={[0.1, 0.1, 1, 8]} />
								<meshStandardMaterial
									color="#2a2a3a"
									roughness={0.3}
									metalness={0.8}
								/>
							</mesh>
							{/* Light fixture */}
							<mesh position={[0, 1, 0]}>
								<sphereGeometry args={[0.2, 16, 8]} />
								<meshStandardMaterial
									color={THREE_COLORS.warm}
									emissive={THREE_COLORS.warm}
									emissiveIntensity={1}
								/>
							</mesh>
							<pointLight
								position={[0, 1.2, 0]}
								color={THREE_COLORS.warm}
								intensity={0.5}
								distance={6}
							/>
						</group>
					))
				)}
			</group>

			{/* Subtle grid overlay */}
			<gridHelper
				args={[GROUND_SIZE, 100, "#1a1a2a", "#101018"]}
				position={[0, 0.01, 0]}
				name="grid"
			/>
		</group>
	);
}

/**
 * Garage structure with improved visuals.
 */
function Garage() {
	return (
		<group position={[-25, 0, -15]}>
			<mesh position={[0, 3.5, 0]} castShadow receiveShadow>
				<boxGeometry args={[12, 7, 10]} />
				<meshStandardMaterial
					color="#181820"
					roughness={0.6}
					metalness={0.4}
				/>
			</mesh>

			{/* Garage door - with segments */}
			<mesh position={[0, 3, 5.1]}>
				<planeGeometry args={[8, 6]} />
				<meshStandardMaterial
					color="#101018"
					roughness={0.5}
					metalness={0.5}
				/>
			</mesh>
			
			{/* Door segments */}
			{[1, 2.5, 4, 5.5].map((y) => (
				<mesh key={y} position={[0, y, 5.15]}>
					<boxGeometry args={[7.5, 0.1, 0.1]} />
					<meshStandardMaterial
						color="#2a2a3a"
						roughness={0.3}
						metalness={0.8}
					/>
				</mesh>
			))}
			
			{/* Roof accent light */}
			<mesh position={[0, 7.1, 0]}>
				<boxGeometry args={[10, 0.2, 8]} />
				<meshStandardMaterial
					color={THREE_COLORS.accent}
					emissive={THREE_COLORS.accent}
					emissiveIntensity={0.2}
				/>
			</mesh>
		</group>
	);
}

// =============================================================================
// Colliders
// =============================================================================

function ExteriorColliders() {
	const garagePos: [number, number, number] = [-25, 3.5, -15];
	const garageSize: [number, number, number] = [6, 3.5, 5];

	return (
		<>
			{/* Ground */}
			<RigidBody type="fixed" position={[0, -0.25, 0]}>
				<CuboidCollider args={[GROUND_SIZE / 2, 0.25, GROUND_SIZE / 2]} />
			</RigidBody>

			{/* Mansion building */}
			<RigidBody type="fixed" position={[0, MANSION_HEIGHT / 2, -20]}>
				<CuboidCollider args={[MANSION_WIDTH / 2, MANSION_HEIGHT / 2, MANSION_DEPTH / 2]} />
			</RigidBody>

			{/* Garage structure */}
			<RigidBody type="fixed" position={garagePos}>
				<CuboidCollider args={garageSize} />
			</RigidBody>

			{/* Mech */}
			<RigidBody type="fixed" position={[25, 5, -10]}>
				<CuboidCollider args={[5, 10, 4]} />
			</RigidBody>
		</>
	);
}

// =============================================================================
// Main Component
// =============================================================================

export function ExteriorRoom({ debug = false, onDoorActivate }: ExteriorRoomProps) {
	return (
		<group name="room-exterior">
			{/* Collision bodies */}
			<ExteriorColliders />

			{/* Environment */}
			<Sky />
			<SciFiTerrain />
			<CitySilhouettes />
			<Ground />

			{/* Structures */}
			<MansionFacade />
			<Garage />
			<Mech />

			{/* Lighting */}
			<ambientLight intensity={0.15} color="#6688aa" />
			<directionalLight
				position={[30, 50, 20]}
				intensity={0.8}
				color="#aaccff"
				castShadow
				shadow-mapSize={[2048, 2048]}
				shadow-camera-far={100}
				shadow-camera-left={-50}
				shadow-camera-right={50}
				shadow-camera-top={50}
				shadow-camera-bottom={-50}
			/>
			
			{/* Fill light from opposite side */}
			<directionalLight
				position={[-20, 30, 10]}
				intensity={0.3}
				color="#ff8866"
			/>

			{/* Door to Main Hall */}
			<DoorTrigger
				position={[0, 2.5, -12.5]}
				targetRoom="mainhall"
				spawnPosition={[0, 0, 8]}
				spawnRotation={Math.PI}
				onActivate={onDoorActivate}
				debug={debug}
				label="Enter Mansion"
				labelRotation={0}
			/>

			{/* Layered atmospheric fog */}
			<fog attach="fog" args={["#050810", 30, 150]} />
		</group>
	);
}
