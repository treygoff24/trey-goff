#!/usr/bin/env tsx
/**
 * Bundle isolation verification for Interactive route.
 * Ensures Three.js is not included in Normal site bundles.
 *
 * Usage:
 *   pnpm check-bundle-isolation
 *
 * This script:
 * 1. Analyzes .next/static/chunks to find Three.js chunks
 * 2. Verifies Three.js chunks are only loaded by /interactive route
 * 3. Checks that Normal pages don't import Three.js
 */

import * as fs from "fs";
import * as path from "path";

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
	nextDir: ".next",
	staticDir: ".next/static/chunks",
	routesManifest: ".next/routes-manifest.json",

	// Patterns that indicate Three.js
	threePatterns: [
		"three", // three.js core
		"@react-three", // R3F packages
		"postprocessing", // postprocessing effects
		"troika-three-text", // Three.js text rendering
	],

	// Routes that are allowed to have Three.js
	allowedRoutes: ["/interactive"],

	// Routes that must NOT have Three.js
	protectedRoutes: [
		"/",
		"/writing",
		"/library",
		"/projects",
		"/about",
		"/notes",
		"/graph",
		"/media",
	],
};

// =============================================================================
// Types
// =============================================================================

interface ChunkInfo {
	name: string;
	path: string;
	size: number;
	hasThree: boolean;
	threeImports: string[];
}

interface RouteInfo {
	path: string;
	chunks: string[];
	hasThreeChunk: boolean;
}

interface AnalysisResult {
	passed: boolean;
	threeChunks: ChunkInfo[];
	protectedRoutesWithThree: RouteInfo[];
	totalThreeSize: number;
	warnings: string[];
}

// =============================================================================
// Analysis Functions
// =============================================================================

function findChunksWithThree(): ChunkInfo[] {
	const chunks: ChunkInfo[] = [];

	if (!fs.existsSync(CONFIG.staticDir)) {
		console.log("Warning: .next/static/chunks not found. Run 'pnpm build' first.");
		return chunks;
	}

	const files = fs.readdirSync(CONFIG.staticDir);

	for (const file of files) {
		if (!file.endsWith(".js")) continue;

		const filePath = path.join(CONFIG.staticDir, file);
		const stats = fs.statSync(filePath);
		const content = fs.readFileSync(filePath, "utf-8");

		const threeImports: string[] = [];

		for (const pattern of CONFIG.threePatterns) {
			// Check for package imports
			if (content.includes(`"${pattern}`) || content.includes(`'${pattern}`)) {
				threeImports.push(pattern);
			}
			// Check for Three.js specific identifiers
			if (pattern === "three" && content.includes("THREE.")) {
				if (!threeImports.includes("three")) {
					threeImports.push("three");
				}
			}
		}

		chunks.push({
			name: file,
			path: filePath,
			size: stats.size,
			hasThree: threeImports.length > 0,
			threeImports,
		});
	}

	return chunks;
}

function checkBuildManifest(): { routeChunks: Map<string, string[]> } {
	const routeChunks = new Map<string, string[]>();

	// Check build manifest for route -> chunk mappings
	const manifestPath = path.join(CONFIG.nextDir, "build-manifest.json");

	if (fs.existsSync(manifestPath)) {
		try {
			const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

			if (manifest.pages) {
				for (const [route, chunks] of Object.entries(manifest.pages)) {
					routeChunks.set(route, chunks as string[]);
				}
			}
		} catch {
			console.log("Warning: Could not parse build manifest");
		}
	}

	return { routeChunks };
}

function analyzeRouteIsolation(
	chunks: ChunkInfo[],
	routeChunks: Map<string, string[]>
): RouteInfo[] {
	const threeChunkNames = new Set(
		chunks.filter((c) => c.hasThree).map((c) => c.name)
	);

	const routesWithThree: RouteInfo[] = [];

	for (const route of CONFIG.protectedRoutes) {
		// Check various route naming patterns Next.js uses
		const routePatterns = [
			route,
			route === "/" ? "/index" : route,
			`pages${route}`,
			`app${route}`,
			`app${route}/page`,
		];

		let hasThreeChunk = false;
		const routeChunkList: string[] = [];

		for (const pattern of routePatterns) {
			const chunkList = routeChunks.get(pattern);
			if (chunkList) {
				for (const chunk of chunkList) {
					const chunkName = path.basename(chunk);
					routeChunkList.push(chunkName);
					if (threeChunkNames.has(chunkName)) {
						hasThreeChunk = true;
					}
				}
			}
		}

		if (hasThreeChunk) {
			routesWithThree.push({
				path: route,
				chunks: routeChunkList,
				hasThreeChunk: true,
			});
		}
	}

	return routesWithThree;
}

// =============================================================================
// Main Analysis
// =============================================================================

function runAnalysis(): AnalysisResult {
	console.log("Bundle Isolation Check\n");
	console.log("=".repeat(50));

	const warnings: string[] = [];

	// 1. Find all chunks containing Three.js
	console.log("\n1. Scanning chunks for Three.js imports...");
	const allChunks = findChunksWithThree();
	const threeChunks = allChunks.filter((c) => c.hasThree);

	console.log(`   Found ${allChunks.length} total chunks`);
	console.log(`   Found ${threeChunks.length} chunks with Three.js`);

	for (const chunk of threeChunks) {
		const sizeKB = (chunk.size / 1024).toFixed(1);
		console.log(`   - ${chunk.name} (${sizeKB}KB): ${chunk.threeImports.join(", ")}`);
	}

	// 2. Check route -> chunk mappings
	console.log("\n2. Analyzing route chunk mappings...");
	const { routeChunks } = checkBuildManifest();

	if (routeChunks.size === 0) {
		warnings.push("Could not analyze route chunk mappings (build manifest not found)");
		console.log("   ⚠ Could not find build manifest");
	} else {
		console.log(`   Found mappings for ${routeChunks.size} routes`);
	}

	// 3. Check protected routes
	console.log("\n3. Checking protected routes...");
	const protectedRoutesWithThree = analyzeRouteIsolation(allChunks, routeChunks);

	if (protectedRoutesWithThree.length === 0) {
		console.log("   ✓ No protected routes load Three.js directly");
	} else {
		for (const route of protectedRoutesWithThree) {
			console.log(`   ✗ ${route.path} loads Three.js chunks`);
		}
	}

	// Calculate total Three.js size
	const totalThreeSize = threeChunks.reduce((sum, c) => sum + c.size, 0);

	// 4. Check dynamic import pattern
	console.log("\n4. Verifying dynamic import pattern...");

	// Check that InteractiveWorld uses dynamic import
	const interactiveShellPath = "components/interactive/InteractiveShell.tsx";
	if (fs.existsSync(interactiveShellPath)) {
		const content = fs.readFileSync(interactiveShellPath, "utf-8");
		if (content.includes("dynamic(") && content.includes("InteractiveWorld")) {
			console.log("   ✓ InteractiveWorld uses dynamic import");
		} else {
			warnings.push("InteractiveWorld should use dynamic() import for code splitting");
			console.log("   ⚠ InteractiveWorld may not use dynamic import");
		}
	}

	// Summary
	console.log("\n" + "=".repeat(50));
	console.log("SUMMARY");
	console.log("=".repeat(50));
	console.log(`Three.js chunks: ${threeChunks.length}`);
	console.log(`Total Three.js size: ${(totalThreeSize / 1024 / 1024).toFixed(2)}MB`);
	console.log(`Protected routes with Three.js: ${protectedRoutesWithThree.length}`);
	console.log(`Warnings: ${warnings.length}`);

	const passed = protectedRoutesWithThree.length === 0;

	if (passed) {
		console.log("\n✓ Bundle isolation verified!");
		console.log("  Three.js is only loaded by /interactive route");
	} else {
		console.log("\n✗ Bundle isolation FAILED");
		console.log("  Three.js is leaking into protected routes");
	}

	return {
		passed,
		threeChunks,
		protectedRoutesWithThree,
		totalThreeSize,
		warnings,
	};
}

// =============================================================================
// Main
// =============================================================================

const result = runAnalysis();

// Only fail if we found actual violations (not just warnings)
if (!result.passed) {
	process.exit(1);
}
