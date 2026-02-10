import type { Metadata } from "next";
import { satoshi, newsreader, monaspace } from "@/lib/fonts";
import { connection } from "next/server";

export const metadata: Metadata = {
	title: "Interactive World — Trey Goff",
	description: "Explore Trey's world in an immersive 3D experience.",
	robots: {
		index: false, // Don't index Interactive route (experimental)
		follow: false,
	},
};

/**
 * Minimal layout for /interactive route.
 * Intentionally excludes TopNav, Footer, CommandPalette to avoid
 * polluting the 3D experience and to maintain bundle isolation.
 */
export default async function InteractiveLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	// Keep this route dynamic so nonce-based CSP can be attached to framework inline scripts.
	await connection();

	return (
		<div
			className={`${satoshi.variable} ${newsreader.variable} ${monaspace.variable} min-h-screen bg-bg-0`}
		>
			{children}
		</div>
	);
}
