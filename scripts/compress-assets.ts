#!/usr/bin/env tsx
/**
 * Asset compression script for Interactive route.
 * Applies KTX2 texture compression and Meshopt geometry compression to GLB files.
 *
 * Usage:
 *   pnpm compress-assets           # Compress all assets
 *   pnpm compress-assets --watch   # Watch for changes (dev mode)
 *
 * Input: public/assets/source/*.glb (uncompressed)
 * Output: public/assets/chunks/*.glb (compressed with content hash)
 *         public/assets/props/*.glb (compressed with content hash)
 */

import { execSync } from "child_process";
import { createHash } from "crypto";
import * as fs from "fs";
import * as path from "path";

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
	sourceDir: "public/assets/source",
	chunkOutputDir: "public/assets/chunks",
	propOutputDir: "public/assets/props",
	manifestDir: "public/manifests",

	// KTX2 compression settings
	ktx2: {
		// UASTC for hero assets (higher quality, larger size)
		heroAssets: ["mech.glb", "exterior.glb"],
		// ETC1S for background assets (smaller size, lower quality)
		defaultMode: "etc1s",
		heroMode: "uastc",
	},

	// Asset categorization
	propAssets: ["mech.glb", "books-atlas.glb", "plates.glb"],
	chunkAssets: [
		"exterior.glb",
		"mainhall.glb",
		"library.glb",
		"gym.glb",
		"projects.glb",
		"garage.glb",
	],
};

// =============================================================================
// Utility Functions
// =============================================================================

function ensureDir(dir: string): void {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

function getFileHash(filePath: string): string {
	const content = fs.readFileSync(filePath);
	return createHash("md5").update(content).digest("hex").slice(0, 8);
}

function getOutputFileName(sourceName: string, hash: string): string {
	const baseName = path.basename(sourceName, ".glb");
	return `${baseName}-${hash}.glb`;
}

function cleanOldVersions(outputDir: string, baseName: string): void {
	const files = fs.readdirSync(outputDir);
	const pattern = new RegExp(`^${baseName}-[a-f0-9]{8}\\.glb$`);
	for (const file of files) {
		if (pattern.test(file)) {
			fs.unlinkSync(path.join(outputDir, file));
			console.log(`  Removed old version: ${file}`);
		}
	}
}

// =============================================================================
// Compression Functions
// =============================================================================

interface CompressionResult {
	sourceName: string;
	outputName: string;
	outputPath: string;
	sourceSize: number;
	outputSize: number;
	compressionRatio: number;
}

async function compressAsset(
	sourcePath: string,
	outputDir: string,
	useUastc: boolean
): Promise<CompressionResult | null> {
	const sourceName = path.basename(sourcePath);
	const baseName = path.basename(sourceName, ".glb");

	if (!fs.existsSync(sourcePath)) {
		console.log(`  Skipping ${sourceName}: source file not found`);
		return null;
	}

	const sourceSize = fs.statSync(sourcePath).size;
	const tempPath = path.join(outputDir, `${baseName}-temp.glb`);
	const hash = getFileHash(sourcePath);
	const outputName = getOutputFileName(sourceName, hash);
	const outputPath = path.join(outputDir, outputName);

	// Skip if output already exists and is up-to-date
	if (fs.existsSync(outputPath)) {
		console.log(`  Skipping ${sourceName}: already compressed (${outputName})`);
		const outputSize = fs.statSync(outputPath).size;
		return {
			sourceName,
			outputName,
			outputPath,
			sourceSize,
			outputSize,
			compressionRatio: sourceSize / outputSize,
		};
	}

	console.log(`  Compressing ${sourceName}...`);

	// Clean old versions
	cleanOldVersions(outputDir, baseName);

	try {
		// Step 1: Apply Meshopt compression
		const meshoptCmd = [
			"npx gltf-transform optimize",
			`"${sourcePath}"`,
			`"${tempPath}"`,
			"--compress meshopt",
		].join(" ");

		execSync(meshoptCmd, { stdio: "pipe" });

		// Step 2: Apply KTX2 texture compression
		// Note: Requires KTX-Software CLI tools installed
		// For CI, we'll skip KTX2 if toktx isn't available
		const ktx2Mode = useUastc ? "uastc" : "etc1s";
		const ktx2Cmd = [
			"npx gltf-transform ktx2",
			`"${tempPath}"`,
			`"${outputPath}"`,
			`--mode ${ktx2Mode}`,
		].join(" ");

		try {
			execSync(ktx2Cmd, { stdio: "pipe" });
			// Remove temp file
			fs.unlinkSync(tempPath);
		} catch {
			// KTX2 compression failed (likely missing toktx), use meshopt-only
			console.log(`    Warning: KTX2 compression skipped (toktx not found)`);
			fs.renameSync(tempPath, outputPath);
		}

		const outputSize = fs.statSync(outputPath).size;
		const ratio = sourceSize / outputSize;

		console.log(
			`    ${(sourceSize / 1024).toFixed(1)}KB → ${(outputSize / 1024).toFixed(1)}KB (${ratio.toFixed(1)}x)`
		);

		return {
			sourceName,
			outputName,
			outputPath,
			sourceSize,
			outputSize,
			compressionRatio: ratio,
		};
	} catch (error) {
		console.error(`    Error compressing ${sourceName}:`, error);
		// Clean up temp file if it exists
		if (fs.existsSync(tempPath)) {
			fs.unlinkSync(tempPath);
		}
		return null;
	}
}

// =============================================================================
// Manifest Generation
// =============================================================================

interface AssetManifest {
	version: string;
	generated: string;
	chunks: Record<string, { file: string; size: number }>;
	props: Record<string, { file: string; size: number }>;
}

function generateAssetManifest(results: CompressionResult[]): void {
	const manifest: AssetManifest = {
		version: "1.0.0",
		generated: new Date().toISOString(),
		chunks: {},
		props: {},
	};

	for (const result of results) {
		const baseName = path.basename(result.sourceName, ".glb");
		const entry = { file: result.outputName, size: result.outputSize };

		if (CONFIG.propAssets.some((p) => p.startsWith(baseName))) {
			manifest.props[baseName] = entry;
		} else {
			manifest.chunks[baseName] = entry;
		}
	}

	const manifestPath = path.join(CONFIG.manifestDir, "assets.manifest.json");
	fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
	console.log(`\nGenerated asset manifest: ${manifestPath}`);
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
	console.log("Asset Compression Pipeline\n");

	// Ensure directories exist
	ensureDir(CONFIG.sourceDir);
	ensureDir(CONFIG.chunkOutputDir);
	ensureDir(CONFIG.propOutputDir);
	ensureDir(CONFIG.manifestDir);

	// Check if source directory has any GLB files
	const sourceFiles = fs.existsSync(CONFIG.sourceDir)
		? fs.readdirSync(CONFIG.sourceDir).filter((f) => f.endsWith(".glb"))
		: [];

	if (sourceFiles.length === 0) {
		console.log(`No source GLB files found in ${CONFIG.sourceDir}`);
		console.log("Creating placeholder asset manifest...\n");

		// Create empty manifest for CI to pass
		const emptyManifest: AssetManifest = {
			version: "1.0.0",
			generated: new Date().toISOString(),
			chunks: {},
			props: {},
		};
		const manifestPath = path.join(CONFIG.manifestDir, "assets.manifest.json");
		fs.writeFileSync(manifestPath, JSON.stringify(emptyManifest, null, 2));
		console.log(`Created empty asset manifest: ${manifestPath}`);
		return;
	}

	const results: CompressionResult[] = [];

	// Process chunk assets
	console.log("Processing chunk assets:");
	for (const asset of CONFIG.chunkAssets) {
		const sourcePath = path.join(CONFIG.sourceDir, asset);
		const useUastc = CONFIG.ktx2.heroAssets.includes(asset);
		const result = await compressAsset(sourcePath, CONFIG.chunkOutputDir, useUastc);
		if (result) results.push(result);
	}

	// Process prop assets
	console.log("\nProcessing prop assets:");
	for (const asset of CONFIG.propAssets) {
		const sourcePath = path.join(CONFIG.sourceDir, asset);
		const useUastc = CONFIG.ktx2.heroAssets.includes(asset);
		const result = await compressAsset(sourcePath, CONFIG.propOutputDir, useUastc);
		if (result) results.push(result);
	}

	// Generate manifest
	if (results.length > 0) {
		generateAssetManifest(results);
	}

	// Summary
	console.log("\n=== Compression Summary ===");
	console.log(`Total assets processed: ${results.length}`);
	if (results.length > 0) {
		const totalSource = results.reduce((sum, r) => sum + r.sourceSize, 0);
		const totalOutput = results.reduce((sum, r) => sum + r.outputSize, 0);
		console.log(`Total size: ${(totalSource / 1024 / 1024).toFixed(2)}MB → ${(totalOutput / 1024 / 1024).toFixed(2)}MB`);
		console.log(`Average compression: ${(totalSource / totalOutput).toFixed(1)}x`);
	}
}

main().catch(console.error);
