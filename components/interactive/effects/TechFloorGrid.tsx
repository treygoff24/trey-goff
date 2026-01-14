"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface TechFloorGridProps {
	/** Width of the floor */
	width?: number;
	/** Depth of the floor */
	depth?: number;
	/** Base color of the floor */
	baseColor?: THREE.ColorRepresentation;
	/** Grid line color */
	gridColor?: THREE.ColorRepresentation;
	/** Intensity of grid lines */
	gridIntensity?: number;
	/** Size of grid cells */
	gridSize?: number;
	/** Disable animations for reduced motion */
	reducedMotion?: boolean;
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;

  void main() {
    vUv = uv;

    // World position for grid calculation
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;

    // View direction for fresnel
    vViewDir = normalize(cameraPosition - worldPos.xyz);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3 uBaseColor;
  uniform vec3 uGridColor;
  uniform float uGridIntensity;
  uniform float uGridSize;
  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;

  void main() {
    // Calculate grid lines based on world position
    vec2 gridPos = vWorldPos.xz / uGridSize;

    // Anti-aliased grid lines using derivatives
    vec2 grid = abs(fract(gridPos - 0.5) - 0.5);
    vec2 lineWidth = fwidth(gridPos) * 1.5;
    vec2 lines = smoothstep(lineWidth, vec2(0.0), grid);
    float gridLine = max(lines.x, lines.y);

    // Glow at intersections
    float intersection = lines.x * lines.y;
    float intersectionGlow = intersection * 2.0;

    // Subtle pulse on grid lines
    float pulse = sin(vWorldPos.x * 0.5 + uTime * 0.3) * 0.5 + 0.5;
    pulse = pulse * 0.1 + 0.9;

    // Fresnel for fake reflection (brighter at glancing angles)
    float fresnel = 1.0 - max(dot(vViewDir, vec3(0.0, 1.0, 0.0)), 0.0);
    fresnel = pow(fresnel, 3.0) * 0.15;

    // Distance fade - grid fades in distance
    float distFromCenter = length(vWorldPos.xz) * 0.05;
    float distFade = 1.0 - smoothstep(0.0, 1.0, distFromCenter);

    // Combine grid effects
    float gridEffect = (gridLine + intersectionGlow) * uGridIntensity * pulse * distFade;

    // Base floor color with grid overlay
    vec3 color = uBaseColor;
    color += uGridColor * gridEffect;
    color += uGridColor * fresnel;

    // Slight vignette from center
    float vignette = 1.0 - length(vUv - 0.5) * 0.3;
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
  }
`;

interface TechFloorUniforms {
	uBaseColor: THREE.IUniform<THREE.Color>;
	uGridColor: THREE.IUniform<THREE.Color>;
	uGridIntensity: THREE.IUniform<number>;
	uGridSize: THREE.IUniform<number>;
	uTime: THREE.IUniform<number>;
}

export function TechFloorGrid({
	width = 22,
	depth = 18,
	baseColor = "#0a0a12",
	gridColor = "#7C5CFF",
	gridIntensity = 0.15,
	gridSize = 2.0,
	reducedMotion = false,
}: TechFloorGridProps) {
	const materialRef = useRef<THREE.ShaderMaterial>(null);

	const baseColorVec = useMemo(() => new THREE.Color(baseColor), [baseColor]);
	const gridColorVec = useMemo(() => new THREE.Color(gridColor), [gridColor]);

	const uniforms = useMemo(
		() => ({
			uBaseColor: { value: new THREE.Color() },
			uGridColor: { value: new THREE.Color() },
			uGridIntensity: { value: gridIntensity },
			uGridSize: { value: gridSize },
			uTime: { value: 0 },
		}),
		[gridIntensity, gridSize]
	);

	useFrame((state) => {
		if (!materialRef.current) return;

		const u = materialRef.current.uniforms as unknown as TechFloorUniforms;

		if (!u.uBaseColor.value.equals(baseColorVec)) {
			u.uBaseColor.value.copy(baseColorVec);
		}
		if (!u.uGridColor.value.equals(gridColorVec)) {
			u.uGridColor.value.copy(gridColorVec);
		}

		if (!reducedMotion) {
			u.uTime.value = state.clock.elapsedTime;
		}
	});

	return (
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow name="ground">
			<planeGeometry args={[width, depth]} />
			<shaderMaterial
				ref={materialRef}
				vertexShader={vertexShader}
				fragmentShader={fragmentShader}
				uniforms={uniforms}
				toneMapped={false}
			/>
		</mesh>
	);
}
