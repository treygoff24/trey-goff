"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Html, useKeyboardControls } from "@react-three/drei";
import type { PlayerControls } from "./PlayerController";
import * as THREE from "three";
import { useInteractiveStore } from "@/lib/interactive/store";
import { THREE_COLORS } from "@/lib/interactive/colors";

// =============================================================================
// Types
// =============================================================================

export interface Interactable {
	id: string;
	object: THREE.Object3D;
	type: "book" | "project" | "door" | "plaque" | "generic";
	label: string;
	onInteract: () => void;
	/** Optional: custom hover color */
	hoverColor?: string;
}

interface InteractionSystemProps {
	/** List of interactable objects */
	interactables: Interactable[];
	/** Interaction distance */
	maxDistance?: number;
	/** Whether on mobile */
	isMobile: boolean;
	/** Reduced motion preference */
	reducedMotion: boolean;
}

interface HoveredState {
	interactable: Interactable | null;
	point: THREE.Vector3 | null;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_MAX_DISTANCE = 4;
const HIGHLIGHT_COLOR = THREE_COLORS.warm;
const HIGHLIGHT_INTENSITY = 0.3;
const HINT_OFFSET_Y = 0.5;

// =============================================================================
// Highlight Effect
// =============================================================================

interface HighlightEffectProps {
	object: THREE.Object3D;
	color: string;
	intensity: number;
}

function HighlightEffect({ object, color, intensity }: HighlightEffectProps) {
	const originalMaterials = useRef<Map<THREE.Mesh, THREE.Material | THREE.Material[]>>(new Map());

	useEffect(() => {
		// Capture ref value for cleanup
		const materials = originalMaterials.current;
		
		// Store original materials and apply highlight
		object.traverse((child) => {
			if (child instanceof THREE.Mesh && child.material) {
				materials.set(child, child.material);

				// Clone material to modify emissive
				if (Array.isArray(child.material)) {
					child.material = child.material.map((m) => {
						const clone = m.clone();
						if ("emissive" in clone) {
							(clone as THREE.MeshStandardMaterial).emissive = new THREE.Color(color);
							(clone as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
						}
						return clone;
					});
				} else {
					const clone = child.material.clone();
					if ("emissive" in clone) {
						(clone as THREE.MeshStandardMaterial).emissive = new THREE.Color(color);
						(clone as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
					}
					child.material = clone;
				}
			}
		});

		return () => {
			// Restore original materials using captured ref
			materials.forEach((original, mesh) => {
				// Dispose cloned materials
				if (Array.isArray(mesh.material)) {
					mesh.material.forEach((m) => m.dispose());
				} else {
					mesh.material.dispose();
				}
				mesh.material = original;
			});
			materials.clear();
		};
	}, [object, color, intensity]);

	return null;
}

// =============================================================================
// Interaction Hint
// =============================================================================

interface InteractionHintProps {
	position: THREE.Vector3;
	label: string;
	isMobile: boolean;
	type: Interactable["type"];
}

function InteractionHint({ position, label, isMobile, type }: InteractionHintProps) {
	const actionText = useMemo(() => {
		if (isMobile) {
			return "Tap";
		}
		switch (type) {
			case "book":
				return "E to read";
			case "door":
				return "E to enter";
			case "project":
				return "E to view";
			default:
				return "E to interact";
		}
	}, [isMobile, type]);

	return (
		<Html
			position={[position.x, position.y + HINT_OFFSET_Y, position.z]}
			center
			distanceFactor={8}
			style={{
				pointerEvents: "none",
				userSelect: "none",
			}}
		>
			<div
				className="rounded-md bg-bg-0/90 px-3 py-1.5 text-center backdrop-blur-sm"
				style={{
					border: `1px solid ${THREE_COLORS.warm}40`,
				}}
			>
				<p className="text-sm font-medium text-text-1">{label}</p>
				<p className="text-xs text-text-3">{actionText}</p>
			</div>
		</Html>
	);
}

// =============================================================================
// Main Component
// =============================================================================

export function InteractionSystem({
	interactables,
	maxDistance = DEFAULT_MAX_DISTANCE,
	isMobile,
}: InteractionSystemProps) {
	const { camera, gl } = useThree();
	const [hovered, setHovered] = useState<HoveredState>({ interactable: null, point: null });

	// Own raycaster to avoid mutating useThree's raycaster
	const raycaster = useRef(new THREE.Raycaster());
	
	// Reusable objects
	const mousePos = useRef(new THREE.Vector2());
	const centerScreen = useRef(new THREE.Vector2(0, 0));

	// Store integration
	const setIsInteracting = useInteractiveStore((s) => s.setIsInteracting);
	const recordInteraction = useInteractiveStore((s) => s.recordInteraction);

	// Keyboard interaction (E key)
	const interactPressed = useKeyboardControls<PlayerControls>((state) => state.interact);
	const prevInteract = useRef(false);

	// Build object-to-interactable map
	const interactableMap = useMemo(() => {
		const map = new Map<THREE.Object3D, Interactable>();
		for (const i of interactables) {
			map.set(i.object, i);
			// Also map all descendants
			i.object.traverse((child) => {
				map.set(child, i);
			});
		}
		return map;
	}, [interactables]);

	// Handle mouse/touch move for hover detection
	useEffect(() => {
		if (isMobile) return; // Mobile uses tap, not hover

		const handleMouseMove = (e: MouseEvent) => {
			// Use canvas rect for proper coordinate calculation
			const rect = gl.domElement.getBoundingClientRect();
			mousePos.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
			mousePos.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
		};

		gl.domElement.addEventListener("mousemove", handleMouseMove);
		return () => gl.domElement.removeEventListener("mousemove", handleMouseMove);
	}, [isMobile, gl.domElement]);

	// Raycast for hover detection and E key interaction
	useFrame(() => {
		// Use center of screen for desktop (crosshair style)
		const screenPoint = isMobile ? mousePos.current : centerScreen.current;
		raycaster.current.setFromCamera(screenPoint, camera);
		raycaster.current.far = maxDistance;

		const intersects = raycaster.current.intersectObjects(
			interactables.map((i) => i.object),
			true
		);

		const hit = intersects[0];
		if (hit) {
			const foundInteractable = interactableMap.get(hit.object);

			if (foundInteractable && foundInteractable !== hovered.interactable) {
				setHovered({ interactable: foundInteractable, point: hit.point });
				setIsInteracting(true);
			}
		} else if (hovered.interactable) {
			setHovered({ interactable: null, point: null });
			setIsInteracting(false);
		}

		// Handle E key interaction (on key down, not while held)
		if (interactPressed && !prevInteract.current && hovered.interactable) {
			recordInteraction();
			hovered.interactable.onInteract();
		}
		prevInteract.current = interactPressed;
	});

	// Touch interaction for mobile
	useEffect(() => {
		if (!isMobile) return;

		const handleTouchStart = (e: TouchEvent) => {
			const touch = e.touches.item(0);
			if (!touch) return;

			// Use canvas rect for proper coordinate calculation
			const rect = gl.domElement.getBoundingClientRect();
			mousePos.current.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
			mousePos.current.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

			// Immediate raycast on tap
			raycaster.current.setFromCamera(mousePos.current, camera);
			raycaster.current.far = maxDistance * 2; // Allow further reach for mobile

			const intersects = raycaster.current.intersectObjects(
				interactables.map((i) => i.object),
				true
			);

			const hit = intersects[0];
			if (hit) {
				const foundInteractable = interactableMap.get(hit.object);

				if (foundInteractable) {
					recordInteraction();
					foundInteractable.onInteract();
				}
			}
		};

		gl.domElement.addEventListener("touchstart", handleTouchStart, { passive: true });
		return () => gl.domElement.removeEventListener("touchstart", handleTouchStart);
	}, [isMobile, camera, gl.domElement, interactables, interactableMap, maxDistance, recordInteraction]);

	return (
		<>
			{/* Highlight effect on hovered object */}
			{hovered.interactable && (
				<HighlightEffect
					object={hovered.interactable.object}
					color={hovered.interactable.hoverColor ?? HIGHLIGHT_COLOR}
					intensity={HIGHLIGHT_INTENSITY}
				/>
			)}

			{/* Interaction hint */}
			{hovered.interactable && hovered.point && (
				<InteractionHint
					position={hovered.point}
					label={hovered.interactable.label}
					isMobile={isMobile}
					type={hovered.interactable.type}
				/>
			)}
		</>
	);
}

// =============================================================================
// Hook to register interactables
// =============================================================================

/**
 * Placeholder hook for room components to register their interactables.
 * The actual implementation will connect to a context or store in later phases.
 */
export function useInteractable(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_ref: React.RefObject<THREE.Object3D>,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_config: Omit<Interactable, "object">
): void {
	// This hook would be used by room components to register their interactables
	// The actual implementation would connect to a context or store
	// For now, this is a placeholder for the pattern
}
