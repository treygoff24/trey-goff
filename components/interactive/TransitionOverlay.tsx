"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

export type TransitionState = "idle" | "fading-out" | "black" | "fading-in";

interface TransitionOverlayProps {
	/** Whether a transition is in progress */
	isTransitioning: boolean;
	/** Callback when fade out completes (screen is black) */
	onFadeOutComplete?: () => void;
	/** Callback when fade in completes (transition done) */
	onFadeInComplete?: () => void;
	/** Fade duration in ms */
	duration?: number;
	/** Hold duration at black in ms */
	holdDuration?: number;
	/** Reduced motion preference */
	reducedMotion?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_DURATION = 300; // ms
const DEFAULT_HOLD = 200; // ms

// =============================================================================
// Main Component
// =============================================================================

/**
 * TransitionOverlay - Fade to black overlay for room transitions.
 *
 * Timeline:
 * 1. isTransitioning becomes true
 * 2. Fade to black (duration ms)
 * 3. Hold at black (holdDuration ms) - chunk swap happens here
 * 4. Fade back in (duration ms)
 * 5. isTransitioning becomes false
 */
export function TransitionOverlay({
	isTransitioning,
	onFadeOutComplete,
	onFadeInComplete,
	duration = DEFAULT_DURATION,
	holdDuration = DEFAULT_HOLD,
	reducedMotion = false,
}: TransitionOverlayProps) {
	const [state, setState] = useState<TransitionState>("idle");
	const [opacity, setOpacity] = useState(0);

	// Actual durations (0 if reduced motion)
	const fadeDuration = reducedMotion ? 0 : duration;
	const holdTime = reducedMotion ? 50 : holdDuration;

	// Start transition sequence
	useEffect(() => {
		if (isTransitioning && state === "idle") {
			setState("fading-out");
		}
	}, [isTransitioning, state]);

	// Handle fade out
	useEffect(() => {
		if (state !== "fading-out") return;

		// Animate opacity to 1
		setOpacity(1);

		const timer = setTimeout(() => {
			setState("black");
			onFadeOutComplete?.();
		}, fadeDuration);

		return () => clearTimeout(timer);
	}, [state, fadeDuration, onFadeOutComplete]);

	// Handle black hold
	useEffect(() => {
		if (state !== "black") return;

		const timer = setTimeout(() => {
			setState("fading-in");
		}, holdTime);

		return () => clearTimeout(timer);
	}, [state, holdTime]);

	// Handle fade in
	useEffect(() => {
		if (state !== "fading-in") return;

		// Animate opacity to 0
		setOpacity(0);

		const timer = setTimeout(() => {
			setState("idle");
			onFadeInComplete?.();
		}, fadeDuration);

		return () => clearTimeout(timer);
	}, [state, fadeDuration, onFadeInComplete]);

	// Reset when transition ends externally
	useEffect(() => {
		if (!isTransitioning && state !== "idle") {
			// Force reset if transition was cancelled
			setOpacity(0);
			setState("idle");
		}
	}, [isTransitioning, state]);

	// Don't render if idle and fully transparent
	if (state === "idle" && opacity === 0) {
		return null;
	}

	return (
		<div
			className={cn(
				"pointer-events-none fixed inset-0 z-50 bg-bg-0",
				state === "fading-out" || state === "fading-in"
					? "transition-opacity"
					: ""
			)}
			style={{
				opacity,
				transitionDuration: `${fadeDuration}ms`,
				transitionTimingFunction: "ease-in-out",
			}}
			aria-hidden="true"
		/>
	);
}

// =============================================================================
// Hook for Transition Control
// =============================================================================

/**
 * Hook to manage room transition state.
 * Returns controls for triggering and managing transitions.
 *
 * @param options.duration - Fade duration in ms
 * @param options.holdDuration - Hold duration at black in ms
 * @param options.onSwap - Callback when screen is black (perform chunk swap here)
 */
export function useRoomTransition(options?: {
	duration?: number;
	holdDuration?: number;
	onSwap?: (targetRoom: string) => void;
}) {
	const [isTransitioning, setIsTransitioning] = useState(false);
	const [pendingRoom, setPendingRoom] = useState<string | null>(null);

	const startTransition = useCallback((targetRoom: string) => {
		setPendingRoom(targetRoom);
		setIsTransitioning(true);
	}, []);

	const handleFadeOutComplete = useCallback(() => {
		// Screen is now black - perform chunk swap
		if (pendingRoom && options?.onSwap) {
			options.onSwap(pendingRoom);
		}
	}, [pendingRoom, options]);

	const handleFadeInComplete = useCallback(() => {
		setIsTransitioning(false);
		setPendingRoom(null);
	}, []);

	return {
		isTransitioning,
		pendingRoom,
		startTransition,
		handleFadeOutComplete,
		handleFadeInComplete,
		TransitionOverlayProps: {
			isTransitioning,
			onFadeOutComplete: handleFadeOutComplete,
			onFadeInComplete: handleFadeInComplete,
			duration: options?.duration,
			holdDuration: options?.holdDuration,
		},
	};
}
