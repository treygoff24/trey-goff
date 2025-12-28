/**
 * Generate runtime manifests for the Interactive route.
 * Reads from content sources and outputs JSON manifests to public/manifests/.
 */

import { allEssays, allProjects } from "content-collections";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import type { BooksData } from "@/lib/books/types";
import type {
	EssaysManifest,
	EssayManifestEntry,
	BooksManifest,
	BookManifestEntry,
	BookTier,
	ProjectsManifest,
	ProjectManifestEntry,
	LiftsManifest,
	LiftsManifestEntry,
	LiftName,
	LiftRecord,
} from "@/lib/interactive/manifest-types";

const MANIFEST_VERSION = "1.0.0";
const MANIFESTS_DIR = "./public/manifests";

// =============================================================================
// Essays Manifest
// =============================================================================

function generateEssaysManifest(): EssaysManifest {
	const entries: EssayManifestEntry[] = allEssays
		.filter((essay) => essay.status !== "draft")
		.map((essay) => ({
			id: essay.slug,
			slug: essay.slug,
			title: essay.title,
			excerpt: essay.summary,
			tags: essay.tags,
			publishedAt: essay.date,
			readingTime: essay.readingTime,
			status: essay.status,
		}))
		.sort(
			(a, b) =>
				new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
		);

	return {
		version: MANIFEST_VERSION,
		generated: new Date().toISOString(),
		entries,
	};
}

// =============================================================================
// Books Manifest
// =============================================================================

function statusToTier(
	status: string,
	rating?: number
): BookTier {
	// Map book status to display tier
	if (status === "read" && rating === 5) return "favorites";
	if (status === "read" && rating && rating >= 4) return "recommended";
	if (status === "read") return "read";
	if (status === "reading") return "reading";
	return "want";
}

function generateBooksManifest(): BooksManifest {
	let booksData: BooksData;

	try {
		booksData = JSON.parse(
			readFileSync("./content/library/books.json", "utf-8")
		);
	} catch {
		console.warn("Could not read books.json, generating empty manifest");
		return {
			version: MANIFEST_VERSION,
			generated: new Date().toISOString(),
			entries: [],
		};
	}

	const entries: BookManifestEntry[] = booksData.books
		.filter((book) => book.status !== "abandoned")
		.map((book) => ({
			id: book.id,
			title: book.title,
			author: book.author,
			rating: book.rating,
			tier: statusToTier(book.status, book.rating),
			blurb: book.whyILoveIt,
			topics: book.topics,
			year: book.year,
			// Cover image resolved at build time, stored in public/covers/
			coverImage: book.coverUrl || `/covers/${book.id}.jpg`,
		}))
		.sort((a, b) => {
			// Sort by tier priority, then by rating, then by title
			const tierOrder: Record<BookTier, number> = {
				favorites: 0,
				recommended: 1,
				read: 2,
				reading: 3,
				want: 4,
			};
			const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
			if (tierDiff !== 0) return tierDiff;

			const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
			if (ratingDiff !== 0) return ratingDiff;

			return a.title.localeCompare(b.title);
		});

	return {
		version: MANIFEST_VERSION,
		generated: new Date().toISOString(),
		entries,
	};
}

// =============================================================================
// Projects Manifest
// =============================================================================

function generateProjectsManifest(): ProjectsManifest {
	const entries: ProjectManifestEntry[] = allProjects
		.map((project) => ({
			id: project.slug,
			title: project.name,
			summary: project.oneLiner,
			links: project.links,
			images: project.images,
			tags: project.tags,
			status: project.status,
			type: project.type,
			featuredRank: project.featuredRank,
		}))
		.sort((a, b) => {
			// Sort by featured rank (lower = more featured), then by status
			const rankA = a.featuredRank ?? 999;
			const rankB = b.featuredRank ?? 999;
			if (rankA !== rankB) return rankA - rankB;

			const statusOrder: Record<ProjectManifestEntry["status"], number> = {
				active: 0,
				shipped: 1,
				"on-hold": 2,
				idea: 3,
				archived: 4,
			};
			return statusOrder[a.status] - statusOrder[b.status];
		});

	return {
		version: MANIFEST_VERSION,
		generated: new Date().toISOString(),
		entries,
	};
}

// =============================================================================
// Lifts Manifest
// =============================================================================

interface LiftsSourceData {
	lastUpdated: string;
	lifts: {
		squat: LiftRecord;
		bench: LiftRecord;
		deadlift: LiftRecord;
	};
	history?: {
		squat?: LiftRecord[];
		bench?: LiftRecord[];
		deadlift?: LiftRecord[];
	};
}

function generateLiftsManifest(): LiftsManifest {
	const liftsPath = "./data/lifts.json";

	if (!existsSync(liftsPath)) {
		console.warn("No lifts.json found, generating empty manifest");
		return {
			version: MANIFEST_VERSION,
			generated: new Date().toISOString(),
			total: { weight: 0, unit: "lb", date: new Date().toISOString() },
			lifts: [],
		};
	}

	let liftsData: LiftsSourceData;
	try {
		liftsData = JSON.parse(readFileSync(liftsPath, "utf-8"));
	} catch {
		console.warn("Could not parse lifts.json, generating empty manifest");
		return {
			version: MANIFEST_VERSION,
			generated: new Date().toISOString(),
			total: { weight: 0, unit: "lb", date: new Date().toISOString() },
			lifts: [],
		};
	}

	const liftNames: LiftName[] = ["squat", "bench", "deadlift"];
	const lifts: LiftsManifestEntry[] = liftNames.map((lift) => ({
		lift,
		pr: liftsData.lifts[lift],
		history: liftsData.history?.[lift],
	}));

	// Calculate total (sum of PRs)
	const totalWeight =
		liftsData.lifts.squat.weight +
		liftsData.lifts.bench.weight +
		liftsData.lifts.deadlift.weight;

	// Find most recent PR date for total (use deadlift as fallback since we always have all 3)
	const mostRecentDate = [
		liftsData.lifts.squat.date,
		liftsData.lifts.bench.date,
		liftsData.lifts.deadlift.date,
	].sort((a, b) => b.localeCompare(a))[0] || liftsData.lifts.deadlift.date;

	const total: LiftRecord = {
		weight: totalWeight,
		unit: liftsData.lifts.squat.unit, // Assume all same unit
		date: mostRecentDate,
	};

	return {
		version: MANIFEST_VERSION,
		generated: new Date().toISOString(),
		total,
		lifts,
	};
}

// =============================================================================
// Main
// =============================================================================

function main() {
	// Ensure manifests directory exists
	mkdirSync(MANIFESTS_DIR, { recursive: true });

	// Generate all manifests
	const essays = generateEssaysManifest();
	const books = generateBooksManifest();
	const projects = generateProjectsManifest();
	const lifts = generateLiftsManifest();

	// Write manifests
	writeFileSync(
		`${MANIFESTS_DIR}/essays.manifest.json`,
		JSON.stringify(essays, null, 2)
	);
	writeFileSync(
		`${MANIFESTS_DIR}/books.manifest.json`,
		JSON.stringify(books, null, 2)
	);
	writeFileSync(
		`${MANIFESTS_DIR}/projects.manifest.json`,
		JSON.stringify(projects, null, 2)
	);
	writeFileSync(
		`${MANIFESTS_DIR}/lifts.manifest.json`,
		JSON.stringify(lifts, null, 2)
	);

	// Summary
	console.log("Generated Interactive manifests:");
	console.log(`  - essays.manifest.json: ${essays.entries.length} entries`);
	console.log(`  - books.manifest.json: ${books.entries.length} entries`);
	console.log(`  - projects.manifest.json: ${projects.entries.length} entries`);
	console.log(`  - lifts.manifest.json: ${lifts.lifts.length} lifts, total: ${lifts.total.weight}${lifts.total.unit}`);
}

main();
