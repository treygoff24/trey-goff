/**
 * Telemetry for Interactive route.
 * Tracks load milestones, engagement events, and performance metrics.
 *
 * Note: In production, replace console logging with actual analytics service.
 */

import type { RoomId } from "./types";
import type { QualityTier } from "./capabilities";

// =============================================================================
// Types
// =============================================================================

/** Load milestone events per spec */
export type LoadMilestone =
	| "capability_check_complete"
	| "download_start"
	| "download_complete"
	| "shader_warmup_complete"
	| "first_render"
	| "first_input"
	| "first_controllable_frame";

/** Engagement events per spec */
export type EngagementEvent =
	| "entry_choice"
	| "room_entered"
	| "book_opened"
	| "project_viewed"
	| "quality_tier_changed"
	| "return_to_normal";

/** Performance event types */
export type PerformanceEvent =
	| "fps_sample"
	| "long_frame"
	| "memory_warning"
	| "context_lost";

/** FPS buckets for sampling */
export type FpsBucket = "0-15" | "15-30" | "30-45" | "45-60" | "60+";

// =============================================================================
// Telemetry State
// =============================================================================

interface TelemetryState {
	sessionId: string;
	sessionStartTime: number;
	lastSampleTime: number;
	initialQualityTier: QualityTier | null;
	currentQualityTier: QualityTier | null;
	fpsSamples: number[];
	longFrameCount: number;
	roomDwellTimes: Map<RoomId, { enterTime: number; totalTime: number }>;
}

const state: TelemetryState = {
	sessionId: generateSessionId(),
	sessionStartTime: Date.now(),
	lastSampleTime: Date.now(),
	initialQualityTier: null,
	currentQualityTier: null,
	fpsSamples: [],
	longFrameCount: 0,
	roomDwellTimes: new Map(),
};

function generateSessionId(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// =============================================================================
// Event Dispatch
// =============================================================================

interface TelemetryEvent {
	type: string;
	timestamp: number;
	sessionId: string;
	data: Record<string, unknown>;
}

/** Queue of events to be sent */
const eventQueue: TelemetryEvent[] = [];

/** Maximum queue size before flush */
const MAX_QUEUE_SIZE = 20;

/** Interval for periodic flush (ms) */
const FLUSH_INTERVAL = 10000;

/** Whether telemetry is enabled */
let isEnabled = true;

function queueEvent(type: string, data: Record<string, unknown>): void {
	if (!isEnabled) return;

	const event: TelemetryEvent = {
		type,
		timestamp: Date.now(),
		sessionId: state.sessionId,
		data,
	};

	eventQueue.push(event);

	// Log in development
	if (process.env.NODE_ENV === "development") {
		console.log("[Telemetry]", type, data);
	}

	// Auto-flush if queue is full
	if (eventQueue.length >= MAX_QUEUE_SIZE) {
		flushEvents();
	}
}

function flushEvents(): void {
	if (eventQueue.length === 0) return;

	// In production, send to analytics service
	// For now, just clear the queue
	const events = [...eventQueue];
	eventQueue.length = 0;

	// TODO: Replace with actual analytics call
	// analytics.track(events);

	if (process.env.NODE_ENV === "development") {
		console.log("[Telemetry] Flushed", events.length, "events");
	}
}

// Set up periodic flush
if (typeof window !== "undefined") {
	setInterval(flushEvents, FLUSH_INTERVAL);

	// Flush on page unload
	window.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "hidden") {
			flushEvents();
		}
	});

	window.addEventListener("beforeunload", flushEvents);
}

// =============================================================================
// Load Milestones
// =============================================================================

const milestoneTimings: Map<LoadMilestone, number> = new Map();

/**
 * Record a load milestone.
 */
export function recordMilestone(
	milestone: LoadMilestone,
	metadata?: Record<string, unknown>
): void {
	const now = Date.now();
	milestoneTimings.set(milestone, now);

	const timeSinceStart = now - state.sessionStartTime;

	queueEvent(`milestone:${milestone}`, {
		timeSinceStart,
		...metadata,
	});
}

/**
 * Get time elapsed since session start.
 */
export function getTimeSinceStart(): number {
	return Date.now() - state.sessionStartTime;
}

/**
 * Get time to a specific milestone.
 */
export function getTimeToMilestone(milestone: LoadMilestone): number | null {
	const timing = milestoneTimings.get(milestone);
	if (!timing) return null;
	return timing - state.sessionStartTime;
}

// =============================================================================
// Chunk Download Tracking
// =============================================================================

/**
 * Record chunk download start.
 */
export function recordDownloadStart(chunkId: string): void {
	recordMilestone("download_start", { chunkId });
}

/**
 * Record chunk download complete.
 */
export function recordDownloadComplete(
	chunkId: string,
	sizeBytes: number,
	durationMs: number
): void {
	recordMilestone("download_complete", {
		chunkId,
		sizeBytes,
		durationMs,
		throughputMbps: (sizeBytes * 8) / (durationMs * 1000),
	});
}

// =============================================================================
// Engagement Events
// =============================================================================

/**
 * Record entry choice (Normal vs Interactive).
 */
export function recordEntryChoice(choice: "normal" | "interactive"): void {
	queueEvent("engagement:entry_choice", { choice });
}

/**
 * Record room entered with dwell time tracking.
 */
export function recordRoomEntered(room: RoomId): void {
	const now = Date.now();

	// Calculate dwell time for previous room
	for (const [existingRoom, data] of state.roomDwellTimes) {
		if (existingRoom !== room && data.enterTime > 0) {
			const dwellTime = now - data.enterTime;
			data.totalTime += dwellTime;
			data.enterTime = 0;

			queueEvent("engagement:room_exited", {
				room: existingRoom,
				dwellTimeMs: dwellTime,
			});
		}
	}

	// Start tracking new room
	let roomData = state.roomDwellTimes.get(room);
	if (!roomData) {
		roomData = { enterTime: 0, totalTime: 0 };
		state.roomDwellTimes.set(room, roomData);
	}
	roomData.enterTime = now;

	queueEvent("engagement:room_entered", { room });
}

/**
 * Record book opened.
 */
export function recordBookOpened(bookId: string, bookTitle: string): void {
	queueEvent("engagement:book_opened", { bookId, bookTitle });
}

/**
 * Record project viewed.
 */
export function recordProjectViewed(
	projectId: string,
	projectTitle: string
): void {
	queueEvent("engagement:project_viewed", { projectId, projectTitle });
}

/**
 * Record quality tier change.
 */
export function recordQualityTierChange(
	fromTier: QualityTier,
	toTier: QualityTier,
	reason: "user" | "auto"
): void {
	if (!state.initialQualityTier) {
		state.initialQualityTier = fromTier;
	}
	state.currentQualityTier = toTier;

	queueEvent("engagement:quality_tier_changed", {
		fromTier,
		toTier,
		reason,
		initialTier: state.initialQualityTier,
	});
}

/**
 * Record return to normal site.
 */
export function recordReturnToNormal(fromRoom: RoomId | null): void {
	queueEvent("engagement:return_to_normal", {
		fromRoom,
		sessionDurationMs: Date.now() - state.sessionStartTime,
		roomsVisited: Array.from(state.roomDwellTimes.keys()),
	});
	flushEvents();
}

// =============================================================================
// Performance Sampling
// =============================================================================

const SAMPLE_INTERVAL = 5000; // 5 seconds

/**
 * Get FPS bucket for a given FPS value.
 */
function getFpsBucket(fps: number): FpsBucket {
	if (fps < 15) return "0-15";
	if (fps < 30) return "15-30";
	if (fps < 45) return "30-45";
	if (fps < 60) return "45-60";
	return "60+";
}

/**
 * Record FPS sample. Should be called every frame.
 */
export function recordFpsSample(fps: number): void {
	state.fpsSamples.push(fps);

	const now = Date.now();
	if (now - state.lastSampleTime >= SAMPLE_INTERVAL) {
		// Calculate average FPS over the interval
		const avgFps =
			state.fpsSamples.length > 0
				? state.fpsSamples.reduce((a, b) => a + b, 0) / state.fpsSamples.length
				: 0;

		queueEvent("performance:fps_sample", {
			bucket: getFpsBucket(avgFps),
			avgFps: Math.round(avgFps),
			sampleCount: state.fpsSamples.length,
			initialTier: state.initialQualityTier,
			currentTier: state.currentQualityTier,
		});

		state.fpsSamples = [];
		state.lastSampleTime = now;
	}
}

/**
 * Record a long frame (>50ms).
 */
export function recordLongFrame(frameTimeMs: number): void {
	if (frameTimeMs <= 50) return;

	state.longFrameCount++;

	queueEvent("performance:long_frame", {
		frameTimeMs,
		longFrameCount: state.longFrameCount,
	});
}

/**
 * Record memory warning.
 */
export function recordMemoryWarning(usedMb: number, limitMb: number): void {
	queueEvent("performance:memory_warning", {
		usedMb,
		limitMb,
		percentUsed: (usedMb / limitMb) * 100,
	});
}

/**
 * Record WebGL context lost.
 */
export function recordContextLost(): void {
	queueEvent("performance:context_lost", {
		sessionDurationMs: Date.now() - state.sessionStartTime,
	});
	flushEvents();
}

// =============================================================================
// Configuration
// =============================================================================

/**
 * Enable or disable telemetry.
 */
export function setTelemetryEnabled(enabled: boolean): void {
	isEnabled = enabled;
}

/**
 * Check if telemetry is enabled.
 */
export function isTelemetryEnabled(): boolean {
	return isEnabled;
}

/**
 * Get current session ID.
 */
export function getSessionId(): string {
	return state.sessionId;
}

/**
 * Reset telemetry state (for testing).
 */
export function resetTelemetry(): void {
	state.sessionId = generateSessionId();
	state.sessionStartTime = Date.now();
	state.lastSampleTime = Date.now();
	state.initialQualityTier = null;
	state.currentQualityTier = null;
	state.fpsSamples = [];
	state.longFrameCount = 0;
	state.roomDwellTimes.clear();
	milestoneTimings.clear();
	eventQueue.length = 0;
}
