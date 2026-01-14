/**
 * Frosted glass material with refraction hints and subtle distortion.
 * Sci-fi transparent surfaces with optional tint.
 */

import * as THREE from "three";
import { getSharedUniforms } from "./uniforms";

const vertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vReflect;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vViewDir = normalize(cameraPosition - worldPos.xyz);

  // Reflection vector for environment hints
  vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
  vReflect = reflect(-vViewDir, worldNormal);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
precision highp float;

uniform float u_time;
uniform vec3 u_accentColor;
uniform float u_intensity;
uniform vec3 u_tintColor;
uniform float u_opacity;
uniform float u_frostAmount;
uniform float u_refractionStrength;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vReflect;

// Simple hash
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Value noise
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// FBM for frost texture
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for(int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  // Frost texture
  vec2 frostUV = vUv * 20.0;
  float frost = fbm(frostUV + u_time * 0.02);

  // Fresnel for glass edge glow
  float fresnel = pow(1.0 - max(dot(vViewDir, vNormal), 0.0), 3.0);

  // Fake refraction distortion
  float distort = frost * u_refractionStrength;

  // Base glass color with tint
  vec3 glassColor = u_tintColor;

  // Add frost scatter
  float scatter = frost * u_frostAmount;
  glassColor = mix(glassColor, vec3(1.0), scatter * 0.3);

  // Edge highlight
  vec3 edgeGlow = u_accentColor * fresnel * u_intensity * 0.5;

  // Fake environment reflection (simple gradient based on reflect direction)
  float envReflect = smoothstep(-0.5, 0.5, vReflect.y);
  vec3 envColor = mix(vec3(0.05, 0.05, 0.1), vec3(0.2, 0.25, 0.3), envReflect);
  glassColor = mix(glassColor, envColor, fresnel * 0.3);

  // Combine
  vec3 color = glassColor + edgeGlow;

  // Opacity varies with frost and viewing angle
  float alpha = u_opacity + frost * u_frostAmount * 0.2 + fresnel * 0.2;
  alpha = clamp(alpha, 0.0, 1.0);

  gl_FragColor = vec4(color, alpha);
}
`;

export interface GlassOptions {
	tintColor?: string;
	opacity?: number;
	frostAmount?: number;
	refractionStrength?: number;
}

/**
 * Create a frosted glass material.
 */
export function createGlassMaterial(
	options: GlassOptions = {}
): THREE.ShaderMaterial {
	const {
		tintColor = "#a8d8ea",
		opacity = 0.3,
		frostAmount = 0.4,
		refractionStrength = 0.05,
	} = options;

	const shared = getSharedUniforms();

	const material = new THREE.ShaderMaterial({
		vertexShader,
		fragmentShader,
		uniforms: {
			u_time: shared.u_time,
			u_accentColor: shared.u_accentColor,
			u_intensity: shared.u_intensity,
			u_tintColor: { value: new THREE.Color(tintColor) },
			u_opacity: { value: opacity },
			u_frostAmount: { value: frostAmount },
			u_refractionStrength: { value: refractionStrength },
		},
		transparent: true,
		side: THREE.DoubleSide,
		depthWrite: false,
	});

	return material;
}
