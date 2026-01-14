"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface AmbientParticlesProps {
	/** Number of particles */
	count?: number;
	/** Bounding box for particles [width, height, depth] */
	bounds?: [number, number, number];
	/** Particle color */
	color?: THREE.ColorRepresentation;
	/** Base size of particles */
	size?: number;
	/** Speed of drift animation */
	speed?: number;
	/** Disable animations for reduced motion */
	reducedMotion?: boolean;
}

// Deterministic pseudo-random based on seed
function seededRandom(seed: number): number {
	const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
	return x - Math.floor(x);
}

const vertexShader = /* glsl */ `
  attribute float aScale;
  attribute float aOffset;

  uniform float uTime;
  uniform float uSize;
  uniform float uSpeed;
  uniform vec3 uBounds;

  varying float vAlpha;

  void main() {
    // Animate position - gentle floating drift
    vec3 pos = position;

    // Vertical drift with wrap-around
    pos.y += mod(uTime * uSpeed * 0.1 + aOffset * uBounds.y, uBounds.y) - uBounds.y * 0.5;

    // Subtle horizontal sway
    pos.x += sin(uTime * uSpeed * 0.2 + aOffset * 6.28) * 0.3;
    pos.z += cos(uTime * uSpeed * 0.15 + aOffset * 6.28) * 0.3;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // Size attenuation based on distance
    float sizeAttenuation = 300.0 / -mvPosition.z;
    gl_PointSize = uSize * aScale * sizeAttenuation;

    // Fade based on height (brighter in middle of room)
    float heightFade = 1.0 - abs(pos.y / (uBounds.y * 0.5));
    heightFade = clamp(heightFade, 0.0, 1.0);

    // Twinkle effect
    float twinkle = sin(uTime * 2.0 + aOffset * 100.0) * 0.3 + 0.7;

    vAlpha = heightFade * twinkle;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3 uColor;

  varying float vAlpha;

  void main() {
    // Circular point with soft edge
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);

    // Soft circular falloff
    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
    alpha *= vAlpha;

    // Slight glow center
    float glow = 1.0 - smoothstep(0.0, 0.3, dist);
    vec3 color = uColor * (1.0 + glow * 0.5);

    gl_FragColor = vec4(color, alpha * 0.6);
  }
`;

interface ParticleUniforms {
	uColor: THREE.IUniform<THREE.Color>;
	uTime: THREE.IUniform<number>;
	uSize: THREE.IUniform<number>;
	uSpeed: THREE.IUniform<number>;
	uBounds: THREE.IUniform<THREE.Vector3>;
}

export function AmbientParticles({
	count = 60,
	bounds = [20, 6, 16],
	color = "#7C5CFF",
	size = 15,
	speed = 1.0,
	reducedMotion = false,
}: AmbientParticlesProps) {
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	const pointsRef = useRef<THREE.Points>(null);

	const colorVec = useMemo(() => new THREE.Color(color), [color]);

	const { positions, scales, offsets } = useMemo(() => {
		const pos = new Float32Array(count * 3);
		const scl = new Float32Array(count);
		const off = new Float32Array(count);

		for (let i = 0; i < count; i++) {
			// Deterministic random position within bounds
			pos[i * 3] = (seededRandom(i * 3) - 0.5) * bounds[0];
			pos[i * 3 + 1] = (seededRandom(i * 3 + 1) - 0.5) * bounds[1] + bounds[1] * 0.5;
			pos[i * 3 + 2] = (seededRandom(i * 3 + 2) - 0.5) * bounds[2];

			// Deterministic random scale variation
			scl[i] = 0.5 + seededRandom(i + 1000) * 1.0;

			// Deterministic random offset for animation phase
			off[i] = seededRandom(i + 2000);
		}

		return { positions: pos, scales: scl, offsets: off };
	}, [count, bounds]);

	const geometry = useMemo(() => {
		const geo = new THREE.BufferGeometry();
		geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
		geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
		geo.setAttribute("aOffset", new THREE.BufferAttribute(offsets, 1));
		return geo;
	}, [positions, scales, offsets]);

	const uniforms = useMemo(
		() => ({
			uColor: { value: new THREE.Color() },
			uTime: { value: 0 },
			uSize: { value: size },
			uSpeed: { value: speed },
			uBounds: { value: new THREE.Vector3(...bounds) },
		}),
		[size, speed, bounds]
	);

	useFrame((state) => {
		if (!materialRef.current) return;

		const u = materialRef.current.uniforms as unknown as ParticleUniforms;

		if (!u.uColor.value.equals(colorVec)) {
			u.uColor.value.copy(colorVec);
		}

		if (!reducedMotion) {
			u.uTime.value = state.clock.elapsedTime;
		}
	});

	return (
		<points ref={pointsRef} geometry={geometry} position={[0, 0, 0]}>
			<shaderMaterial
				ref={materialRef}
				vertexShader={vertexShader}
				fragmentShader={fragmentShader}
				uniforms={uniforms}
				transparent
				depthWrite={false}
				blending={THREE.AdditiveBlending}
				toneMapped={false}
			/>
		</points>
	);
}
