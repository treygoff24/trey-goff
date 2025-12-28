"use client";

import { Suspense, useState, useCallback, useRef, useEffect } from "react";
import { KeyboardControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import Link from "next/link";
import type { QualityTier } from "@/lib/interactive/capabilities";
import { useInteractiveStore } from "@/lib/interactive/store";
import type { RoomId } from "@/lib/interactive/types";
import { RendererRoot } from "./RendererRoot";
import { PlayerController, keyboardControlsMap } from "./PlayerController";
import { LoadingSequence, type LoadingPhase } from "./LoadingSequence";
import { CameraController } from "./CameraController";
import { ChunkManager } from "./ChunkManager";
import { TransitionOverlay, useRoomTransition } from "./TransitionOverlay";
import { RoomRenderer, getRoomSpawn, getRoomRotation } from "./rooms";
import { ContentOverlay, useContentOverlay, type OverlayContent } from "./ContentOverlay";
import { PostProcessing } from "./PostProcessing";
import { SettingsMenu, useSettingsMenu } from "./SettingsMenu";

// =============================================================================
// Types
// =============================================================================

interface InteractiveWorldProps {
	qualityTier: QualityTier;
	reducedMotion: boolean;
	isMobile: boolean;
	onReady: () => void;
	onError: (error: Error) => void;
	onTierChange?: (tier: Exclude<QualityTier, "auto">) => void;
	onQualityChange?: (tier: QualityTier) => void;
	onReducedMotionChange?: (enabled: boolean) => void;
}

// =============================================================================
// Camera Integration
// =============================================================================

/**
 * Connects the camera to the player position from the store.
 * Reads position/rotation tuples and passes them to CameraController.
 */
function CameraIntegration({
	reducedMotion,
}: {
	reducedMotion: boolean;
}) {
	const playerPosition = useInteractiveStore((s) => s.player.position);
	const playerRotation = useInteractiveStore((s) => s.player.rotation);
	const cameraMode = useInteractiveStore((s) => s.settings.cameraMode);

	return (
		<CameraController
			targetPosition={playerPosition}
			targetYaw={playerRotation[1]}
			targetPitch={playerRotation[0]}
			mode={cameraMode ?? "third-person"}
			reducedMotion={reducedMotion}
		/>
	);
}


// =============================================================================
// Main Scene Content
// =============================================================================

interface SceneContentProps {
	reducedMotion: boolean;
	isMobile: boolean;
	disableInput?: boolean;
	qualityTier: QualityTier;
	onDoorActivate: (targetRoom: RoomId, spawnPosition: [number, number, number], spawnRotation: number) => void;
	onContentSelect?: (content: OverlayContent) => void;
}

function SceneContent({
	reducedMotion,
	isMobile,
	disableInput = false,
	qualityTier,
	onDoorActivate,
	onContentSelect,
}: SceneContentProps) {
	// Get current room and spawn from store
	// spawnPosition/spawnRotation only change during room transitions, not every frame
	const currentRoom = useInteractiveStore((s) => s.player.currentRoom) ?? "exterior";
	const spawnPosition = useInteractiveStore((s) => s.player.spawnPosition);
	const spawnRotation = useInteractiveStore((s) => s.player.spawnRotation);

	// Ref to track if we've set initial room
	const hasSetInitialRoom = useRef(false);

	// Set initial room on first render
	useEffect(() => {
		if (!hasSetInitialRoom.current) {
			hasSetInitialRoom.current = true;
			const store = useInteractiveStore.getState();
			if (!store.player.currentRoom) {
				const spawn = getRoomSpawn("exterior");
				const rotation = getRoomRotation("exterior");
				store.setSpawnPosition(spawn);
				store.setSpawnRotation(rotation);
				store.setCurrentRoom("exterior");
				store.setPlayerPosition(spawn);
				store.setPlayerRotation([0, rotation, 0]);
				store.activateChunk("exterior");
			}
		}
	}, []);

	return (
		<Suspense fallback={null}>
			{/* Physics World - wraps all collidable objects */}
			<Physics gravity={[0, -20, 0]} debug={false}>
				{/* Active Room */}
				<RoomRenderer
					roomId={currentRoom as RoomId}
					onDoorActivate={onDoorActivate}
					onContentSelect={onContentSelect}
				/>

				{/* Player Controller - key forces remount on room change for spawn reset */}
				<PlayerController
					key={currentRoom}
					spawnPosition={spawnPosition as [number, number, number]}
					spawnRotation={spawnRotation}
					isMobile={isMobile}
					reducedMotion={reducedMotion}
					disableInput={disableInput}
				/>
			</Physics>

			{/* Camera System - outside physics for performance */}
			<CameraIntegration reducedMotion={reducedMotion} />

			{/* Chunk Manager - handles room loading/unloading */}
			<ChunkManager debug={false} />

			{/* Post-processing effects */}
			<PostProcessing qualityTier={qualityTier} reducedMotion={reducedMotion} />
		</Suspense>
	);
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * InteractiveWorld - The main 3D world component.
 *
 * Phase 1: Sets up R3F canvas with quality tiers and shader warmup.
 * Phase 4: Adds character controller and loading sequence.
 * Phase 5: Camera and interaction system.
 * Phase 6: Chunk streaming state machine.
 * Future phases will add actual room content.
 */
export function InteractiveWorld({
	qualityTier,
	reducedMotion,
	isMobile,
	onReady,
	onError,
	onTierChange,
	onQualityChange,
	onReducedMotionChange,
}: InteractiveWorldProps) {
	const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("initializing");
	const [loadingProgress, setLoadingProgress] = useState(0);
	const [loadingStatus, setLoadingStatus] = useState("Initializing...");
	const [isWorldReady, setIsWorldReady] = useState(false);

	// Content overlay state
	const { content: overlayContent, openOverlay, closeOverlay } = useContentOverlay();

	// Settings menu state
	const { isOpen: isSettingsOpen, openSettings, closeSettings } = useSettingsMenu();

	// Handle quality change from settings
	const handleQualityChange = useCallback(
		(tier: QualityTier) => {
			onQualityChange?.(tier);
		},
		[onQualityChange]
	);

	// Handle reduced motion change from settings
	const handleReducedMotionChange = useCallback(
		(enabled: boolean) => {
			onReducedMotionChange?.(enabled);
		},
		[onReducedMotionChange]
	);

	// Pending door transition info (stored until screen is black)
	const pendingTransition = useRef<{
		targetRoom: RoomId;
		spawnPosition: [number, number, number];
		spawnRotation: number;
	} | null>(null);

	// Timeout refs for cleanup
	const loadingTimeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

	// Room transition state with swap callback
	const { isTransitioning, startTransition, TransitionOverlayProps } = useRoomTransition({
		duration: reducedMotion ? 0 : 300,
		holdDuration: 200,
		onSwap: (targetRoom) => {
			// Screen is black - perform the room swap
			const store = useInteractiveStore.getState();
			const spawn = pendingTransition.current?.spawnPosition ?? getRoomSpawn(targetRoom as RoomId);
			const rotation = pendingTransition.current?.spawnRotation ?? getRoomRotation(targetRoom as RoomId);

			// Update spawn (stable, used by PlayerController on mount)
			store.setSpawnPosition(spawn);
			store.setSpawnRotation(rotation);

			// Update room and player position/rotation
			store.setCurrentRoom(targetRoom as RoomId);
			store.setPlayerPosition(spawn);
			store.setPlayerRotation([0, rotation, 0]);

			// Activate the new chunk (marks previous as dormant)
			store.activateChunk(targetRoom as RoomId);

			pendingTransition.current = null;
		},
	});

	// Handle door activation from rooms
	const handleDoorActivate = useCallback(
		(targetRoom: RoomId, spawnPosition: [number, number, number], spawnRotation: number) => {
			// Store transition info and start the fade
			pendingTransition.current = { targetRoom, spawnPosition, spawnRotation };
			startTransition(targetRoom);
		},
		[startTransition]
	);

	// Handle content selection from rooms
	const handleContentSelect = useCallback(
		(content: OverlayContent) => {
			openOverlay(content);
		},
		[openOverlay]
	);

	const handleRendererReady = useCallback(() => {
		setLoadingPhase("loading-assets");
		setLoadingProgress(40);
		setLoadingStatus("Loading assets...");

		// Simulate asset loading (will be replaced with real chunk loading)
		// Track timeouts for cleanup on unmount
		const t1 = setTimeout(() => {
			setLoadingPhase("warming-shaders");
			setLoadingProgress(70);
			setLoadingStatus("Preparing graphics...");

			const t2 = setTimeout(() => {
				setLoadingPhase("ready");
				setLoadingProgress(100);
				setLoadingStatus("Ready to explore");
			}, 500);
			loadingTimeoutRefs.current.push(t2);
		}, 300);
		loadingTimeoutRefs.current.push(t1);
	}, []);

	const handleEnterWorld = useCallback(() => {
		setLoadingPhase("complete");
		setIsWorldReady(true);
		onReady();
	}, [onReady]);

	// Cleanup timeouts on unmount
	useEffect(() => {
		const timeouts = loadingTimeoutRefs.current;
		return () => {
			timeouts.forEach(clearTimeout);
		};
	}, []);

	return (
		<KeyboardControls map={keyboardControlsMap}>
			<div className="relative h-full w-full">
				{/* Loading overlay */}
				{loadingPhase !== "complete" && (
					<LoadingSequence
						phase={loadingPhase}
						progress={loadingProgress}
						status={loadingStatus}
						onComplete={handleEnterWorld}
						reducedMotion={reducedMotion}
					/>
				)}

				{/* 3D Canvas */}
				<div
					className={
						loadingPhase === "complete"
							? "h-full w-full"
							: "pointer-events-none h-full w-full opacity-0"
					}
				>
					<RendererRoot
						qualityTier={qualityTier}
						reducedMotion={reducedMotion}
						isMobile={isMobile}
						onReady={handleRendererReady}
						onError={onError}
						onTierChange={onTierChange}
					>
						<SceneContent
							reducedMotion={reducedMotion}
							isMobile={isMobile}
							disableInput={isTransitioning || overlayContent !== null}
							qualityTier={qualityTier}
							onDoorActivate={handleDoorActivate}
							onContentSelect={handleContentSelect}
						/>
					</RendererRoot>
				</div>

				{/* Room Transition Overlay (fade to black) */}
				<TransitionOverlay
					{...TransitionOverlayProps}
					reducedMotion={reducedMotion}
				/>

				{/* Content Overlay (book/project details) */}
				<ContentOverlay
					content={overlayContent}
					onClose={closeOverlay}
					reducedMotion={reducedMotion}
				/>

				{/* World Ready UI - return button etc */}
				{isWorldReady && (
					<div className="pointer-events-auto absolute left-4 top-4 z-10 flex gap-2">
						<Link
							href="/"
							className="rounded-lg bg-surface-1 px-4 py-2 text-sm text-text-2 transition-colors hover:bg-surface-2 hover:text-text-1"
							aria-label="Return to main website"
						>
							← Return to Normal
						</Link>
						<button
							onClick={openSettings}
							className="rounded-lg bg-surface-1 px-4 py-2 text-sm text-text-2 transition-colors hover:bg-surface-2 hover:text-text-1"
							aria-label="Open settings"
						>
							<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
								/>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
						</button>
					</div>
				)}

				{/* Settings Menu */}
				<SettingsMenu
					isOpen={isSettingsOpen}
					onClose={closeSettings}
					qualityTier={qualityTier}
					onQualityChange={handleQualityChange}
					reducedMotion={reducedMotion}
					onReducedMotionChange={handleReducedMotionChange}
				/>
			</div>
		</KeyboardControls>
	);
}
