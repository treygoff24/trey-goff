/**
 * Brushed metal panels material with edge highlights.
 * Sci-fi aesthetic with subtle noise texture and fresnel rim.
 */

import * as THREE from "three";
import { getSharedUniforms } from "./uniforms";

const vertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vViewDir = normalize(cameraPosition - worldPos.xyz);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
precision highp float;

uniform float u_time;
uniform vec3 u_accentColor;
uniform float u_intensity;
uniform vec3 u_baseColor;
uniform float u_roughness;
uniform float u_brushDirection; // 0 = horizontal, 1 = vertical

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;

// Simple hash for noise
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

// Brushed metal noise (directional)
float brushedNoise(vec2 uv, float direction) {
  vec2 brushUV = direction < 0.5
    ? vec2(uv.x * 200.0, uv.y * 4.0)  // Horizontal brush
    : vec2(uv.x * 4.0, uv.y * 200.0); // Vertical brush

  float n = noise(brushUV);
  n += noise(brushUV * 2.0) * 0.5;
  n += noise(brushUV * 4.0) * 0.25;
  return n / 1.75;
}

void main() {
  // Brushed metal texture
  float brushed = brushedNoise(vUv, u_brushDirection);

  // Subtle variation in base color
  vec3 metalColor = u_baseColor * (0.85 + brushed * 0.3);

  // Simple diffuse lighting
  vec3 lightDir = normalize(vec3(1.0, 1.0, 0.5));
  float diffuse = max(dot(vNormal, lightDir), 0.0);

  // Specular highlight (Blinn-Phong)
  vec3 halfDir = normalize(lightDir + vViewDir);
  float spec = pow(max(dot(vNormal, halfDir), 0.0), 32.0 / u_roughness);

  // Fresnel edge highlight
  float fresnel = pow(1.0 - max(dot(vViewDir, vNormal), 0.0), 3.0);
  vec3 rimColor = u_accentColor * fresnel * u_intensity * 0.5;

  // Combine
  vec3 ambient = metalColor * 0.2;
  vec3 color = ambient + metalColor * diffuse * 0.6 + vec3(spec * 0.4) + rimColor;

  // Subtle panel edge detection (based on UV edges)
  float edgeDist = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
  float edge = smoothstep(0.0, 0.02, edgeDist);
  color *= 0.7 + edge * 0.3;

  gl_FragColor = vec4(color, 1.0);
}
`;

export interface MetalPanelOptions {
	baseColor?: string;
	roughness?: number;
	brushDirection?: "horizontal" | "vertical";
}

/**
 * Create a brushed metal panel material.
 */
export function createMetalPanelMaterial(
	options: MetalPanelOptions = {}
): THREE.ShaderMaterial {
	const {
		baseColor = "#4a5568",
		roughness = 0.4,
		brushDirection = "horizontal",
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
			u_roughness: { value: roughness },
			u_brushDirection: { value: brushDirection === "horizontal" ? 0 : 1 },
		},
	});

	return material;
}
