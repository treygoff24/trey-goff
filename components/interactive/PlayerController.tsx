"use client";

import { useRef, useEffect, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import { RigidBody, CapsuleCollider, useRapier } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { useInteractiveStore } from "@/lib/interactive/store";
import { THREE_COLORS } from "@/lib/interactive/colors";

// Character controller type - use ReturnType to avoid version mismatch
type CharacterController = ReturnType<ReturnType<typeof useRapier>["world"]["createCharacterController"]>;

// =============================================================================
// Types
// =============================================================================

export type PlayerControls =
	| "forward"
	| "backward"
	| "left"
	| "right"
	| "jump"
	| "sprint"
	| "interact";

interface PlayerControllerProps {
	/** Initial spawn position */
	spawnPosition?: [number, number, number];
	/** Initial spawn rotation (Y-axis) */
	spawnRotation?: number;
	/** Whether on mobile device */
	isMobile: boolean;
	/** Reduced motion preference */
	reducedMotion: boolean;
	/** Disable all input (during room transitions) */
	disableInput?: boolean;
	/** Callback when player position updates */
	onPositionUpdate?: (position: [number, number, number]) => void;
	/** Callback when player attempts interaction */
	onInteract?: (point: THREE.Vector3, direction: THREE.Vector3) => void;
}

// =============================================================================
// Constants
// =============================================================================

const MOVE_SPEED = 5;
const SPRINT_MULTIPLIER = 1.5;
const ROTATION_SPEED = 0.002;
const MAX_PITCH = Math.PI / 2.5; // ~72 degrees, prevents looking straight up/down
const PLAYER_HEIGHT = 1.8;
const PLAYER_RADIUS = 0.4;
const INTERACTION_DISTANCE = 3;

// =============================================================================
// Desktop Controls Hook
// =============================================================================

function useDesktopControls(
	isMobile: boolean,
	yaw: React.MutableRefObject<number>,
	onInteract?: (point: THREE.Vector3, direction: THREE.Vector3) => void
) {
	const { camera, gl } = useThree();
	const pitch = useRef(0);
	const isLocked = useRef(false);

	// Get keyboard state
	const forward = useKeyboardControls<PlayerControls>((state) => state.forward);
	const backward = useKeyboardControls<PlayerControls>((state) => state.backward);
	const left = useKeyboardControls<PlayerControls>((state) => state.left);
	const right = useKeyboardControls<PlayerControls>((state) => state.right);
	const jump = useKeyboardControls<PlayerControls>((state) => state.jump);
	const sprint = useKeyboardControls<PlayerControls>((state) => state.sprint);
	const interact = useKeyboardControls<PlayerControls>((state) => state.interact);

	// Mouse look handler
	useEffect(() => {
		if (isMobile) return;

		const handleMouseMove = (e: MouseEvent) => {
			if (!isLocked.current) return;

			yaw.current -= e.movementX * ROTATION_SPEED;
			pitch.current -= e.movementY * ROTATION_SPEED;
			pitch.current = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch.current));
		};

		const handlePointerLockChange = () => {
			isLocked.current = document.pointerLockElement === gl.domElement;
		};

		const handleClick = () => {
			if (!isLocked.current) {
				gl.domElement.requestPointerLock();
			}
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("pointerlockchange", handlePointerLockChange);
		gl.domElement.addEventListener("click", handleClick);

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("pointerlockchange", handlePointerLockChange);
			gl.domElement.removeEventListener("click", handleClick);
			if (document.pointerLockElement === gl.domElement) {
				document.exitPointerLock();
			}
		};
		// yaw is a ref passed as parameter - stable object, only .current mutates
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isMobile, gl.domElement]);

	// Interaction raycast with debounce
	const prevInteract = useRef(false);
	useEffect(() => {
		// Only trigger on key down transition, not continuously
		if (!interact || prevInteract.current || !onInteract) {
			prevInteract.current = interact;
			return;
		}
		prevInteract.current = interact;

		const direction = new THREE.Vector3(0, 0, -1);
		direction.applyQuaternion(camera.quaternion);
		const point = camera.position.clone();
		point.addScaledVector(direction, INTERACTION_DISTANCE);

		onInteract(point, direction);
	}, [interact, onInteract, camera]);

	return {
		forward,
		backward,
		left,
		right,
		jump,
		sprint,
		pitch,
		isLocked,
	};
}

// =============================================================================
// Mobile Controls Hook
// =============================================================================

function useMobileControls(isMobile: boolean, yaw: React.MutableRefObject<number>) {
	const { camera, gl, raycaster } = useThree();
	const targetPosition = useRef<THREE.Vector3 | null>(null);
	const touchStartPos = useRef<{ x: number; y: number } | null>(null);

	// Function to clear target position
	const clearTarget = () => {
		targetPosition.current = null;
	};

	// Function to get current target (returns ref directly - do not mutate!)
	const getTarget = (): THREE.Vector3 | null => {
		return targetPosition.current;
	};

	useEffect(() => {
		if (!isMobile) return;

		const handleTouchStart = (e: TouchEvent) => {
			if (e.touches.length === 1) {
				const touch = e.touches.item(0);
				if (touch) {
					touchStartPos.current = { x: touch.clientX, y: touch.clientY };
				}
			}
		};

		const handleTouchMove = (e: TouchEvent) => {
			if (e.touches.length === 1 && touchStartPos.current) {
				const touch = e.touches.item(0);
				if (touch) {
					const deltaX = touch.clientX - touchStartPos.current.x;
					yaw.current -= deltaX * ROTATION_SPEED * 0.5;
					touchStartPos.current = { x: touch.clientX, y: touch.clientY };
				}
			}
		};

		const handleTouchEnd = (e: TouchEvent) => {
			if (e.changedTouches.length === 1) {
				const touch = e.changedTouches.item(0);
				if (touch) {
					const rect = gl.domElement.getBoundingClientRect();
					const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
					const y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

					// Raycast to ground or objects
					raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

					// For now, project to ground plane (Y=0)
					const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
					const point = new THREE.Vector3();
					raycaster.ray.intersectPlane(plane, point);

					if (point) {
						targetPosition.current = point;
					}
				}
			}
			touchStartPos.current = null;
		};

		const element = gl.domElement;
		element.addEventListener("touchstart", handleTouchStart, { passive: true });
		element.addEventListener("touchmove", handleTouchMove, { passive: true });
		element.addEventListener("touchend", handleTouchEnd);

		return () => {
			element.removeEventListener("touchstart", handleTouchStart);
			element.removeEventListener("touchmove", handleTouchMove);
			element.removeEventListener("touchend", handleTouchEnd);
		};
		// yaw is a ref passed as parameter - stable object, only .current mutates
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isMobile, camera, gl.domElement, raycaster]);

	return { getTarget, clearTarget };
}

// =============================================================================
// Player Capsule Component
// =============================================================================

interface PlayerCapsuleProps {
	reducedMotion: boolean;
}

function PlayerCapsule({ reducedMotion }: PlayerCapsuleProps) {
	const meshRef = useRef<THREE.Mesh>(null);

	useFrame(() => {
		// Subtle breathing animation for player avatar
		if (!meshRef.current || reducedMotion) return;
		// No animation needed for now - this will be replaced with actual player model
	});

	return (
		<group>
			{/* Capsule body */}
			<mesh ref={meshRef} position={[0, PLAYER_HEIGHT / 2, 0]}>
				<capsuleGeometry args={[PLAYER_RADIUS, PLAYER_HEIGHT - PLAYER_RADIUS * 2, 8, 16]} />
				<meshStandardMaterial
					color={THREE_COLORS.warm}
					roughness={0.6}
					metalness={0.2}
					transparent
					opacity={0.3}
				/>
			</mesh>
			{/* Direction indicator */}
			<mesh position={[0, PLAYER_HEIGHT / 2, -PLAYER_RADIUS - 0.1]}>
				<coneGeometry args={[0.15, 0.3, 8]} />
				<meshStandardMaterial color={THREE_COLORS.accent} roughness={0.4} metalness={0.3} />
			</mesh>
		</group>
	);
}

// =============================================================================
// Main Controller (Physics Version with Rapier)
// =============================================================================

// Store update throttle interval (ms)
const STORE_UPDATE_INTERVAL = 100;

/**
 * Physics-based player controller using Rapier.
 * Uses kinematic character controller for responsive movement with collision.
 *
 * Note: Camera positioning is handled by CameraController, not here.
 */
export function PlayerController({
	spawnPosition = [0, 0, 5],
	spawnRotation = 0,
	isMobile,
	reducedMotion,
	disableInput = false,
	onPositionUpdate,
	onInteract,
}: PlayerControllerProps) {
	const rigidBodyRef = useRef<RapierRigidBody>(null);
	const characterControllerRef = useRef<CharacterController | null>(null);

	// Rapier world access
	const { world } = useRapier();

	// Reusable vectors - allocated once to avoid GC pressure
	const velocity = useRef(new THREE.Vector3());
	const yaw = useRef(spawnRotation);
	const moveDir = useRef(new THREE.Vector3());
	const rotatedDir = useRef(new THREE.Vector3());
	const diffVec = useRef(new THREE.Vector3());
	const zeroVec = useRef(new THREE.Vector3());
	const currentPosVec = useRef(new THREE.Vector3());
	const desiredMovement = useRef({ x: 0, y: 0, z: 0 });

	// Store update throttling
	const lastStoreUpdate = useRef(0);
	// Track last store values to avoid per-frame allocations
	const lastStorePos = useRef<[number, number, number]>([...spawnPosition]);
	const lastStoreRot = useRef<[number, number, number]>([0, spawnRotation, 0]);

	// Store integration
	const setPlayerPosition = useInteractiveStore((s) => s.setPlayerPosition);
	const setPlayerRotation = useInteractiveStore((s) => s.setPlayerRotation);
	const setIsMoving = useInteractiveStore((s) => s.setIsMoving);
	const recordInteraction = useInteractiveStore((s) => s.recordInteraction);

	// Desktop controls (includes pitch tracking)
	const desktopControls = useDesktopControls(isMobile, yaw, onInteract);

	// Mobile controls
	const mobileControls = useMobileControls(isMobile, yaw);

	// Create character controller once
	useEffect(() => {
		if (!world || characterControllerRef.current) return;

		// Create character controller with small offset for numerical stability
		const controller = world.createCharacterController(0.01);

		// Configure controller behavior
		controller.enableAutostep(0.3, 0.2, true); // max height, min width, include dynamic
		controller.enableSnapToGround(0.3); // snap distance
		controller.setMaxSlopeClimbAngle((45 * Math.PI) / 180); // 45 degrees
		controller.setMinSlopeSlideAngle((30 * Math.PI) / 180); // 30 degrees

		characterControllerRef.current = controller;

		return () => {
			if (characterControllerRef.current) {
				world.removeCharacterController(characterControllerRef.current);
				characterControllerRef.current = null;
			}
		};
	}, [world]);

	// Spawn position for RigidBody - slightly elevated so capsule lands on ground
	const spawnWithOffset = useMemo(
		() => [spawnPosition[0], spawnPosition[1] + PLAYER_HEIGHT / 2 + 0.1, spawnPosition[2]] as [
			number,
			number,
			number,
		],
		[spawnPosition]
	);

	// Update position on each frame
	useFrame((state, delta) => {
		const rigidBody = rigidBodyRef.current;
		const controller = characterControllerRef.current;
		if (!rigidBody || !controller) return;

		// Get current position from physics (reuse vector to avoid GC pressure)
		const translation = rigidBody.translation();
		currentPosVec.current.set(translation.x, translation.y, translation.z);

		// Skip movement processing during transitions (but keep updating store for camera)
		if (disableInput) {
			// Still update store so camera stays synced
			const px = translation.x;
			const py = translation.y - PLAYER_HEIGHT / 2; // Adjust for capsule center
			const pz = translation.z;
			if (
				lastStorePos.current[0] !== px ||
				lastStorePos.current[1] !== py ||
				lastStorePos.current[2] !== pz
			) {
				lastStorePos.current = [px, py, pz];
				setPlayerPosition(lastStorePos.current);
			}
			// Include pitch (from desktop controls) in rotation
			const pitchVal = isMobile ? 0 : desktopControls.pitch.current;
			if (lastStoreRot.current[0] !== pitchVal || lastStoreRot.current[1] !== yaw.current) {
				lastStoreRot.current = [pitchVal, yaw.current, 0];
				setPlayerRotation(lastStoreRot.current);
			}
			return;
		}

		moveDir.current.set(0, 0, 0);
		let isMoving = false;

		if (!isMobile) {
			// Desktop movement
			if (desktopControls.forward) {
				moveDir.current.z -= 1;
				isMoving = true;
			}
			if (desktopControls.backward) {
				moveDir.current.z += 1;
				isMoving = true;
			}
			if (desktopControls.left) {
				moveDir.current.x -= 1;
				isMoving = true;
			}
			if (desktopControls.right) {
				moveDir.current.x += 1;
				isMoving = true;
			}
		} else {
			// Mobile movement - move toward target
			const target = mobileControls.getTarget();
			if (target) {
				diffVec.current.set(target.x - currentPosVec.current.x, 0, target.z - currentPosVec.current.z);

				if (diffVec.current.length() > 0.5) {
					moveDir.current.copy(diffVec.current.normalize());
					isMoving = true;

					// Rotate to face movement direction
					yaw.current = Math.atan2(diffVec.current.x, diffVec.current.z);
				} else {
					mobileControls.clearTarget();
				}
			}
		}

		// Normalize and apply movement
		if (moveDir.current.lengthSq() > 0) {
			moveDir.current.normalize();

			// Rotate movement direction by yaw
			const cosYaw = Math.cos(yaw.current);
			const sinYaw = Math.sin(yaw.current);
			rotatedDir.current.x = moveDir.current.x * cosYaw + moveDir.current.z * sinYaw;
			rotatedDir.current.y = 0;
			rotatedDir.current.z = -moveDir.current.x * sinYaw + moveDir.current.z * cosYaw;

			// Apply speed
			const speed = desktopControls.sprint ? MOVE_SPEED * SPRINT_MULTIPLIER : MOVE_SPEED;
			velocity.current.lerp(rotatedDir.current.multiplyScalar(speed), 0.1);
		} else {
			// Decelerate
			velocity.current.lerp(zeroVec.current, 0.1);
		}

		// Calculate desired movement for this frame
		desiredMovement.current.x = velocity.current.x * delta;
		desiredMovement.current.y = -9.81 * delta; // Gravity
		desiredMovement.current.z = velocity.current.z * delta;

		// Get the collider from the rigid body
		const collider = rigidBody.collider(0);
		if (collider) {
			// Compute movement with collision detection
			controller.computeColliderMovement(collider, desiredMovement.current);
			const correctedMovement = controller.computedMovement();

			// Apply corrected movement
			const newPos = {
				x: translation.x + correctedMovement.x,
				y: translation.y + correctedMovement.y,
				z: translation.z + correctedMovement.z,
			};
			rigidBody.setNextKinematicTranslation(newPos);
		}

		// Update rotation (yaw only - physics handles position)
		rigidBody.setNextKinematicRotation({ x: 0, y: Math.sin(yaw.current / 2), z: 0, w: Math.cos(yaw.current / 2) });

		// Get final position for store update
		const finalTranslation = rigidBody.translation();
		const px = finalTranslation.x;
		const py = finalTranslation.y - PLAYER_HEIGHT / 2; // Adjust for capsule center
		const pz = finalTranslation.z;
		const yawVal = yaw.current;
		const posChanged =
			Math.abs(lastStorePos.current[0] - px) > 0.001 ||
			Math.abs(lastStorePos.current[1] - py) > 0.001 ||
			Math.abs(lastStorePos.current[2] - pz) > 0.001;
		if (posChanged) {
			lastStorePos.current = [px, py, pz];
			setPlayerPosition(lastStorePos.current);
		}
		// Include pitch in rotation (rotation[0] = pitch, rotation[1] = yaw)
		const pitchVal = isMobile ? 0 : desktopControls.pitch.current;
		if (lastStoreRot.current[0] !== pitchVal || lastStoreRot.current[1] !== yawVal) {
			lastStoreRot.current = [pitchVal, yawVal, 0];
			setPlayerRotation(lastStoreRot.current);
		}

		// Throttled store updates for telemetry only
		const now = state.clock.elapsedTime * 1000;
		if (now - lastStoreUpdate.current > STORE_UPDATE_INTERVAL) {
			setIsMoving(isMoving);
			if (isMoving) {
				recordInteraction();
			}
			lastStoreUpdate.current = now;
		}

		// Callback
		if (onPositionUpdate && posChanged) {
			onPositionUpdate(lastStorePos.current);
		}
	});

	return (
		<RigidBody
			ref={rigidBodyRef}
			position={spawnWithOffset}
			rotation={[0, spawnRotation, 0]}
			type="kinematicPosition"
			colliders={false}
			name="player"
		>
			<CapsuleCollider args={[PLAYER_HEIGHT / 2 - PLAYER_RADIUS, PLAYER_RADIUS]} />
			<PlayerCapsule reducedMotion={reducedMotion} />
		</RigidBody>
	);
}

// =============================================================================
// Keyboard Controls Map
// =============================================================================

export const keyboardControlsMap: { name: PlayerControls; keys: string[] }[] = [
	{ name: "forward", keys: ["KeyW", "ArrowUp"] },
	{ name: "backward", keys: ["KeyS", "ArrowDown"] },
	{ name: "left", keys: ["KeyA", "ArrowLeft"] },
	{ name: "right", keys: ["KeyD", "ArrowRight"] },
	{ name: "jump", keys: ["Space"] },
	{ name: "sprint", keys: ["ShiftLeft", "ShiftRight"] },
	{ name: "interact", keys: ["KeyE", "Enter"] },
];
