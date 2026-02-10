"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
	detectCapabilities,
	type DeviceCapabilities,
	type QualityTier,
} from "@/lib/interactive/capabilities";

// Lazy load the heavy 3D world to maintain bundle isolation
const InteractiveWorld = dynamic(
	() =>
		import("@/components/interactive/InteractiveWorld").then(
			(m) => m.InteractiveWorld
		),
	{
		ssr: false,
		loading: () => <LoadingScreen status="Loading 3D engine..." />,
	}
);

// Loading status phases
type LoadingPhase =
	| "detecting"
	| "ready"
	| "loading"
	| "warming"
	| "complete"
	| "error"
	| "no-webgl";

interface InteractiveShellProps {
	className?: string;
}

/**
 * InteractiveShell handles:
 * - Capability detection
 * - Quality tier selection
 * - Loading sequence
 * - Non-WebGL fallback
 * - "Return to Normal" button
 */
export function InteractiveShell({ className }: InteractiveShellProps) {
	const [phase, setPhase] = useState<LoadingPhase>("detecting");
	const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(
		null
	);
	const [selectedTier, setSelectedTier] = useState<QualityTier>("auto");
	const [reducedMotion, setReducedMotion] = useState(false);
	const [showWorld, setShowWorld] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Detect capabilities on mount
	useEffect(() => {
		const caps = detectCapabilities();
		setCapabilities(caps);

		if (!caps.webgl2) {
			setPhase("no-webgl");
		} else {
			setSelectedTier(caps.suggestedTier);
			setReducedMotion(caps.reducedMotion);
			setPhase("ready");
		}
	}, []);

	// Handle tier selection and start loading
	const handleEnter = useCallback(() => {
		if (!capabilities?.webgl2) return;
		setPhase("loading");
		setShowWorld(true);
	}, [capabilities]);

	// Handle world load complete
	const handleWorldReady = useCallback(() => {
		setPhase("complete");
	}, []);

	// Handle world error
	const handleWorldError = useCallback((err: Error) => {
		setError(err.message);
		setPhase("error");
	}, []);

	// Handle auto-tuned tier change
	const handleTierChange = useCallback((tier: Exclude<QualityTier, "auto">) => {
		setSelectedTier(tier);
	}, []);

	// Non-WebGL fallback
	if (phase === "no-webgl") {
		return <FallbackUI />;
	}

	// Error state
	if (phase === "error") {
		return <ErrorUI message={error} onRetry={() => window.location.reload()} />;
	}

	// Ready state - show entry UI
	if (phase === "ready" && capabilities) {
		return (
			<EntryUI
				capabilities={capabilities}
				selectedTier={selectedTier}
				onTierChange={setSelectedTier}
				onEnter={handleEnter}
			/>
		);
	}

	// Detecting state
	if (phase === "detecting") {
		return <LoadingScreen status="Detecting capabilities..." />;
	}

	// Loading/playing state
	return (
		<div className={`relative h-screen w-screen ${className ?? ""}`}>
			<a
				href="#return-to-normal"
				className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-warm focus:px-4 focus:py-2 focus:text-bg-0"
				aria-label="Skip past 3D world to navigation"
			>
				Skip to content
			</a>
			{showWorld && (
				<InteractiveWorld
					qualityTier={selectedTier}
					reducedMotion={reducedMotion}
					isMobile={capabilities?.isMobile ?? false}
					onReady={handleWorldReady}
					onError={handleWorldError}
					onTierChange={handleTierChange}
					onQualityChange={setSelectedTier}
					onReducedMotionChange={setReducedMotion}
				/>
			)}

			{/* Loading overlay */}
			{phase === "loading" && (
				<div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-0">
					<LoadingScreen status="Loading assets..." />
				</div>
			)}

			{/* Return to Normal button - always visible */}
			<ReturnToNormalButton />
		</div>
	);
}

// =============================================================================
// Sub-components
// =============================================================================

function LoadingScreen({ status }: { status: string }) {
	return (
		<div className="flex h-screen w-screen flex-col items-center justify-center bg-bg-0">
			<div className="space-y-6 text-center">
				<div className="h-1 w-48 overflow-hidden rounded-full bg-surface-1">
					<div className="h-full w-1/3 animate-pulse rounded-full bg-warm" />
				</div>
				<p className="font-mono text-sm text-text-3">{status}</p>
			</div>
		</div>
	);
}

function EntryUI({
	capabilities,
	selectedTier,
	onTierChange,
	onEnter,
}: {
	capabilities: DeviceCapabilities;
	selectedTier: QualityTier;
	onTierChange: (tier: QualityTier) => void;
	onEnter: () => void;
}) {
	return (
		<div className="flex h-screen w-screen flex-col items-center justify-center bg-bg-0 p-6">
			<div className="w-full max-w-md space-y-8">
				{/* Header */}
				<div className="text-center">
					<h1 className="font-satoshi text-4xl font-medium text-text-1">
						Enter the World
					</h1>
					<p className="mt-3 text-text-2">
						An immersive 3D experience exploring Trey&apos;s work and interests.
					</p>
				</div>

				{/* Capability summary */}
				<div className="rounded-lg border border-surface-1 bg-surface-1/30 p-4 font-mono text-xs text-text-3">
					<div className="flex justify-between">
						<span>WebGL2</span>
						<span className="text-green-400">Available</span>
					</div>
					<div className="flex justify-between">
						<span>Suggested tier</span>
						<span className="capitalize text-warm">
							{capabilities.suggestedTier}
						</span>
					</div>
					{capabilities.reducedMotion && (
						<div className="flex justify-between">
							<span>Reduced motion</span>
							<span>Enabled</span>
						</div>
					)}
				</div>

				{/* Quality tier selection */}
				<div className="space-y-3">
					<label className="block text-sm font-medium text-text-2">
						Quality Tier
					</label>
					<div className="grid grid-cols-4 gap-2" role="group" aria-label="Quality settings">
						{(["auto", "low", "medium", "high"] as const).map((tier) => (
							<button
								key={tier}
								onClick={() => onTierChange(tier)}
								className={`rounded-md px-3 py-2 text-sm capitalize transition-colors ${
									selectedTier === tier
										? "bg-warm text-bg-0"
										: "bg-surface-1 text-text-2 hover:bg-surface-2"
								}`}
							>
								{tier}
							</button>
						))}
					</div>
				</div>

				{/* Entry buttons */}
				<div className="flex flex-col gap-3">
					<button
						onClick={onEnter}
						className="w-full rounded-lg bg-warm py-4 text-lg font-medium text-bg-0 transition-transform hover:scale-[1.02] active:scale-[0.98]"
					>
						Explore Interactive
					</button>
					<Link
						href="/"
						prefetch={false}
						className="block w-full rounded-lg border border-surface-2 bg-transparent py-3 text-center text-text-2 transition-colors hover:border-text-3 hover:text-text-1"
					>
						Stay on Normal Site
					</Link>
				</div>
			</div>

			{/* Return link */}
			<div className="mt-12">
				<Link
					href="/"
					prefetch={false}
					className="text-sm text-text-3 hover:text-text-2"
				>
					&larr; Return to Normal site
				</Link>
			</div>
		</div>
	);
}

function FallbackUI() {
	return (
		<div className="flex h-screen w-screen flex-col items-center justify-center bg-bg-0 p-6">
			<div className="max-w-md space-y-6 text-center">
				<h1 className="font-satoshi text-3xl font-medium text-text-1">
					WebGL Not Available
				</h1>
				<p className="text-text-2">
					The Interactive experience requires WebGL2, which isn&apos;t available on
					this device or browser.
				</p>
				<div className="space-y-3">
					<Link
						href="/"
						prefetch={false}
						className="block w-full rounded-lg bg-warm py-4 text-lg font-medium text-bg-0"
					>
						Visit Normal Site
					</Link>
					<p className="text-xs text-text-3">
						The Normal site has all the same content in a fast, accessible
						format.
					</p>
				</div>
			</div>
		</div>
	);
}

function ErrorUI({
	message,
	onRetry,
}: {
	message: string | null;
	onRetry: () => void;
}) {
	return (
		<div className="flex h-screen w-screen flex-col items-center justify-center bg-bg-0 p-6">
			<div className="max-w-md space-y-6 text-center">
				<h1 className="font-satoshi text-3xl font-medium text-text-1">
					Something Went Wrong
				</h1>
				<p className="text-text-2">
					{message ?? "An error occurred while loading the 3D world."}
				</p>
				<div className="flex flex-col gap-3">
					<button
						onClick={onRetry}
						className="w-full rounded-lg bg-warm py-4 text-lg font-medium text-bg-0"
					>
						Retry
					</button>
					<Link
						href="/"
						prefetch={false}
						className="block w-full rounded-lg border border-surface-2 py-3 text-text-2"
					>
						Return to Normal Site
					</Link>
				</div>
			</div>
		</div>
	);
}

function ReturnToNormalButton() {
	return (
		<Link
			id="return-to-normal"
			href="/"
			prefetch={false}
			className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full border border-surface-2 bg-bg-0/80 px-4 py-2 text-sm text-text-2 backdrop-blur-sm transition-colors hover:border-text-3 hover:text-text-1"
		>
			<span>&larr;</span>
			<span>Return to Normal</span>
		</Link>
	);
}
