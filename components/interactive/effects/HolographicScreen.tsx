"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface HolographicScreenProps {
	/** Base color of the hologram */
	color?: THREE.ColorRepresentation;
	/** Intensity of the glow effect */
	intensity?: number;
	/** Width of the screen */
	width?: number;
	/** Height of the screen */
	height?: number;
	/** Whether the screen is hovered/active */
	isActive?: boolean;
	/** Disable animations for reduced motion */
	reducedMotion?: boolean;
}

const vertexShader = /* glsl */ `
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

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uTime;
  uniform float uActive;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  // Simple hash function for pseudo-random noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    // Scan lines - horizontal moving lines
    float scanLine = sin(vUv.y * 80.0 - uTime * 2.0) * 0.5 + 0.5;
    scanLine = pow(scanLine, 8.0) * 0.15;

    // Horizontal scan sweep (moves down the screen periodically)
    float sweep = mod(uTime * 0.3, 1.4) - 0.2;
    float sweepLine = smoothstep(sweep - 0.02, sweep, vUv.y) - smoothstep(sweep, sweep + 0.02, vUv.y);
    sweepLine *= 0.3;

    // Edge glow (fresnel-like at UV borders)
    float edgeX = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
    float edgeY = smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
    float edgeGlow = 1.0 - (edgeX * edgeY);
    edgeGlow = pow(edgeGlow, 2.0) * 0.4;

    // Subtle noise/static
    float noise = hash(vUv * 100.0 + uTime) * 0.03;

    // View-dependent fresnel for 3D effect
    float fresnel = 1.0 - max(dot(vViewDir, vNormal), 0.0);
    fresnel = pow(fresnel, 3.0) * 0.2;

    // Base glow - center is brighter
    float centerGlow = 1.0 - length(vUv - 0.5) * 0.8;
    centerGlow = clamp(centerGlow, 0.0, 1.0);

    // Breathing pulse
    float pulse = 1.0 + sin(uTime * 1.5) * 0.08;

    // Combine effects
    float intensity = (centerGlow + scanLine + sweepLine + edgeGlow + noise + fresnel) * uIntensity * pulse;

    // Active state boost
    intensity *= 0.6 + uActive * 0.6;

    // HDR output for bloom
    vec3 color = uColor * intensity * 1.8;

    // Alpha for soft edges
    float alpha = clamp(intensity * 1.2, 0.0, 0.95);

    gl_FragColor = vec4(color, alpha);
  }
`;

interface HolographicUniforms {
	uColor: THREE.IUniform<THREE.Color>;
	uIntensity: THREE.IUniform<number>;
	uTime: THREE.IUniform<number>;
	uActive: THREE.IUniform<number>;
}

export function HolographicScreen({
	color = "#7C5CFF",
	intensity = 1.0,
	width = 1.2,
	height = 0.8,
	isActive = false,
	reducedMotion = false,
}: HolographicScreenProps) {
	const materialRef = useRef<THREE.ShaderMaterial>(null);

	const colorVec = useMemo(() => new THREE.Color(color), [color]);

	const uniforms = useMemo(
		() => ({
			uColor: { value: new THREE.Color() },
			uIntensity: { value: 1.0 },
			uTime: { value: 0 },
			uActive: { value: 0 },
		}),
		[]
	);

	useFrame((state) => {
		if (!materialRef.current) return;

		const u = materialRef.current.uniforms as unknown as HolographicUniforms;

		if (!u.uColor.value.equals(colorVec)) {
			u.uColor.value.copy(colorVec);
		}

		u.uIntensity.value = intensity;

		// Smooth active transition
		const targetActive = isActive ? 1.0 : 0.0;
		u.uActive.value += (targetActive - u.uActive.value) * 0.1;

		// Only animate if not reduced motion
		if (!reducedMotion) {
			u.uTime.value = state.clock.elapsedTime;
		}
	});

	return (
		<mesh>
			<planeGeometry args={[width, height]} />
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
	);
}
