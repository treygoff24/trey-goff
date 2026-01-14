"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface GlowRingProps {
	/** Inner radius of the ring */
	innerRadius?: number;
	/** Outer radius of the ring */
	outerRadius?: number;
	/** Ring color */
	color?: THREE.ColorRepresentation;
	/** Intensity of the glow */
	intensity?: number;
	/** Whether the ring is active/hovered */
	isActive?: boolean;
	/** Disable animations for reduced motion */
	reducedMotion?: boolean;
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying float vAngle;

  void main() {
    vUv = uv;

    // Calculate angle for rotational effects
    vec2 centered = uv - 0.5;
    vAngle = atan(centered.y, centered.x);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uTime;
  uniform float uActive;
  uniform float uInnerRadius;
  uniform float uOuterRadius;

  varying vec2 vUv;
  varying float vAngle;

  void main() {
    // Distance from center
    vec2 centered = vUv - 0.5;
    float dist = length(centered) * 2.0;

    // Ring mask
    float ringWidth = uOuterRadius - uInnerRadius;
    float ringCenter = (uInnerRadius + uOuterRadius) * 0.5;
    float ringMask = smoothstep(uInnerRadius - 0.02, uInnerRadius + 0.02, dist)
                   * smoothstep(uOuterRadius + 0.02, uOuterRadius - 0.02, dist);

    // Soft inner edge glow
    float innerGlow = smoothstep(uInnerRadius + ringWidth * 0.3, uInnerRadius, dist);
    innerGlow *= ringMask;

    // Rotating energy segments
    float segments = 8.0;
    float rotation = uTime * 0.5;
    float angle = vAngle + rotation;
    float segmentPattern = sin(angle * segments) * 0.5 + 0.5;
    segmentPattern = pow(segmentPattern, 2.0);

    // Pulse wave traveling around ring
    float pulseAngle = mod(uTime * 1.5, 6.28318);
    float pulse = 1.0 - abs(mod(vAngle + 3.14159 - pulseAngle, 6.28318) - 3.14159) / 3.14159;
    pulse = pow(pulse, 4.0) * 0.5;

    // Combine effects
    float effect = ringMask * (0.3 + segmentPattern * 0.4 + pulse + innerGlow * 0.3);
    effect *= uIntensity;

    // Active state boost
    float activeBoost = 0.5 + uActive * 0.8;
    effect *= activeBoost;

    // HDR color output
    vec3 color = uColor * effect * 2.0;

    // Alpha with soft edges
    float alpha = effect * 0.8;

    gl_FragColor = vec4(color, alpha);
  }
`;

interface GlowRingUniforms {
	uColor: THREE.IUniform<THREE.Color>;
	uIntensity: THREE.IUniform<number>;
	uTime: THREE.IUniform<number>;
	uActive: THREE.IUniform<number>;
	uInnerRadius: THREE.IUniform<number>;
	uOuterRadius: THREE.IUniform<number>;
}

export function GlowRing({
	innerRadius = 0.9,
	outerRadius = 1.1,
	color = "#7C5CFF",
	intensity = 1.0,
	isActive = false,
	reducedMotion = false,
}: GlowRingProps) {
	const materialRef = useRef<THREE.ShaderMaterial>(null);

	const colorVec = useMemo(() => new THREE.Color(color), [color]);

	const uniforms = useMemo(
		() => ({
			uColor: { value: new THREE.Color() },
			uIntensity: { value: intensity },
			uTime: { value: 0 },
			uActive: { value: 0 },
			uInnerRadius: { value: innerRadius },
			uOuterRadius: { value: outerRadius },
		}),
		[intensity, innerRadius, outerRadius]
	);

	useFrame((state) => {
		if (!materialRef.current) return;

		const u = materialRef.current.uniforms as unknown as GlowRingUniforms;

		if (!u.uColor.value.equals(colorVec)) {
			u.uColor.value.copy(colorVec);
		}

		// Smooth active transition
		const targetActive = isActive ? 1.0 : 0.0;
		u.uActive.value += (targetActive - u.uActive.value) * 0.1;

		if (!reducedMotion) {
			u.uTime.value = state.clock.elapsedTime;
		}
	});

	// Ring size for plane (needs to cover outer radius)
	const planeSize = outerRadius * 2.2;

	return (
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
			<planeGeometry args={[planeSize, planeSize]} />
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
