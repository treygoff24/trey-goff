/**
 * Shared uniforms manager for material time synchronization.
 * All procedural materials share these uniforms to stay in sync.
 */

import * as THREE from "three";

export interface SharedUniforms {
	u_time: THREE.IUniform<number>;
	u_deltaTime: THREE.IUniform<number>;
	u_accentColor: THREE.IUniform<THREE.Color>;
	u_intensity: THREE.IUniform<number>;
}

let sharedUniforms: SharedUniforms | null = null;

/**
 * Get or create the shared uniforms singleton.
 * Call updateSharedUniforms() each frame to keep time in sync.
 */
export function getSharedUniforms(): SharedUniforms {
	if (!sharedUniforms) {
		sharedUniforms = {
			u_time: { value: 0 },
			u_deltaTime: { value: 0 },
			u_accentColor: { value: new THREE.Color("#7C5CFF") },
			u_intensity: { value: 1.0 },
		};
	}
	return sharedUniforms;
}

/**
 * Update shared uniforms. Call once per frame in your render loop.
 */
export function updateSharedUniforms(
	time: number,
	deltaTime: number,
	accentColor?: string,
	intensity?: number
): void {
	const uniforms = getSharedUniforms();
	uniforms.u_time.value = time;
	uniforms.u_deltaTime.value = deltaTime;
	if (accentColor !== undefined) {
		uniforms.u_accentColor.value.set(accentColor);
	}
	if (intensity !== undefined) {
		uniforms.u_intensity.value = intensity;
	}
}

/**
 * Reset uniforms (useful for cleanup or testing).
 */
export function resetSharedUniforms(): void {
	sharedUniforms = null;
}
