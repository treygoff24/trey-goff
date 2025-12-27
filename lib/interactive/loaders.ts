/**
 * Asset loader configuration for Interactive route.
 * Configures GLTFLoader with KTX2 and Meshopt compression support.
 */

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

// =============================================================================
// Loader Singleton Management
// =============================================================================

let gltfLoader: GLTFLoader | null = null;
let ktx2Loader: KTX2Loader | null = null;
let isInitialized = false;

/**
 * KTX2 transcoder path. Uses three.js CDN for WASM files.
 * In production, consider self-hosting for better caching.
 */
const KTX2_TRANSCODER_PATH = "https://cdn.jsdelivr.net/npm/three@0.182.0/examples/jsm/libs/basis/";

/**
 * Initialize loaders with WebGL renderer.
 * Must be called after Canvas is mounted and renderer is available.
 */
export function initializeLoaders(gl: THREE.WebGLRenderer): void {
	if (isInitialized) return;

	// Initialize KTX2Loader with GPU transcoder
	ktx2Loader = new KTX2Loader();
	ktx2Loader.setTranscoderPath(KTX2_TRANSCODER_PATH);
	ktx2Loader.detectSupport(gl);

	// Initialize GLTFLoader with extensions
	gltfLoader = new GLTFLoader();
	gltfLoader.setKTX2Loader(ktx2Loader);
	gltfLoader.setMeshoptDecoder(MeshoptDecoder);

	isInitialized = true;
}

/**
 * Get the configured GLTF loader.
 * @throws Error if loaders not initialized
 */
export function getGLTFLoader(): GLTFLoader {
	if (!gltfLoader) {
		throw new Error("Loaders not initialized. Call initializeLoaders() first.");
	}
	return gltfLoader;
}

/**
 * Dispose of loaders and free resources.
 */
export function disposeLoaders(): void {
	if (ktx2Loader) {
		ktx2Loader.dispose();
		ktx2Loader = null;
	}
	gltfLoader = null;
	isInitialized = false;
}

// =============================================================================
// Asset Loading Utilities
// =============================================================================

export interface LoadProgress {
	loaded: number;
	total: number;
	percent: number;
}

export interface LoadOptions {
	onProgress?: (progress: LoadProgress) => void;
	signal?: AbortSignal;
}

/**
 * Load a GLTF/GLB file with progress tracking.
 * Supports KTX2 textures and Meshopt-compressed meshes.
 */
export async function loadGLTF(url: string, options?: LoadOptions): Promise<GLTF> {
	const loader = getGLTFLoader();

	return new Promise((resolve, reject) => {
		// Check for abort before starting
		if (options?.signal?.aborted) {
			reject(new DOMException("Load aborted", "AbortError"));
			return;
		}

		// Handle abort during load
		const abortHandler = () => {
			reject(new DOMException("Load aborted", "AbortError"));
		};
		options?.signal?.addEventListener("abort", abortHandler);

		loader.load(
			url,
			(gltf) => {
				options?.signal?.removeEventListener("abort", abortHandler);
				resolve(gltf);
			},
			(event) => {
				if (options?.onProgress && event.lengthComputable) {
					options.onProgress({
						loaded: event.loaded,
						total: event.total,
						percent: (event.loaded / event.total) * 100,
					});
				}
			},
			(error) => {
				options?.signal?.removeEventListener("abort", abortHandler);
				reject(error);
			}
		);
	});
}

/**
 * Preload a GLTF file without returning it.
 * Useful for warming caches.
 */
export async function preloadGLTF(url: string): Promise<void> {
	await loadGLTF(url);
}

// =============================================================================
// Asset Disposal Utilities
// =============================================================================

/**
 * Recursively dispose of all GPU resources in a Three.js object.
 * Handles geometries, materials, textures, and ImageBitmaps.
 */
export function disposeObject(object: THREE.Object3D): void {
	object.traverse((child) => {
		// Dispose geometry
		if (child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.Points) {
			if (child.geometry) {
				child.geometry.dispose();
			}

			// Dispose materials
			const materials = Array.isArray(child.material) ? child.material : [child.material];
			for (const material of materials) {
				if (material) {
					disposeMaterial(material);
				}
			}
		}

		// Dispose other resources (lights with shadow maps, etc.)
		if (child instanceof THREE.Light && child.shadow?.map) {
			child.shadow.map.dispose();
		}
	});
}

/**
 * Dispose of a material and all its textures.
 */
function disposeMaterial(material: THREE.Material): void {
	// Get all texture properties
	const texturePropNames = [
		"map",
		"normalMap",
		"roughnessMap",
		"metalnessMap",
		"aoMap",
		"emissiveMap",
		"bumpMap",
		"displacementMap",
		"alphaMap",
		"envMap",
		"lightMap",
		"specularMap",
	] as const;

	// Type-safe texture disposal for materials with texture properties
	const materialAsAny = material as unknown as Record<string, THREE.Texture | undefined>;
	for (const prop of texturePropNames) {
		const texture = materialAsAny[prop];
		if (texture instanceof THREE.Texture) {
			disposeTexture(texture);
		}
	}

	material.dispose();
}

/**
 * Dispose of a texture and its image source.
 * Handles ImageBitmap cleanup for KTX2 textures.
 */
function disposeTexture(texture: THREE.Texture): void {
	// Handle ImageBitmap source (common with KTX2)
	if (texture.source?.data instanceof ImageBitmap) {
		texture.source.data.close();
	}

	texture.dispose();
}

// =============================================================================
// Debug Utilities
// =============================================================================

/**
 * Log memory usage from renderer.info.
 */
export function logMemoryUsage(renderer: THREE.WebGLRenderer): void {
	const info = renderer.info;
	console.log("[Interactive] Memory Usage:", {
		geometries: info.memory.geometries,
		textures: info.memory.textures,
		programs: info.programs?.length ?? "N/A",
		render: {
			calls: info.render.calls,
			triangles: info.render.triangles,
		},
	});
}
