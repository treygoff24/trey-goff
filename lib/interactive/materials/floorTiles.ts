/**
 * Floor tiles material with grid pattern and subtle glow lines.
 * Sci-fi flooring with optional animated accents.
 */

import * as THREE from "three";
import { getSharedUniforms } from "./uniforms";

const vertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldPos;

void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
precision highp float;

uniform float u_time;
uniform vec3 u_accentColor;
uniform float u_intensity;
uniform vec3 u_baseColor;
uniform float u_tileScale;
uniform float u_lineWidth;
uniform float u_glowIntensity;

varying vec2 vUv;
varying vec3 vWorldPos;

// Hash for subtle noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  // Scale UVs for tiling (use world position for seamless tiling across meshes)
  vec2 tileUV = vWorldPos.xz * u_tileScale;
  vec2 tileId = floor(tileUV);
  vec2 tilePos = fract(tileUV);

  // Per-tile variation
  float tileNoise = hash(tileId) * 0.1;

  // Grid lines
  float lineX = smoothstep(u_lineWidth, 0.0, tilePos.x) + smoothstep(1.0 - u_lineWidth, 1.0, tilePos.x);
  float lineY = smoothstep(u_lineWidth, 0.0, tilePos.y) + smoothstep(1.0 - u_lineWidth, 1.0, tilePos.y);
  float gridLine = max(lineX, lineY);

  // Base tile color with subtle variation
  vec3 tileColor = u_baseColor * (0.9 + tileNoise);

  // Glow line color
  vec3 glowColor = u_accentColor * gridLine * u_glowIntensity * u_intensity;

  // Subtle pulse on glow lines
  float pulse = 0.8 + 0.2 * sin(u_time * 1.5 + tileId.x * 0.5 + tileId.y * 0.3);
  glowColor *= pulse;

  // Traveling wave effect (optional subtle wave across floor)
  float wave = sin(vWorldPos.x * 0.5 + vWorldPos.z * 0.3 + u_time * 0.5);
  wave = smoothstep(0.8, 1.0, wave) * 0.15;
  glowColor += u_accentColor * wave * u_intensity;

  // Combine
  vec3 color = tileColor + glowColor;

  // Darken the grid line grooves slightly
  color *= 1.0 - gridLine * 0.2;

  gl_FragColor = vec4(color, 1.0);
}
`;

export interface FloorTileOptions {
	baseColor?: string;
	tileScale?: number;
	lineWidth?: number;
	glowIntensity?: number;
}

/**
 * Create a floor tiles material with grid pattern.
 */
export function createFloorTileMaterial(
	options: FloorTileOptions = {}
): THREE.ShaderMaterial {
	const {
		baseColor = "#1a1a2e",
		tileScale = 0.5,
		lineWidth = 0.02,
		glowIntensity = 0.4,
	} = options;

	const shared = getSharedUniforms();

	const material = new THREE.ShaderMaterial({
		vertexShader,
		fragmentShader,
		uniforms: {
			u_time: shared.u_time,
			u_accentColor: shared.u_accentColor,
			u_intensity: shared.u_intensity,
			u_baseColor: { value: new THREE.Color(baseColor) },
			u_tileScale: { value: tileScale },
			u_lineWidth: { value: lineWidth },
			u_glowIntensity: { value: glowIntensity },
		},
	});

	return material;
}
