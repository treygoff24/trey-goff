import type { Metadata } from "next";
import { satoshi, newsreader, monaspace } from "@/lib/fonts";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { CommandPaletteProvider, CommandPalette } from "@/components/command";
import { EasterEggs } from "@/components/easter-eggs/EasterEggs";
import "./globals.css";

export const metadata: Metadata = {
	title: {
		default: "Trey Goff",
		template: "%s — Trey",
	},
	description:
		"Governance, acceleration zones, and institutional innovation for a faster future.",
	metadataBase: new URL("https://trey.world"),
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://trey.world",
		siteName: "Trey Goff",
		images: [
			{
				url: "/opengraph-image",
				width: 1200,
				height: 630,
				alt: "Trey Goff",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		creator: "@treygoff",
		images: ["/opengraph-image"],
	},
	robots: {
		index: true,
		follow: true,
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${satoshi.variable} ${newsreader.variable} ${monaspace.variable}`}
		>
			<body className="flex min-h-screen flex-col isolate">
				<CommandPaletteProvider>
					{/* Skip link for accessibility */}
					<a
						href="#main-content"
						className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-warm focus:px-4 focus:py-2 focus:text-bg-1"
					>
						Skip to main content
					</a>
					<TopNav />
					<main id="main-content" className="flex-1" tabIndex={-1}>
						{children}
					</main>
					<Footer />
					<CommandPalette />
					<EasterEggs />
				</CommandPaletteProvider>
			</body>
		</html>
	);
}
