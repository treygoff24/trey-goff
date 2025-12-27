"use client";

import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useInteractiveStore } from "@/lib/interactive/store";
import type { RoomId } from "@/lib/interactive/types";
import { THREE_COLORS } from "@/lib/interactive/colors";

// =============================================================================
// Types
// =============================================================================

interface DoorTriggerProps {
	/** Position of the door */
	position: [number, number, number];
	/** Target room when entering */
	targetRoom: RoomId;
	/** Spawn position in target room */
	spawnPosition: [number, number, number];
	/** Spawn rotation (yaw) in target room */
	spawnRotation?: number;
	/** Preload distance (start loading target chunk) */
	preloadDistance?: number;
	/** Activation distance (can interact with door) */
	activationDistance?: number;
	/** Door dimensions [width, height] */
	size?: [number, number];
	/** Callback when door is activated */
	onActivate?: (targetRoom: RoomId, spawnPosition: [number, number, number]) => void;
	/** Whether door is currently available */
	enabled?: boolean;
	/** Show debug visuals */
	debug?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_PRELOAD_DISTANCE = 15;
const DEFAULT_ACTIVATION_DISTANCE = 3;
const DEFAULT_SIZE: [number, number] = [2, 3];

// =============================================================================
// Main Component
// =============================================================================

/**
 * DoorTrigger - Invisible trigger zone that:
 * 1. Preloads target room when player is within preloadDistance
 * 2. Shows interaction prompt when within activationDistance
 * 3. Triggers room transition on interaction
 */
export function DoorTrigger({
	position,
	targetRoom,
	spawnPosition,
	spawnRotation = 0,
	preloadDistance = DEFAULT_PRELOAD_DISTANCE,
	activationDistance = DEFAULT_ACTIVATION_DISTANCE,
	size = DEFAULT_SIZE,
	onActivate,
	enabled = true,
	debug = false,
}: DoorTriggerProps) {
	const groupRef = useRef<THREE.Group>(null);
	const doorPosition = useMemo(() => new THREE.Vector3(...position), [position]);

	// Reusable vector for distance calculations (avoid per-frame allocation)
	const playerVecRef = useRef(new THREE.Vector3());

	// Store state
	const playerPosition = useInteractiveStore((s) => s.player.position);
	const setChunkState = useInteractiveStore((s) => s.setChunkState);
	const chunkStates = useInteractiveStore((s) => s.chunkStates);

	// Track preload state to avoid spamming
	const hasTriggeredPreload = useRef(false);
	const isWithinActivation = useRef(false);

	// Calculate player distance each frame
	useFrame(() => {
		if (!enabled) return;

		// Reuse vector to avoid allocation
		playerVecRef.current.set(
			playerPosition[0],
			playerPosition[1],
			playerPosition[2]
		);
		const distance = playerVecRef.current.distanceTo(doorPosition);

		// Check preload trigger
		if (distance <= preloadDistance && !hasTriggeredPreload.current) {
			const targetState = chunkStates.get(targetRoom)?.state;
			if (targetState === "unloaded" || targetState === "disposed") {
				setChunkState(targetRoom, "preloading");
				hasTriggeredPreload.current = true;
				if (debug) {
					console.log(`[DoorTrigger] Preloading ${targetRoom} (distance: ${distance.toFixed(1)}m)`);
				}
			}
		} else if (distance > preloadDistance * 1.2) {
			// Reset preload trigger with hysteresis
			hasTriggeredPreload.current = false;
		}

		// Check activation zone
		const wasWithin = isWithinActivation.current;
		isWithinActivation.current = distance <= activationDistance;

		// Could emit events for UI updates
		if (isWithinActivation.current !== wasWithin) {
			// State changed
		}
	});

	// Handle interaction (E key or tap)
	// This is called by InteractionSystem when player interacts with door mesh
	const handleInteract = () => {
		if (!enabled || !isWithinActivation.current) return;

		const targetState = chunkStates.get(targetRoom)?.state;
		if (targetState === "loaded" || targetState === "dormant") {
			onActivate?.(targetRoom, spawnPosition);
		} else {
			if (debug) {
				console.log(`[DoorTrigger] Cannot enter ${targetRoom} - state: ${targetState}`);
			}
		}
	};

	// Store handle interact for external access
	useEffect(() => {
		if (groupRef.current) {
			groupRef.current.userData.onInteract = handleInteract;
			groupRef.current.userData.targetRoom = targetRoom;
			groupRef.current.userData.spawnPosition = spawnPosition;
			groupRef.current.userData.spawnRotation = spawnRotation;
		}
	});

	return (
		<group ref={groupRef} position={position} name={`door-${targetRoom}`}>
			{/* Invisible collision mesh for raycasting */}
			<mesh visible={debug}>
				<boxGeometry args={[size[0], size[1], 0.2]} />
				<meshBasicMaterial
					color={THREE_COLORS.accent}
					transparent
					opacity={debug ? 0.3 : 0}
					side={THREE.DoubleSide}
				/>
			</mesh>

			{/* Debug visualization */}
			{debug && (
				<>
					{/* Preload radius */}
					<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
						<ringGeometry args={[preloadDistance - 0.1, preloadDistance, 32]} />
						<meshBasicMaterial
							color={THREE_COLORS.warm}
							transparent
							opacity={0.2}
							side={THREE.DoubleSide}
						/>
					</mesh>

					{/* Activation radius */}
					<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
						<ringGeometry args={[activationDistance - 0.05, activationDistance, 32]} />
						<meshBasicMaterial
							color="#00ff00"
							transparent
							opacity={0.3}
							side={THREE.DoubleSide}
						/>
					</mesh>
				</>
			)}
		</group>
	);
}

// =============================================================================
// Door Configuration Helper
// =============================================================================

export interface DoorConfig {
	id: string;
	position: [number, number, number];
	targetRoom: RoomId;
	spawnPosition: [number, number, number];
	spawnRotation?: number;
	size?: [number, number];
}

/**
 * Render multiple doors from configuration.
 */
export function DoorTriggers({
	doors,
	onActivate,
	debug = false,
}: {
	doors: DoorConfig[];
	onActivate?: (targetRoom: RoomId, spawnPosition: [number, number, number]) => void;
	debug?: boolean;
}) {
	return (
		<>
			{doors.map((door) => (
				<DoorTrigger
					key={door.id}
					position={door.position}
					targetRoom={door.targetRoom}
					spawnPosition={door.spawnPosition}
					spawnRotation={door.spawnRotation}
					size={door.size}
					onActivate={onActivate}
					debug={debug}
				/>
			))}
		</>
	);
}
