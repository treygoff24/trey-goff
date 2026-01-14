/**
 * Holographic display material with animated scan lines and data visualization look.
 * Perfect for screens, interfaces, and futuristic displays.
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
uniform float u_scanLineSpeed;
uniform float u_scanLineDensity;
uniform float u_flickerAmount;
uniform float u_glitchAmount;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;

// Hash functions
float hash(float n) {
  return fract(sin(n) * 43758.5453);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Simple noise
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

void main() {
  vec2 uv = vUv;

  // Glitch offset (occasional horizontal displacement)
  float glitchTime = floor(u_time * 10.0);
  float glitchRand = hash(glitchTime);
  if (glitchRand > 0.95 && u_glitchAmount > 0.0) {
    float glitchY = hash(glitchTime + 1.0);
    if (abs(uv.y - glitchY) < 0.02) {
      uv.x += (hash(uv.y + glitchTime) - 0.5) * 0.1 * u_glitchAmount;
    }
  }

  // Scan lines (horizontal)
  float scanLine = sin(uv.y * u_scanLineDensity + u_time * u_scanLineSpeed);
  scanLine = scanLine * 0.5 + 0.5;
  scanLine = pow(scanLine, 0.5);

  // Traveling scan bar
  float scanBar = fract(u_time * 0.2);
  float barDist = abs(uv.y - scanBar);
  float bar = smoothstep(0.02, 0.0, barDist);

  // Base hologram color
  vec3 holoColor = u_accentColor;

  // Add subtle color separation (chromatic aberration hint)
  float offset = 0.002;
  vec3 colorShift = vec3(
    smoothstep(0.0, 0.3, uv.x - offset),
    1.0,
    smoothstep(1.0, 0.7, uv.x + offset)
  );
  holoColor *= colorShift;

  // Apply scan lines
  holoColor *= 0.7 + scanLine * 0.3;

  // Add scan bar highlight
  holoColor += u_accentColor * bar * 0.5;

  // Flicker
  float flicker = 1.0 - u_flickerAmount * 0.3 * hash(floor(u_time * 30.0));
  holoColor *= flicker;

  // Edge fade
  float edgeFade = smoothstep(0.0, 0.1, uv.x) * smoothstep(1.0, 0.9, uv.x);
  edgeFade *= smoothstep(0.0, 0.1, uv.y) * smoothstep(1.0, 0.9, uv.y);

  // Fresnel glow
  float fresnel = pow(1.0 - max(dot(vViewDir, vNormal), 0.0), 2.0);

  // Data grid pattern
  vec2 gridUV = uv * vec2(20.0, 10.0);
  float gridLine = step(0.95, fract(gridUV.x)) + step(0.95, fract(gridUV.y));
  holoColor += u_accentColor * gridLine * 0.1;

  // Binary rain effect (subtle vertical streaks)
  float rain = noise(vec2(floor(uv.x * 40.0), u_time * 2.0));
  rain = step(0.7, rain) * 0.15;
  holoColor += u_accentColor * rain;

  // Final color
  vec3 color = holoColor * u_intensity * edgeFade;
  color += u_accentColor * fresnel * 0.3;

  // Alpha based on content and edge
  float alpha = (0.6 + scanLine * 0.2 + bar * 0.2) * edgeFade;
  alpha = clamp(alpha, 0.0, 1.0);

  gl_FragColor = vec4(color, alpha);
}
`;

export interface HolographicOptions {
	scanLineSpeed?: number;
	scanLineDensity?: number;
	flickerAmount?: number;
	glitchAmount?: number;
}

/**
 * Create a holographic display material.
 */
export function createHolographicMaterial(
	options: HolographicOptions = {}
): THREE.ShaderMaterial {
	const {
		scanLineSpeed = 3.0,
		scanLineDensity = 200.0,
		flickerAmount = 0.3,
		glitchAmount = 0.5,
	} = options;

	const shared = getSharedUniforms();

	const material = new THREE.ShaderMaterial({
		vertexShader,
		fragmentShader,
		uniforms: {
			u_time: shared.u_time,
			u_accentColor: shared.u_accentColor,
			u_intensity: shared.u_intensity,
			u_scanLineSpeed: { value: scanLineSpeed },
			u_scanLineDensity: { value: scanLineDensity },
			u_flickerAmount: { value: flickerAmount },
			u_glitchAmount: { value: glitchAmount },
		},
		transparent: true,
		side: THREE.DoubleSide,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
	});

	return material;
}
