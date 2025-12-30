"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { CommandHero } from "@/components/home/CommandHero";
import { HolographicTile } from "@/components/home/HolographicTile";

// Lazy load the heavy Three.js starfield to reduce initial bundle size (~600KB)
const StarfieldBackground = dynamic(
	() => import("@/components/ui/StarfieldBackground").then((m) => m.StarfieldBackground),
	{
		ssr: false,
		loading: () => <div className="fixed inset-0 -z-10 bg-bg-0" />,
	}
);

const modes = [
	{
		href: "/writing",
		label: "Writing",
		description: "Essays and notes",
		icon: (
			<svg
				aria-hidden="true"
				className="h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={1.5}
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
				/>
			</svg>
		),
	},
	{
		href: "/library",
		label: "Library",
		description: "Books and reading",
		icon: (
			<svg
				aria-hidden="true"
				className="h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={1.5}
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
				/>
			</svg>
		),
	},
	{
		href: "/graph",
		label: "Graph",
		description: "Connected ideas",
		icon: (
			<svg
				aria-hidden="true"
				className="h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={1.5}
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
				/>
			</svg>
		),
	},
	{
		href: "/projects",
		label: "Projects",
		description: "Things I've built",
		icon: (
			<svg
				aria-hidden="true"
				className="h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={1.5}
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
				/>
			</svg>
		),
	},
];

export default function HomePage() {
	const router = useRouter();
	const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);

	// High-intent prefetch: start prefetching after 500ms hover
	const handleInteractiveHover = useCallback(() => {
		const timer = setTimeout(() => {
			router.prefetch("/interactive");
		}, 500);
		setHoverTimer(timer);
	}, [router]);

	const handleInteractiveLeave = useCallback(() => {
		if (hoverTimer) {
			clearTimeout(hoverTimer);
			setHoverTimer(null);
		}
	}, [hoverTimer]);

	return (
		<>
			<StarfieldBackground />

			<div className="relative flex min-h-[calc(100vh-4rem)] flex-col justify-center">
				<div className="mx-auto w-full max-w-4xl px-4 py-24 sm:py-32">
					<div className="mb-16 animate-fade-in-up text-center">
						<h1 className="mb-6 font-satoshi text-6xl font-medium tracking-tight text-text-1 sm:text-7xl">
							Trey Goff
						</h1>
						<p className="mx-auto max-w-2xl text-xl font-light leading-relaxed text-text-2 sm:text-2xl">
							Building better governance through acceleration zones and
							institutional innovation.
						</p>
					</div>

					<div className="flex justify-center animate-fade-in-up animation-delay-100">
						<CommandHero />
					</div>

					<div className="grid grid-cols-1 gap-6 animate-fade-in-up animation-delay-200 sm:grid-cols-2 lg:grid-cols-4">
						{modes.map((mode, index) => (
							<HolographicTile key={mode.href} {...mode} index={index} />
						))}
					</div>

					{/* Interactive World entry link - discoverable "secret level" */}
					{process.env.NEXT_PUBLIC_ENABLE_INTERACTIVE_WORLD === "true" && (
						<div className="mt-16 text-center animate-fade-in-up animation-delay-300">
							<Link
								href="/interactive"
								prefetch={false}
								onMouseEnter={handleInteractiveHover}
								onMouseLeave={handleInteractiveLeave}
								className="group inline-flex items-center gap-2 text-sm text-text-3 transition-colors hover:text-warm"
							>
								<span className="h-px w-8 bg-surface-2 transition-all group-hover:w-12 group-hover:bg-warm" />
								<span>Explore Interactive World</span>
								<span className="h-px w-8 bg-surface-2 transition-all group-hover:w-12 group-hover:bg-warm" />
							</Link>
						</div>
					)}
				</div>
			</div>
		</>
	);
}
