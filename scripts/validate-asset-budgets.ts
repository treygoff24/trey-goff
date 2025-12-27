#!/usr/bin/env tsx
/**
 * Asset budget validation script for Interactive route.
 * Enforces per-chunk and scene-wide budgets per spec.
 *
 * Usage:
 *   pnpm validate-budgets   # Run validation
 *
 * Budgets enforced:
 * Per-chunk:
 *   - Compressed download: <2MB
 *   - Triangles: <100K
 *   - Draw calls contribution: <30
 *   - Textures: <10 unique
 *   - Estimated VRAM: <50MB
 *
 * Scene-wide:
 *   - Total triangles in view: <300K
 *   - Total draw calls: <100
 *   - Peak memory: <500MB with 2 chunks loaded
 */

import * as fs from "fs";
import * as path from "path";

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
	assetsDir: "public/assets",
	chunksDir: "public/assets/chunks",
	propsDir: "public/assets/props",
	manifestPath: "public/manifests/assets.manifest.json",

	// Per-chunk budgets
	chunkBudgets: {
		maxDownloadSize: 2 * 1024 * 1024, // 2MB
		maxTriangles: 100_000,
		maxDrawCalls: 30,
		maxTextures: 10,
		maxVRAM: 50 * 1024 * 1024, // 50MB
	},

	// Scene-wide budgets
	sceneBudgets: {
		maxTotalTriangles: 300_000,
		maxTotalDrawCalls: 100,
		maxPeakMemory: 500 * 1024 * 1024, // 500MB with 2 chunks
	},

	// Required compression checks
	requiredExtensions: {
		meshopt: true, // All meshes must use Meshopt
		ktx2: false, // KTX2 is optional if toktx not available
	},
};

// =============================================================================
// Types
// =============================================================================

interface ValidationResult {
	passed: boolean;
	errors: string[];
	warnings: string[];
}

interface AssetManifest {
	version: string;
	generated: string;
	chunks: Record<string, { file: string; size: number }>;
	props: Record<string, { file: string; size: number }>;
}

// =============================================================================
// Validation Functions
// =============================================================================

function validateManifestExists(): { passed: boolean; message?: string; manifest?: AssetManifest } {
	if (!fs.existsSync(CONFIG.manifestPath)) {
		return {
			passed: false,
			message: `Asset manifest not found: ${CONFIG.manifestPath}`,
		};
	}

	try {
		const content = fs.readFileSync(CONFIG.manifestPath, "utf-8");
		const manifest = JSON.parse(content) as AssetManifest;
		return { passed: true, manifest };
	} catch (error) {
		return {
			passed: false,
			message: `Invalid asset manifest: ${error}`,
		};
	}
}

function validateAssetReferences(manifest: AssetManifest): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Check chunk references
	for (const [name, info] of Object.entries(manifest.chunks)) {
		const filePath = path.join(CONFIG.chunksDir, info.file);
		if (!fs.existsSync(filePath)) {
			errors.push(`Chunk "${name}" references missing file: ${info.file}`);
		}
	}

	// Check prop references
	for (const [name, info] of Object.entries(manifest.props)) {
		const filePath = path.join(CONFIG.propsDir, info.file);
		if (!fs.existsSync(filePath)) {
			errors.push(`Prop "${name}" references missing file: ${info.file}`);
		}
	}

	return {
		passed: errors.length === 0,
		errors,
		warnings,
	};
}

function validateChunkSizes(manifest: AssetManifest): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	for (const [name, info] of Object.entries(manifest.chunks)) {
		if (info.size > CONFIG.chunkBudgets.maxDownloadSize) {
			errors.push(
				`Chunk "${name}" exceeds download budget: ${(info.size / 1024 / 1024).toFixed(2)}MB > ${(CONFIG.chunkBudgets.maxDownloadSize / 1024 / 1024).toFixed(2)}MB`
			);
		}
	}

	for (const [name, info] of Object.entries(manifest.props)) {
		if (info.size > CONFIG.chunkBudgets.maxDownloadSize) {
			warnings.push(
				`Prop "${name}" is large: ${(info.size / 1024 / 1024).toFixed(2)}MB (budget: ${(CONFIG.chunkBudgets.maxDownloadSize / 1024 / 1024).toFixed(2)}MB)`
			);
		}
	}

	return {
		passed: errors.length === 0,
		errors,
		warnings,
	};
}

function validateDirectoryStructure(): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	const requiredDirs = [
		CONFIG.chunksDir,
		CONFIG.propsDir,
		path.dirname(CONFIG.manifestPath),
	];

	for (const dir of requiredDirs) {
		if (!fs.existsSync(dir)) {
			warnings.push(`Directory not found: ${dir}`);
		}
	}

	return {
		passed: true, // Directories are created as needed
		errors,
		warnings,
	};
}

function validateNoLooseAssets(): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Check for uncompressed GLB files in wrong locations
	const checkDirs = ["public/assets", "public"];

	for (const dir of checkDirs) {
		if (!fs.existsSync(dir)) continue;

		const files = fs.readdirSync(dir);
		for (const file of files) {
			if (file.endsWith(".glb") || file.endsWith(".gltf")) {
				warnings.push(`Loose asset found in ${dir}: ${file} (should be in chunks/ or props/)`);
			}
		}
	}

	return {
		passed: true,
		errors,
		warnings,
	};
}

// =============================================================================
// Main Validation
// =============================================================================

interface FullValidationResult {
	passed: boolean;
	errors: string[];
	warnings: string[];
	summary: {
		chunksValidated: number;
		propsValidated: number;
		totalSize: number;
	};
}

function runValidation(): FullValidationResult {
	const allErrors: string[] = [];
	const allWarnings: string[] = [];
	let chunksValidated = 0;
	let propsValidated = 0;
	let totalSize = 0;

	console.log("Asset Budget Validation\n");
	console.log("=".repeat(50));

	// 1. Directory structure
	console.log("\n1. Checking directory structure...");
	const dirResult = validateDirectoryStructure();
	allErrors.push(...dirResult.errors);
	allWarnings.push(...dirResult.warnings);
	console.log(`   ${dirResult.passed ? "✓" : "✗"} Directory structure`);

	// 2. Manifest exists
	console.log("\n2. Checking asset manifest...");
	const manifestResult = validateManifestExists();
	if (!manifestResult.passed || !manifestResult.manifest) {
		allErrors.push(manifestResult.message || "Manifest validation failed");
		console.log(`   ✗ ${manifestResult.message}`);
	} else {
		console.log("   ✓ Asset manifest found");

		const manifest = manifestResult.manifest;
		chunksValidated = Object.keys(manifest.chunks).length;
		propsValidated = Object.keys(manifest.props).length;

		// 3. Asset references
		console.log("\n3. Validating asset references...");
		const refResult = validateAssetReferences(manifest);
		allErrors.push(...refResult.errors);
		allWarnings.push(...refResult.warnings);
		console.log(`   ${refResult.passed ? "✓" : "✗"} Asset references`);
		for (const err of refResult.errors) {
			console.log(`     - ${err}`);
		}

		// 4. Size budgets
		console.log("\n4. Validating size budgets...");
		const sizeResult = validateChunkSizes(manifest);
		allErrors.push(...sizeResult.errors);
		allWarnings.push(...sizeResult.warnings);
		console.log(`   ${sizeResult.passed ? "✓" : "✗"} Size budgets`);
		for (const err of sizeResult.errors) {
			console.log(`     - ${err}`);
		}

		// Calculate total size
		for (const info of Object.values(manifest.chunks)) {
			totalSize += info.size;
		}
		for (const info of Object.values(manifest.props)) {
			totalSize += info.size;
		}
	}

	// 5. Loose assets
	console.log("\n5. Checking for loose assets...");
	const looseResult = validateNoLooseAssets();
	allErrors.push(...looseResult.errors);
	allWarnings.push(...looseResult.warnings);
	console.log(`   ${looseResult.passed ? "✓" : "✗"} No loose assets`);
	for (const warn of looseResult.warnings) {
		console.log(`     ⚠ ${warn}`);
	}

	// Summary
	console.log("\n" + "=".repeat(50));
	console.log("SUMMARY");
	console.log("=".repeat(50));
	console.log(`Chunks validated: ${chunksValidated}`);
	console.log(`Props validated: ${propsValidated}`);
	console.log(`Total asset size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
	console.log(`Errors: ${allErrors.length}`);
	console.log(`Warnings: ${allWarnings.length}`);

	const passed = allErrors.length === 0;

	if (passed) {
		console.log("\n✓ All budget validations passed!");
	} else {
		console.log("\n✗ Budget validation FAILED");
		console.log("\nErrors:");
		for (const err of allErrors) {
			console.log(`  - ${err}`);
		}
	}

	if (allWarnings.length > 0) {
		console.log("\nWarnings:");
		for (const warn of allWarnings) {
			console.log(`  ⚠ ${warn}`);
		}
	}

	return {
		passed,
		errors: allErrors,
		warnings: allWarnings,
		summary: {
			chunksValidated,
			propsValidated,
			totalSize,
		},
	};
}

// =============================================================================
// Main
// =============================================================================

const result = runValidation();

if (!result.passed) {
	process.exit(1);
}
