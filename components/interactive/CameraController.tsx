"use client";

import { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useInteractiveStore } from "@/lib/interactive/store";

// =============================================================================
// Types
// =============================================================================

export type CameraMode = "third-person" | "first-person";

interface CameraControllerProps {
	/** Target position to follow as [x, y, z] tuple */
	targetPosition: [number, number, number];
	/** Target rotation (yaw) */
	targetYaw: number;
	/** Target pitch (vertical look angle) */
	targetPitch?: number;
	/** Camera mode */
	mode: CameraMode;
	/** Reduced motion preference */
	reducedMotion: boolean;
	/** Third-person camera distance */
	distance?: number;
	/** Third-person camera height offset */
	heightOffset?: number;
	/** Look-at height offset */
	lookAtHeight?: number;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_DISTANCE = 4;
const DEFAULT_HEIGHT_OFFSET = 2.8;
const DEFAULT_LOOK_AT_HEIGHT = 1.35;
const LERP_FACTOR = 0.1;
const LERP_FACTOR_INSTANT = 1.0;
const MIN_DISTANCE = 1;
const MAX_DISTANCE = 8;
const COLLISION_OFFSET = 0.3;

// =============================================================================
// Collision Detection
// =============================================================================

/**
 * Check for obstacles between camera and target.
 * Returns the safe distance to avoid clipping through geometry.
 * Skips objects tagged with userData.cameraIgnore = true.
 */
function checkCameraCollision(
	raycaster: THREE.Raycaster,
	origin: THREE.Vector3,
	direction: THREE.Vector3,
	maxDistance: number,
	scene: THREE.Scene
): number {
	raycaster.set(origin, direction);
	raycaster.far = maxDistance;

	// Get all meshes that could block the camera
	const intersects = raycaster.intersectObjects(scene.children, true);

	for (const intersection of intersects) {
		const obj = intersection.object;
		
		// Skip objects tagged to ignore camera collision
		if (obj.userData?.cameraIgnore) continue;
		
		// Skip transparent objects (handle both single and multi-material)
		const material = (obj as THREE.Mesh).material;
		if (material) {
			if (Array.isArray(material)) {
				// Multi-material: skip if all materials are transparent
				if (material.every((m) => m.transparent)) continue;
			} else if ((material as THREE.Material).transparent) {
				continue;
			}
		}
		
		// Skip ground planes (check by geometry type or name)
		if (obj.name === 'ground' || obj.name === 'grid') continue;
		if (obj.parent?.name === 'player') continue;

		// Found a collision - return safe distance
		return Math.max(MIN_DISTANCE, intersection.distance - COLLISION_OFFSET);
	}

	return maxDistance;
}

// =============================================================================
// Main Component
// =============================================================================

export function CameraController({
	targetPosition,
	targetYaw,
	targetPitch,
	mode,
	reducedMotion,
	distance = DEFAULT_DISTANCE,
	heightOffset = DEFAULT_HEIGHT_OFFSET,
	lookAtHeight = DEFAULT_LOOK_AT_HEIGHT,
}: CameraControllerProps) {
	const { camera, scene } = useThree();

	// Reusable objects for performance
	const targetVec = useRef(new THREE.Vector3());
	const currentPosition = useRef(new THREE.Vector3());
	const desiredPosition = useRef(new THREE.Vector3());
	const lookAtPoint = useRef(new THREE.Vector3());
	const raycaster = useRef(new THREE.Raycaster());
	const directionToCamera = useRef(new THREE.Vector3());

	// Store settings
	const settings = useInteractiveStore((s) => s.settings);
	const actualMode = settings.cameraMode ?? mode;
	const actualDistance = settings.cameraDistance ?? distance;
	const lerpFactor = reducedMotion ? LERP_FACTOR_INSTANT : LERP_FACTOR;

	// Initialize camera position on mount
	// Note: Using individual array elements to avoid unstable dependency
	const [tx, ty, tz] = targetPosition;
	useEffect(() => {
		targetVec.current.set(tx, ty, tz);

		if (actualMode === "first-person") {
			currentPosition.current.copy(targetVec.current);
			currentPosition.current.y += lookAtHeight;
		} else {
			// Third-person: position behind and above target
			// Use same +sin/+cos as per-frame update for consistency
			currentPosition.current.set(
				targetVec.current.x + Math.sin(targetYaw) * actualDistance,
				targetVec.current.y + heightOffset,
				targetVec.current.z + Math.cos(targetYaw) * actualDistance
			);
		}
		camera.position.copy(currentPosition.current);
	}, [actualMode, tx, ty, tz, targetYaw, actualDistance, heightOffset, lookAtHeight, camera]);

	// Update camera each frame
	useFrame(() => {
		// Update target vector from tuple
		targetVec.current.set(targetPosition[0], targetPosition[1], targetPosition[2]);
		
		// Get pitch value (default to 0 if not provided)
		const pitch = targetPitch ?? 0;

		if (actualMode === "first-person") {
			// First-person: camera at eye level, looking forward
			desiredPosition.current.copy(targetVec.current);
			desiredPosition.current.y += lookAtHeight;

			// Smooth transition
			currentPosition.current.lerp(desiredPosition.current, lerpFactor);
			camera.position.copy(currentPosition.current);

			// Look direction from yaw and pitch
			// Apply pitch to Y offset of look target
			const lookDistance = 10;
			lookAtPoint.current.set(
				currentPosition.current.x - Math.sin(targetYaw) * lookDistance * Math.cos(pitch),
				currentPosition.current.y + Math.sin(pitch) * lookDistance,
				currentPosition.current.z - Math.cos(targetYaw) * lookDistance * Math.cos(pitch)
			);
			camera.lookAt(lookAtPoint.current);
		} else {
			// Third-person: camera behind and above target
			// Calculate desired position
			desiredPosition.current.set(
				targetVec.current.x + Math.sin(targetYaw) * actualDistance,
				targetVec.current.y + heightOffset,
				targetVec.current.z + Math.cos(targetYaw) * actualDistance
			);

			// Check for camera collision
			directionToCamera.current.subVectors(desiredPosition.current, targetVec.current).normalize();
			const safeDistance = checkCameraCollision(
				raycaster.current,
				targetVec.current,
				directionToCamera.current,
				actualDistance,
				scene
			);

			// Apply safe distance if collision detected
			if (safeDistance < actualDistance) {
				desiredPosition.current.set(
					targetVec.current.x + Math.sin(targetYaw) * safeDistance,
					targetVec.current.y + heightOffset * (safeDistance / actualDistance),
					targetVec.current.z + Math.cos(targetYaw) * safeDistance
				);
			}

			// Smooth transition
			currentPosition.current.lerp(desiredPosition.current, lerpFactor);
			camera.position.copy(currentPosition.current);

			// Look at target with pitch offset
			// Pitch adjusts the look height relative to target
			lookAtPoint.current.copy(targetVec.current);
			lookAtPoint.current.y += lookAtHeight + Math.sin(pitch) * 5;
			camera.lookAt(lookAtPoint.current);
		}
	});

	return null;
}

// =============================================================================
// Hook for external camera control
// =============================================================================

export function useCameraSettings() {
	const settings = useInteractiveStore((s) => s.settings);
	const updateSettings = useInteractiveStore((s) => s.updateSettings);

	const setCameraMode = (mode: CameraMode) => {
		updateSettings({ cameraMode: mode });
	};

	const setCameraDistance = (distance: number) => {
		updateSettings({ cameraDistance: Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, distance)) });
	};

	const setCameraSensitivity = (sensitivity: number) => {
		updateSettings({ cameraSensitivity: Math.max(0.1, Math.min(2, sensitivity)) });
	};

	const setInvertY = (invert: boolean) => {
		updateSettings({ invertY: invert });
	};

	return {
		mode: settings.cameraMode,
		distance: settings.cameraDistance,
		sensitivity: settings.cameraSensitivity,
		invertY: settings.invertY,
		setCameraMode,
		setCameraDistance,
		setCameraSensitivity,
		setInvertY,
	};
}
