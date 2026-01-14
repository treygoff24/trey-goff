/**
 * Glowing accent strips material with neon/holographic edges and pulse animation.
 * Perfect for trim, edge lighting, and accent details.
 */

import * as THREE from "three";
import { getSharedUniforms } from "./uniforms";

const vertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vViewDir = normalize(cameraPosition - worldPos.xyz);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
precision highp float;

uniform float u_time;
uniform vec3 u_accentColor;
uniform float u_intensity;
uniform float u_pulseSpeed;
uniform float u_pulseAmount;
uniform float u_glowFalloff;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  // Pulse animation
  float pulse = 0.5 + 0.5 * sin(u_time * u_pulseSpeed);
  float pulseIntensity = 1.0 - u_pulseAmount + pulse * u_pulseAmount;

  // Center glow (brightest in the middle of the strip)
  float centerDist = abs(vUv.y - 0.5) * 2.0;
  float centerGlow = 1.0 - pow(centerDist, u_glowFalloff);

  // Fresnel for edge glow
  float fresnel = pow(1.0 - max(dot(vViewDir, vNormal), 0.0), 2.0);

  // Core brightness
  float core = centerGlow * pulseIntensity * u_intensity;

  // Color with HDR-like bloom prep (values > 1.0)
  vec3 color = u_accentColor * (core * 2.0 + fresnel * 0.5);

  // Add white hot center
  float hotCenter = smoothstep(0.3, 0.0, centerDist) * pulseIntensity;
  color += vec3(hotCenter * 0.5);

  // Traveling light effect along the strip
  float travel = fract(vUv.x - u_time * 0.3);
  float travelPulse = smoothstep(0.0, 0.1, travel) * smoothstep(0.3, 0.1, travel);
  color += u_accentColor * travelPulse * 0.3 * u_intensity;

  gl_FragColor = vec4(color, 1.0);
}
`;

export interface GlowingStripOptions {
	pulseSpeed?: number;
	pulseAmount?: number;
	glowFalloff?: number;
}

/**
 * Create a glowing accent strip material.
 */
export function createGlowingStripMaterial(
	options: GlowingStripOptions = {}
): THREE.ShaderMaterial {
	const { pulseSpeed = 2.0, pulseAmount = 0.3, glowFalloff = 1.5 } = options;

	const shared = getSharedUniforms();

	const material = new THREE.ShaderMaterial({
		vertexShader,
		fragmentShader,
		uniforms: {
			u_time: shared.u_time,
			u_accentColor: shared.u_accentColor,
			u_intensity: shared.u_intensity,
			u_pulseSpeed: { value: pulseSpeed },
			u_pulseAmount: { value: pulseAmount },
			u_glowFalloff: { value: glowFalloff },
		},
		transparent: true,
		side: THREE.DoubleSide,
	});

	return material;
}
