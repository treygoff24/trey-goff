"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

export type LoadingPhase =
	| "initializing"
	| "loading-assets"
	| "warming-shaders"
	| "ready"
	| "complete";

interface LoadingSequenceProps {
	phase: LoadingPhase;
	progress: number;
	status: string;
	onComplete?: () => void;
	reducedMotion?: boolean;
}

// =============================================================================
// Loading Messages
// =============================================================================

const PHASE_MESSAGES: Record<LoadingPhase, string> = {
	initializing: "Initializing...",
	"loading-assets": "Loading assets...",
	"warming-shaders": "Preparing graphics...",
	ready: "Ready to explore",
	complete: "",
};

const LOADING_HINTS = [
	"Use WASD or arrow keys to move",
	"Press E or click to interact with objects",
	"Press Esc to open the settings menu",
	"Explore rooms to discover content",
] as const;

// =============================================================================
// Components
// =============================================================================

function ProgressBar({ progress, reducedMotion }: { progress: number; reducedMotion?: boolean }) {
	const clampedProgress = Math.min(100, Math.max(0, progress));
	return (
		<div
			className="relative h-1 w-48 sm:w-64 overflow-hidden rounded-full bg-surface-1"
			role="progressbar"
			aria-valuenow={Math.round(clampedProgress)}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-label="Loading progress"
		>
			<div
				className={cn(
					"h-full rounded-full bg-warm transition-all duration-300",
					!reducedMotion && "animate-pulse"
				)}
				style={{ width: `${clampedProgress}%` }}
			/>
			{/* Shimmer effect */}
			{!reducedMotion && (
				<div
					className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"
					style={{ animationDuration: "2s" }}
				/>
			)}
		</div>
	);
}

function LoadingHint() {
	const [hintIndex, setHintIndex] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setHintIndex((i) => (i + 1) % LOADING_HINTS.length);
		}, 4000);
		return () => clearInterval(interval);
	}, []);

	return (
		<p className="mt-6 px-4 text-center text-xs sm:text-sm text-text-3 animate-fade-in">
			Tip: {LOADING_HINTS[hintIndex]}
		</p>
	);
}

// =============================================================================
// Main Component
// =============================================================================

export function LoadingSequence({
	phase,
	progress,
	status,
	onComplete,
	reducedMotion = false,
}: LoadingSequenceProps) {
	const [showHints, setShowHints] = useState(false);

	// Show hints after a delay
	useEffect(() => {
		const timer = setTimeout(() => setShowHints(true), 2000);
		return () => clearTimeout(timer);
	}, []);

	// Trigger complete callback when ready
	useEffect(() => {
		if (phase === "ready" && onComplete) {
			const timer = setTimeout(onComplete, 500);
			return () => clearTimeout(timer);
		}
	}, [phase, onComplete]);

	// Fade out when complete
	if (phase === "complete") {
		return (
			<div
				className={cn(
					"fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-0",
					"animate-fade-out pointer-events-none"
				)}
			/>
		);
	}

	return (
		<div
			className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-0"
			role="status"
			aria-live="polite"
			aria-busy={phase !== "ready"}
		>
			{/* Logo / Title */}
			<div className="mb-8 text-center">
				<h1 className="font-satoshi text-3xl font-medium text-text-1">
					Interactive World
				</h1>
				<p className="mt-2 text-text-2">
					{PHASE_MESSAGES[phase]}
				</p>
			</div>

			{/* Progress */}
			<ProgressBar progress={progress} reducedMotion={reducedMotion} />

			{/* Status - screen reader only */}
			<p className="mt-4 font-mono text-xs text-text-3">
				{status}
			</p>
			<span className="sr-only">{Math.round(progress)}% complete</span>

			{/* Hints */}
			{showHints && phase !== "ready" && <LoadingHint />}

			{/* Ready prompt */}
			{phase === "ready" && (
				<button
					onClick={onComplete}
					autoFocus
					className={cn(
						"mt-8 rounded-lg bg-warm px-8 py-3 text-lg font-medium text-bg-0",
						"transition-transform hover:scale-105 active:scale-95",
						"focus-visible:ring-2 focus-visible:ring-warm focus-visible:ring-offset-2 focus-visible:ring-offset-bg-0",
						!reducedMotion && "animate-pulse-subtle"
					)}
				>
					Enter World
				</button>
			)}
		</div>
	);
}