"use client";

import { InteractiveShell } from "@/components/interactive/InteractiveShell";

/**
 * Interactive World entry page.
 *
 * This is a client-only route (no SSR) that loads the 3D world.
 * Heavy dependencies (Three.js, R3F) are dynamically imported
 * in InteractiveShell to maintain bundle isolation.
 */
export default function InteractivePage() {
	return <InteractiveShell />;
}
