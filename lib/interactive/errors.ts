/**
 * Error handling utilities for Interactive route.
 * Provides error types, recovery strategies, and fallback handling.
 */

import { recordContextLost, recordMemoryWarning } from "./telemetry";

// =============================================================================
// Error Types
// =============================================================================

/** Base error class for Interactive errors */
export class InteractiveError extends Error {
	constructor(
		message: string,
		public readonly recoverable: boolean = true,
		public readonly code?: string
	) {
		super(message);
		this.name = "InteractiveError";
	}
}

/** WebGL context lost error */
export class ContextLostError extends InteractiveError {
	constructor() {
		super(
			"WebGL context was lost. This can happen due to GPU driver issues or memory pressure.",
			true,
			"CONTEXT_LOST"
		);
		this.name = "ContextLostError";
	}
}

/** Chunk load failure error */
export class ChunkLoadError extends InteractiveError {
	constructor(
		public readonly chunkId: string,
		public readonly attempts: number,
		originalError?: Error
	) {
		super(
			`Failed to load chunk "${chunkId}" after ${attempts} attempts${
				originalError ? `: ${originalError.message}` : ""
			}`,
			true,
			"CHUNK_LOAD_FAILED"
		);
		this.name = "ChunkLoadError";
	}
}

/** Memory exhaustion error */
export class MemoryExhaustionError extends InteractiveError {
	constructor(
		public readonly usedMb: number,
		public readonly estimatedLimitMb: number
	) {
		super(
			`Memory limit approached: ${usedMb.toFixed(0)}MB / ${estimatedLimitMb.toFixed(0)}MB`,
			true,
			"MEMORY_EXHAUSTION"
		);
		this.name = "MemoryExhaustionError";
	}
}

/** Shader compilation error */
export class ShaderError extends InteractiveError {
	constructor(
		public readonly materialName: string,
		originalError?: Error
	) {
		super(
			`Shader compilation failed for "${materialName}"${
				originalError ? `: ${originalError.message}` : ""
			}`,
			true,
			"SHADER_COMPILATION_FAILED"
		);
		this.name = "ShaderError";
	}
}

// =============================================================================
// Recovery Strategies
// =============================================================================

export interface RecoveryResult {
	success: boolean;
	action: "reload" | "downgrade" | "fallback" | "retry" | "none";
	message?: string;
}

/**
 * Get recovery strategy for an error.
 */
export function getRecoveryStrategy(
	error: Error,
	currentAttempts: number
): RecoveryResult {
	// Context lost - prompt reload
	if (error instanceof ContextLostError) {
		recordContextLost();
		return {
			success: false,
			action: "reload",
			message: "The 3D renderer needs to restart. Click to reload.",
		};
	}

	// Chunk load failure - retry with backoff
	if (error instanceof ChunkLoadError) {
		if (error.attempts < 3) {
			return {
				success: true,
				action: "retry",
				message: `Retrying... (attempt ${error.attempts + 1}/3)`,
			};
		}
		return {
			success: false,
			action: "fallback",
			message: "Unable to load this area. Try returning to the main hall.",
		};
	}

	// Memory exhaustion - try to recover
	if (error instanceof MemoryExhaustionError) {
		recordMemoryWarning(error.usedMb, error.estimatedLimitMb);
		if (currentAttempts < 2) {
			return {
				success: true,
				action: "downgrade",
				message: "Reducing quality to free memory...",
			};
		}
		return {
			success: false,
			action: "reload",
			message: "Memory limit reached. Reload recommended.",
		};
	}

	// Shader error - use fallback materials
	if (error instanceof ShaderError) {
		return {
			success: true,
			action: "fallback",
			message: "Using simplified materials.",
		};
	}

	// Unknown error - generic handling
	if (currentAttempts < 3) {
		return {
			success: true,
			action: "retry",
			message: "Something went wrong. Retrying...",
		};
	}

	return {
		success: false,
		action: "reload",
		message: error.message || "An unexpected error occurred.",
	};
}

// =============================================================================
// Memory Monitoring
// =============================================================================

interface MemoryInfo {
	usedJSHeapSize: number;
	totalJSHeapSize: number;
	jsHeapSizeLimit: number;
}

/**
 * Check if memory is under pressure.
 * Returns usage percentage (0-100) or null if not available.
 */
export function checkMemoryPressure(): {
	usagePct: number;
	usedMb: number;
	limitMb: number;
} | null {
	// Chrome-only API
	if (typeof performance === "undefined") return null;

	const memory = (performance as Performance & { memory?: MemoryInfo }).memory;
	if (!memory) return null;

	const usedMb = memory.usedJSHeapSize / (1024 * 1024);
	const limitMb = memory.jsHeapSizeLimit / (1024 * 1024);
	const usagePct = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

	return { usagePct, usedMb, limitMb };
}

/**
 * Monitor for memory pressure.
 * Returns cleanup function.
 */
export function monitorMemory(
	onWarning: (usedMb: number, limitMb: number) => void,
	warningThreshold = 80 // percent
): () => void {
	const intervalId = setInterval(() => {
		const pressure = checkMemoryPressure();
		if (pressure && pressure.usagePct > warningThreshold) {
			onWarning(pressure.usedMb, pressure.limitMb);
		}
	}, 5000);

	return () => clearInterval(intervalId);
}

// =============================================================================
// Tab Suspension Recovery
// =============================================================================

/**
 * Monitor for tab suspension/restoration.
 * Returns cleanup function.
 */
export function monitorTabSuspension(
	onRestore: () => void,
	onSuspend?: () => void
): () => void {
	let wasHidden = false;

	const handleVisibilityChange = () => {
		if (document.visibilityState === "hidden") {
			wasHidden = true;
			onSuspend?.();
		} else if (document.visibilityState === "visible" && wasHidden) {
			wasHidden = false;
			onRestore();
		}
	};

	document.addEventListener("visibilitychange", handleVisibilityChange);

	return () => {
		document.removeEventListener("visibilitychange", handleVisibilityChange);
	};
}

// =============================================================================
// Retry Utilities
// =============================================================================

/**
 * Retry an async operation with exponential backoff.
 */
export async function retryWithBackoff<T>(
	operation: () => Promise<T>,
	maxAttempts: number = 3,
	baseDelayMs: number = 1000
): Promise<T> {
	let lastError: Error = new Error("Operation failed");

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			if (attempt < maxAttempts) {
				const delay = baseDelayMs * Math.pow(2, attempt - 1);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	throw lastError;
}
