"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { THREE_COLORS } from "@/lib/interactive/colors";
import { DoorTrigger } from "../DoorTrigger";
import type { RoomId } from "@/lib/interactive/types";
import type {
	LiftName,
	LiftRecord,
	LiftsManifest,
	LiftsManifestEntry,
} from "@/lib/interactive/manifest-types";

// =============================================================================
// Types
// =============================================================================

interface GymRoomProps {
	/** Show debug visualizations */
	debug?: boolean;
	/** Callback when door is activated */
	onDoorActivate?: (targetRoom: RoomId, spawnPosition: [number, number, number], spawnRotation: number) => void;
}

// =============================================================================
// Constants
// =============================================================================

const ROOM_WIDTH = 20;
const ROOM_DEPTH = 18;
const ROOM_HEIGHT = 6;

// Standard plate weights (lb)
const PLATE_WEIGHTS = [45, 35, 25, 10, 5, 2.5] as const;
const BAR_WEIGHT = 45;

// Plate colors - competition style
const PLATE_COLORS: Record<number, string> = {
	45: "#e53e3e",  // Red
	35: "#f6e05e",  // Yellow
	25: "#48bb78",  // Green
	10: "#4299e1",  // Blue
	5: "#a0aec0",   // White/Gray
	2.5: "#a0aec0", // White/Gray
};

// Lift display names
const LIFT_NAMES: Record<LiftName, string> = {
	squat: "SQUAT",
	bench: "BENCH",
	deadlift: "DEADLIFT",
};

// =============================================================================
// Shaders
// =============================================================================

// Rubber floor mat shader with grid lines
const floorVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  
  void main() {
    vUv = uv;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const floorFragmentShader = /* glsl */ `
  precision highp float;
  
  varying vec2 vUv;
  varying vec3 vWorldPos;
  
  uniform vec3 uBaseColor;
  uniform vec3 uGridColor;
  uniform float uGridScale;
  uniform float uGridWidth;
  
  void main() {
    // Create grid pattern based on world position
    vec2 grid = abs(fract(vWorldPos.xz * uGridScale) - 0.5);
    float gridLine = 1.0 - step(uGridWidth, min(grid.x, grid.y));
    
    // Subtle noise-like variation using world position
    float variation = sin(vWorldPos.x * 3.0) * sin(vWorldPos.z * 3.0) * 0.02;
    
    // Mix base color with grid lines
    vec3 color = mix(uBaseColor + variation, uGridColor, gridLine * 0.3);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Metallic equipment shader with fresnel
const metalVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const metalFragmentShader = /* glsl */ `
  precision highp float;
  
  uniform vec3 uColor;
  uniform float uMetalness;
  uniform float uRoughness;
  
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;
  
  void main() {
    // Fresnel effect for metallic sheen
    float fresnel = pow(1.0 - max(dot(vViewDir, vNormal), 0.0), 3.0);
    
    // Simple lighting
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
    float NdotL = max(dot(vNormal, lightDir), 0.0);
    float diffuse = mix(0.3, 1.0, NdotL);
    
    // Specular highlight
    vec3 halfDir = normalize(lightDir + vViewDir);
    float spec = pow(max(dot(vNormal, halfDir), 0.0), mix(8.0, 64.0, 1.0 - uRoughness));
    
    // Combine
    vec3 color = uColor * diffuse;
    color += vec3(1.0) * spec * uMetalness * 0.5;
    color += fresnel * uMetalness * 0.15;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Glowing plaque shader
const plaqueVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const plaqueFragmentShader = /* glsl */ `
  precision highp float;
  
  uniform vec3 uBaseColor;
  uniform vec3 uGlowColor;
  uniform float uTime;
  uniform float uGlowIntensity;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  
  void main() {
    // Edge glow (fresnel)
    float fresnel = pow(1.0 - max(dot(vViewDir, vNormal), 0.0), 2.5);
    
    // Breathing pulse
    float pulse = 0.8 + 0.2 * sin(uTime * 1.5);
    
    // Border glow effect
    float border = smoothstep(0.0, 0.1, vUv.x) * smoothstep(0.0, 0.1, 1.0 - vUv.x);
    border *= smoothstep(0.0, 0.1, vUv.y) * smoothstep(0.0, 0.1, 1.0 - vUv.y);
    float edgeGlow = 1.0 - border;
    
    // Combine effects
    vec3 color = uBaseColor;
    color += uGlowColor * fresnel * uGlowIntensity * pulse;
    color += uGlowColor * edgeGlow * 0.5 * pulse;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Calculate plates needed for a given weight.
 * Returns an array of plate weights (for one side of the bar).
 */
function calculatePlates(weight: number): number[] {
	if (weight <= BAR_WEIGHT) return [];

	const plates: number[] = [];
	let remaining = (weight - BAR_WEIGHT) / 2;

	for (const plateWeight of PLATE_WEIGHTS) {
		while (remaining >= plateWeight) {
			plates.push(plateWeight);
			remaining -= plateWeight;
		}
	}

	return plates;
}

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Gym floor with rubber mat grid pattern shader.
 */
function Floor() {
	const materialRef = useRef<THREE.ShaderMaterial>(null);

	const uniforms = useMemo(() => ({
		uBaseColor: { value: new THREE.Color("#1a1a1a") },
		uGridColor: { value: new THREE.Color("#2a2a2a") },
		uGridScale: { value: 0.5 },
		uGridWidth: { value: 0.48 },
	}), []);

	return (
		<mesh
			rotation={[-Math.PI / 2, 0, 0]}
			position={[0, 0, 0]}
			receiveShadow
			name="ground"
		>
			<planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
			<shaderMaterial
				ref={materialRef}
				vertexShader={floorVertexShader}
				fragmentShader={floorFragmentShader}
				uniforms={uniforms}
			/>
		</mesh>
	);
}

/**
 * Gym walls with industrial concrete texture.
 */
function Walls() {
	return (
		<group>
			{/* Back wall */}
			<mesh position={[0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2]} receiveShadow>
				<boxGeometry args={[ROOM_WIDTH, ROOM_HEIGHT, 0.3]} />
				<meshStandardMaterial color="#2d3748" roughness={0.85} metalness={0.1} />
			</mesh>

			{/* Front wall */}
			<mesh position={[0, ROOM_HEIGHT / 2, ROOM_DEPTH / 2]} receiveShadow>
				<boxGeometry args={[ROOM_WIDTH, ROOM_HEIGHT, 0.3]} />
				<meshStandardMaterial color="#2d3748" roughness={0.85} metalness={0.1} />
			</mesh>

			{/* Left wall (door from main hall) */}
			<mesh position={[-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]} receiveShadow>
				<boxGeometry args={[0.3, ROOM_HEIGHT, ROOM_DEPTH]} />
				<meshStandardMaterial color="#2d3748" roughness={0.85} metalness={0.1} />
			</mesh>

			{/* Right wall */}
			<mesh position={[ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]} receiveShadow>
				<boxGeometry args={[0.3, ROOM_HEIGHT, ROOM_DEPTH]} />
				<meshStandardMaterial color="#2d3748" roughness={0.85} metalness={0.1} />
			</mesh>

			{/* Wall trim strips */}
			{[-ROOM_DEPTH / 2 + 0.2, ROOM_DEPTH / 2 - 0.2].map((z, i) => (
				<mesh key={`trim-${i}`} position={[0, 0.1, z]}>
					<boxGeometry args={[ROOM_WIDTH - 0.6, 0.2, 0.1]} />
					<meshStandardMaterial color={THREE_COLORS.warm} metalness={0.7} roughness={0.3} />
				</mesh>
			))}
		</group>
	);
}

/**
 * Industrial ceiling with exposed beams.
 */
function Ceiling() {
	return (
		<group>
			<mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_HEIGHT, 0]}>
				<planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
				<meshStandardMaterial color="#1a202c" roughness={0.9} metalness={0.1} />
			</mesh>

			{/* Exposed ceiling beams */}
			{[-6, 0, 6].map((x, i) => (
				<mesh key={`beam-${i}`} position={[x, ROOM_HEIGHT - 0.15, 0]}>
					<boxGeometry args={[0.3, 0.3, ROOM_DEPTH - 0.5]} />
					<meshStandardMaterial color="#1f2937" roughness={0.6} metalness={0.4} />
				</mesh>
			))}
		</group>
	);
}

/**
 * A single plate on a barbell with enhanced visuals.
 */
function Plate({
	weight,
	position,
	rotation = 0,
}: {
	weight: number;
	position: [number, number, number];
	rotation?: number;
}) {
	const radius = weight >= 45 ? 0.45 : weight >= 25 ? 0.35 : 0.25;
	const thickness = weight >= 35 ? 0.05 : 0.03;

	return (
		<group position={position} rotation={[0, 0, rotation]}>
			{/* Main plate */}
			<mesh>
				<cylinderGeometry args={[radius, radius, thickness, 32]} />
				<meshStandardMaterial
					color={PLATE_COLORS[weight] ?? "#718096"}
					roughness={0.4}
					metalness={0.2}
				/>
			</mesh>
			{/* Center hub */}
			<mesh>
				<cylinderGeometry args={[0.03, 0.03, thickness + 0.01, 16]} />
				<meshStandardMaterial color="#555" roughness={0.3} metalness={0.8} />
			</mesh>
		</group>
	);
}

/**
 * Barbell with metallic shader and loaded plates.
 */
function Barbell({
	weight,
	position,
	rotation = 0,
}: {
	weight: number;
	position: [number, number, number];
	rotation?: number;
}) {
	const plates = useMemo(() => calculatePlates(weight), [weight]);
	const barLength = 2.2;
	const sleeveLength = 0.4;
	const materialRef = useRef<THREE.ShaderMaterial>(null);

	const metalUniforms = useMemo(() => ({
		uColor: { value: new THREE.Color("#c0c0c0") },
		uMetalness: { value: 0.9 },
		uRoughness: { value: 0.25 },
	}), []);

	return (
		<group position={position} rotation={[0, rotation, 0]}>
			{/* Main bar with custom metal shader */}
			<mesh rotation={[0, 0, Math.PI / 2]}>
				<cylinderGeometry args={[0.025, 0.025, barLength, 16]} />
				<shaderMaterial
					ref={materialRef}
					vertexShader={metalVertexShader}
					fragmentShader={metalFragmentShader}
					uniforms={metalUniforms}
				/>
			</mesh>

			{/* Knurling section (center grip) */}
			<mesh rotation={[0, 0, Math.PI / 2]}>
				<cylinderGeometry args={[0.027, 0.027, 1.3, 16]} />
				<meshStandardMaterial color="#888" roughness={0.7} metalness={0.6} />
			</mesh>

			{/* Left sleeve */}
			<mesh position={[-(barLength / 2 + sleeveLength / 2), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
				<cylinderGeometry args={[0.025, 0.025, sleeveLength, 16]} />
				<meshStandardMaterial color="#718096" roughness={0.4} metalness={0.7} />
			</mesh>

			{/* Right sleeve */}
			<mesh position={[(barLength / 2 + sleeveLength / 2), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
				<cylinderGeometry args={[0.025, 0.025, sleeveLength, 16]} />
				<meshStandardMaterial color="#718096" roughness={0.4} metalness={0.7} />
			</mesh>

			{/* Plates - left side */}
			{plates.map((plateWeight, i) => {
				const offset = 0.06 + i * 0.08;
				return (
					<Plate
						key={`left-${i}`}
						weight={plateWeight}
						position={[-(barLength / 2 + offset), 0, 0]}
						rotation={Math.PI / 2}
					/>
				);
			})}

			{/* Plates - right side (mirror) */}
			{plates.map((plateWeight, i) => {
				const offset = 0.06 + i * 0.08;
				return (
					<Plate
						key={`right-${i}`}
						weight={plateWeight}
						position={[(barLength / 2 + offset), 0, 0]}
						rotation={Math.PI / 2}
					/>
				);
			})}
		</group>
	);
}

/**
 * Squat rack with enhanced metal materials.
 */
function SquatRack({
	weight,
	position,
}: {
	weight: number;
	position: [number, number, number];
}) {
	return (
		<group position={position}>
			{/* Main uprights */}
			{[-0.6, 0.6].map((x, i) => (
				<mesh key={`upright-${i}`} position={[x, 1.1, 0]} castShadow>
					<boxGeometry args={[0.1, 2.2, 0.15]} />
					<meshStandardMaterial color="#1f2937" roughness={0.4} metalness={0.7} />
				</mesh>
			))}

			{/* Cross beam at top */}
			<mesh position={[0, 2.15, 0]} castShadow>
				<boxGeometry args={[1.3, 0.08, 0.1]} />
				<meshStandardMaterial color="#1f2937" roughness={0.4} metalness={0.7} />
			</mesh>

			{/* J-hooks with detail */}
			{[-0.55, 0.55].map((x, i) => (
				<group key={`jhook-${i}`} position={[x, 1.4, 0.08]}>
					<mesh>
						<boxGeometry args={[0.08, 0.06, 0.12]} />
						<meshStandardMaterial color="#4a5568" roughness={0.35} metalness={0.8} />
					</mesh>
					{/* Hook lip */}
					<mesh position={[0, -0.04, 0.05]}>
						<boxGeometry args={[0.08, 0.02, 0.02]} />
						<meshStandardMaterial color="#4a5568" roughness={0.35} metalness={0.8} />
					</mesh>
				</group>
			))}

			{/* Safety pins */}
			{[-0.55, 0.55].map((x, i) => (
				<mesh key={`safety-${i}`} position={[x, 0.8, 0.08]}>
					<boxGeometry args={[0.08, 0.04, 0.4]} />
					<meshStandardMaterial color={THREE_COLORS.warm} roughness={0.4} metalness={0.6} />
				</mesh>
			))}

			{/* Base plates */}
			{[-0.6, 0.6].map((x, i) => (
				<mesh key={`base-${i}`} position={[x, 0.02, 0]}>
					<boxGeometry args={[0.2, 0.04, 0.4]} />
					<meshStandardMaterial color="#1f2937" roughness={0.5} metalness={0.6} />
				</mesh>
			))}

			{/* Barbell */}
			<Barbell weight={weight} position={[0, 1.4, 0.08]} />
		</group>
	);
}

/**
 * Bench press station with enhanced visuals.
 */
function BenchStation({
	weight,
	position,
}: {
	weight: number;
	position: [number, number, number];
}) {
	return (
		<group position={position}>
			{/* Bench pad */}
			<mesh position={[0, 0.28, 0.3]} castShadow>
				<boxGeometry args={[0.35, 0.08, 1.1]} />
				<meshStandardMaterial color="#1a1a1a" roughness={0.9} metalness={0.05} />
			</mesh>

			{/* Bench frame */}
			<mesh position={[0, 0.12, 0.3]} castShadow>
				<boxGeometry args={[0.25, 0.24, 1.0]} />
				<meshStandardMaterial color="#374151" roughness={0.5} metalness={0.6} />
			</mesh>

			{/* Bench supports */}
			{[-0.12, 0.12].map((x, i) => (
				<mesh key={`support-${i}`} position={[x, 0.1, i === 0 ? 0 : 0.6]} castShadow>
					<boxGeometry args={[0.06, 0.2, 0.06]} />
					<meshStandardMaterial color="#4a5568" roughness={0.5} metalness={0.6} />
				</mesh>
			))}

			{/* Uprights */}
			{[-0.55, 0.55].map((x, i) => (
				<mesh key={`upright-${i}`} position={[x, 0.6, -0.3]} castShadow>
					<boxGeometry args={[0.08, 1.2, 0.1]} />
					<meshStandardMaterial color="#1f2937" roughness={0.4} metalness={0.7} />
				</mesh>
			))}

			{/* Cross beam */}
			<mesh position={[0, 1.15, -0.3]} castShadow>
				<boxGeometry args={[1.2, 0.06, 0.08]} />
				<meshStandardMaterial color="#1f2937" roughness={0.4} metalness={0.7} />
			</mesh>

			{/* J-hooks */}
			{[-0.5, 0.5].map((x, i) => (
				<mesh key={`jhook-${i}`} position={[x, 1.0, -0.22]}>
					<boxGeometry args={[0.08, 0.05, 0.1]} />
					<meshStandardMaterial color="#4a5568" roughness={0.35} metalness={0.8} />
				</mesh>
			))}

			{/* Barbell */}
			<Barbell weight={weight} position={[0, 1.0, -0.3]} />
		</group>
	);
}

/**
 * Deadlift platform with enhanced wood/rubber look.
 */
function DeadliftPlatform({
	weight,
	position,
}: {
	weight: number;
	position: [number, number, number];
}) {
	return (
		<group position={position}>
			{/* Center wood section */}
			<mesh position={[0, 0.025, 0]} receiveShadow>
				<boxGeometry args={[1.2, 0.05, 1.5]} />
				<meshStandardMaterial color="#5c4033" roughness={0.75} metalness={0.05} />
			</mesh>

			{/* Rubber side sections */}
			{[-0.85, 0.85].map((x, i) => (
				<mesh key={`rubber-${i}`} position={[x, 0.025, 0]} receiveShadow>
					<boxGeometry args={[0.5, 0.05, 1.5]} />
					<meshStandardMaterial color="#1a1a1a" roughness={0.9} metalness={0.05} />
				</mesh>
			))}

			{/* Platform border */}
			<mesh position={[0, 0.01, 0]}>
				<boxGeometry args={[2.5, 0.02, 1.55]} />
				<meshStandardMaterial color="#374151" roughness={0.5} metalness={0.5} />
			</mesh>

			{/* Barbell on ground (plate radius raises it) */}
			<Barbell weight={weight} position={[0, 0.48, 0]} />
		</group>
	);
}

/**
 * PR Plaque with animated glow shader and text.
 */
function PRPlaque({
	lift,
	pr,
	position,
}: {
	lift: LiftName;
	pr: LiftRecord;
	position: [number, number, number];
}) {
	const meshRef = useRef<THREE.Mesh>(null);
	const materialRef = useRef<THREE.ShaderMaterial>(null);

	const uniforms = useMemo(() => ({
		uBaseColor: { value: new THREE.Color("#1a202c") },
		uGlowColor: { value: new THREE.Color(THREE_COLORS.accent) },
		uTime: { value: 0 },
		uGlowIntensity: { value: 0.8 },
	}), []);

	// Subtle float + glow animation
	useFrame((state) => {
		if (meshRef.current) {
			meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
		}
		if (materialRef.current?.uniforms.uTime) {
			materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
		}
	});

	const dateStr = new Date(pr.date).toLocaleDateString("en-US", {
		month: "short",
		year: "numeric",
	});

	return (
		<group position={position}>
			{/* Plaque background with glow shader */}
			<mesh ref={meshRef} castShadow>
				<boxGeometry args={[1.8, 1.4, 0.1]} />
				<shaderMaterial
					ref={materialRef}
					vertexShader={plaqueVertexShader}
					fragmentShader={plaqueFragmentShader}
					uniforms={uniforms}
				/>
			</mesh>

			{/* Lift name */}
			<Text
				position={[0, 0.45, 0.06]}
				fontSize={0.18}
				color={THREE_COLORS.warm}
				anchorX="center"
				anchorY="middle"
				font="/fonts/inter-bold.woff"
			>
				{LIFT_NAMES[lift]}
			</Text>

			{/* Weight display */}
			<Text
				position={[0, 0, 0.06]}
				fontSize={0.35}
				color="#ffffff"
				anchorX="center"
				anchorY="middle"
				font="/fonts/inter-bold.woff"
			>
				{pr.weight} LB
			</Text>

			{/* Date */}
			<Text
				position={[0, -0.45, 0.06]}
				fontSize={0.12}
				color={THREE_COLORS.accent}
				anchorX="center"
				anchorY="middle"
				font="/fonts/inter-regular.woff"
			>
				{dateStr}
			</Text>

			{/* Glow light behind */}
			<pointLight
				position={[0, 0, 0.5]}
				intensity={0.3}
				color={THREE_COLORS.accent}
				distance={2.5}
				decay={2}
			/>
		</group>
	);
}

/**
 * Wall of PR plaques with title.
 */
function PlaqueWall({
	lifts,
	total,
}: {
	lifts: LiftsManifestEntry[];
	total: LiftRecord;
}) {
	const squat = lifts.find((l) => l.lift === "squat");
	const bench = lifts.find((l) => l.lift === "bench");
	const deadlift = lifts.find((l) => l.lift === "deadlift");

	return (
		<group position={[0, 2.5, -ROOM_DEPTH / 2 + 0.5]}>
			{/* Title bar */}
			<mesh position={[0, 1.4, 0]} castShadow>
				<boxGeometry args={[7, 0.5, 0.1]} />
				<meshStandardMaterial
					color={THREE_COLORS.warm}
					roughness={0.35}
					metalness={0.7}
					emissive={THREE_COLORS.warm}
					emissiveIntensity={0.25}
				/>
			</mesh>

			{/* Title text */}
			<Text
				position={[0, 1.4, 0.06]}
				fontSize={0.25}
				color="#0B1020"
				anchorX="center"
				anchorY="middle"
				font="/fonts/inter-bold.woff"
			>
				PERSONAL RECORDS
			</Text>

			{/* Individual lift plaques */}
			{squat && (
				<PRPlaque lift={squat.lift} pr={squat.pr} position={[-2.5, 0, 0]} />
			)}
			{bench && (
				<PRPlaque lift={bench.lift} pr={bench.pr} position={[0, 0, 0]} />
			)}
			{deadlift && (
				<PRPlaque lift={deadlift.lift} pr={deadlift.pr} position={[2.5, 0, 0]} />
			)}

			{/* Total plaque */}
			<group position={[0, -1.6, 0]}>
				<mesh castShadow>
					<boxGeometry args={[3.5, 0.7, 0.1]} />
					<meshStandardMaterial
						color={THREE_COLORS.accent}
						roughness={0.3}
						metalness={0.75}
						emissive={THREE_COLORS.accent}
						emissiveIntensity={0.35}
					/>
				</mesh>
				<Text
					position={[0, 0.1, 0.06]}
					fontSize={0.14}
					color="#ffffff"
					anchorX="center"
					anchorY="middle"
					font="/fonts/inter-bold.woff"
				>
					TOTAL
				</Text>
				<Text
					position={[0, -0.15, 0.06]}
					fontSize={0.22}
					color="#ffffff"
					anchorX="center"
					anchorY="middle"
					font="/fonts/inter-bold.woff"
				>
					{total.weight} LB
				</Text>
			</group>
		</group>
	);
}

/**
 * Industrial lighting fixtures.
 */
function LightingFixtures() {
	return (
		<group>
			{/* Overhead pendant lights */}
			{[-5, 0, 5].map((x, i) => (
				<group key={`light-${i}`} position={[x, ROOM_HEIGHT - 0.3, 0]}>
					{/* Fixture housing */}
					<mesh>
						<cylinderGeometry args={[0.3, 0.4, 0.3, 8]} />
						<meshStandardMaterial color="#374151" roughness={0.5} metalness={0.7} />
					</mesh>
					{/* Light bulb area */}
					<mesh position={[0, -0.2, 0]}>
						<cylinderGeometry args={[0.25, 0.25, 0.1, 16]} />
						<meshStandardMaterial
							color="#ffffff"
							emissive="#ffffff"
							emissiveIntensity={0.5}
						/>
					</mesh>
				</group>
			))}
		</group>
	);
}

/**
 * Gym logo/branding on wall.
 */
function GymBranding() {
	return (
		<group position={[ROOM_WIDTH / 2 - 0.2, 4, 0]} rotation={[0, -Math.PI / 2, 0]}>
			{/* Logo background */}
			<mesh>
				<circleGeometry args={[1.2, 32]} />
				<meshStandardMaterial
					color="#1a1a1a"
					roughness={0.8}
					metalness={0.2}
				/>
			</mesh>
			{/* Logo ring */}
			<mesh position={[0, 0, 0.01]}>
				<ringGeometry args={[0.9, 1.1, 32]} />
				<meshStandardMaterial
					color={THREE_COLORS.warm}
					emissive={THREE_COLORS.warm}
					emissiveIntensity={0.3}
					roughness={0.4}
					metalness={0.6}
				/>
			</mesh>
			{/* Logo text */}
			<Text
				position={[0, 0, 0.02]}
				fontSize={0.35}
				color={THREE_COLORS.warm}
				anchorX="center"
				anchorY="middle"
				font="/fonts/inter-bold.woff"
			>
				GYM
			</Text>
		</group>
	);
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Collision bodies for gym.
 */
function GymColliders() {
	const wallThickness = 0.5;
	const wallHeight = ROOM_HEIGHT;

	return (
		<>
			{/* Floor */}
			<RigidBody type="fixed" position={[0, -0.25, 0]}>
				<CuboidCollider args={[ROOM_WIDTH / 2, 0.25, ROOM_DEPTH / 2]} />
			</RigidBody>

			{/* Walls */}
			<RigidBody type="fixed" position={[0, wallHeight / 2, -ROOM_DEPTH / 2 - wallThickness / 2]}>
				<CuboidCollider args={[ROOM_WIDTH / 2, wallHeight / 2, wallThickness / 2]} />
			</RigidBody>
			<RigidBody type="fixed" position={[0, wallHeight / 2, ROOM_DEPTH / 2 + wallThickness / 2]}>
				<CuboidCollider args={[ROOM_WIDTH / 2, wallHeight / 2, wallThickness / 2]} />
			</RigidBody>
			<RigidBody type="fixed" position={[-ROOM_WIDTH / 2 - wallThickness / 2, wallHeight / 2, 0]}>
				<CuboidCollider args={[wallThickness / 2, wallHeight / 2, ROOM_DEPTH / 2]} />
			</RigidBody>
			<RigidBody type="fixed" position={[ROOM_WIDTH / 2 + wallThickness / 2, wallHeight / 2, 0]}>
				<CuboidCollider args={[wallThickness / 2, wallHeight / 2, ROOM_DEPTH / 2]} />
			</RigidBody>

			{/* Equipment colliders */}
			<RigidBody type="fixed" position={[-5, 1.5, 0]}>
				<CuboidCollider args={[1.5, 1.5, 1]} />
			</RigidBody>
			<RigidBody type="fixed" position={[0, 0.5, 2]}>
				<CuboidCollider args={[1, 0.5, 1.5]} />
			</RigidBody>
			<RigidBody type="fixed" position={[5, 0.15, 0]}>
				<CuboidCollider args={[1.5, 0.15, 2]} />
			</RigidBody>
		</>
	);
}

/**
 * GymRoom - Displays powerlifting PRs with enhanced visuals.
 */
export function GymRoom({ debug = false, onDoorActivate }: GymRoomProps) {
	const [liftsData, setLiftsData] = useState<LiftsManifest | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const controller = new AbortController();

		async function loadLifts() {
			try {
				const response = await fetch("/manifests/lifts.manifest.json", {
					signal: controller.signal,
				});
				const manifest: LiftsManifest = await response.json();
				setLiftsData(manifest);
			} catch (error) {
				if (error instanceof Error && error.name === "AbortError") return;
				console.error("[GymRoom] Failed to load lifts manifest:", error);
			} finally {
				setLoading(false);
			}
		}

		loadLifts();
		return () => controller.abort();
	}, []);

	const squatPR = liftsData?.lifts.find((l) => l.lift === "squat")?.pr.weight ?? 135;
	const benchPR = liftsData?.lifts.find((l) => l.lift === "bench")?.pr.weight ?? 135;
	const deadliftPR = liftsData?.lifts.find((l) => l.lift === "deadlift")?.pr.weight ?? 135;

	return (
		<group name="room-gym">
			{/* Collision bodies */}
			<GymColliders />

			{/* Structure */}
			<Floor />
			<Walls />
			<Ceiling />

			{/* Lighting fixtures */}
			<LightingFixtures />

			{/* Gym branding */}
			<GymBranding />

			{/* Equipment stations */}
			<SquatRack weight={squatPR} position={[-5, 0, 0]} />
			<BenchStation weight={benchPR} position={[0, 0, 2]} />
			<DeadliftPlatform weight={deadliftPR} position={[5, 0, 0]} />

			{/* PR Wall */}
			{!loading && liftsData && (
				<PlaqueWall lifts={liftsData.lifts} total={liftsData.total} />
			)}

			{/* Door to Main Hall */}
			<DoorTrigger
				position={[-ROOM_WIDTH / 2 + 1, 2, 0]}
				targetRoom="mainhall"
				spawnPosition={[7, 0, 0]}
				spawnRotation={Math.PI / 2}
				onActivate={onDoorActivate}
				debug={debug}
				label="Main Hall"
				labelRotation={Math.PI / 2}
			/>

			{/* Door frame */}
			<group position={[-ROOM_WIDTH / 2 + 0.15, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
				<mesh>
					<boxGeometry args={[3.5, 4.5, 0.3]} />
					<meshStandardMaterial
						color={THREE_COLORS.warm}
						roughness={0.4}
						metalness={0.6}
						emissive={THREE_COLORS.warm}
						emissiveIntensity={0.1}
					/>
				</mesh>
				<mesh position={[0, 0, -0.1]}>
					<boxGeometry args={[2.5, 4, 0.2]} />
					<meshBasicMaterial color="#050510" />
				</mesh>
			</group>

			{/* Industrial lighting */}
			<ambientLight intensity={0.12} color="#ffffff" />

			{/* Overhead point lights */}
			{[-5, 0, 5].map((x, i) => (
				<pointLight
					key={`overhead-${i}`}
					position={[x, ROOM_HEIGHT - 0.5, 0]}
					intensity={0.7}
					color="#ffffff"
					distance={12}
					decay={2}
					castShadow
				/>
			))}

			{/* Accent spotlight on PR wall */}
			<spotLight
				position={[0, 5, -4]}
				angle={0.5}
				penumbra={0.6}
				intensity={0.6}
				color={THREE_COLORS.warm}
				target-position={[0, 2.5, -ROOM_DEPTH / 2]}
				castShadow
			/>

			{/* Accent lights on equipment */}
			{[[-5, 2.5, 1], [0, 2.5, 3], [5, 2.5, 1]].map((pos, i) => (
				<pointLight
					key={`accent-${i}`}
					position={pos as [number, number, number]}
					intensity={0.2}
					color={THREE_COLORS.accent}
					distance={5}
					decay={2}
				/>
			))}
		</group>
	);
}
