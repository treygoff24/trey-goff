"use client";

import { AtmosphericBackground } from "@/components/ui/AtmosphericBackground";
import { CommandHero } from "@/components/home/CommandHero";
import { HolographicTile } from "@/components/home/HolographicTile";

const modes = [
	{
		href: "/writing",
		label: "Writing",
		description: "Essays and notes",
		icon: (
			<svg
				aria-hidden="true"
				className="w-6 h-6"
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
				className="w-6 h-6"
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
				className="w-6 h-6"
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
				className="w-6 h-6"
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
	return (
		<>
			<AtmosphericBackground />

			<div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center">
				{/* Content */}
				<div className="mx-auto max-w-4xl px-4 py-24 sm:py-32 w-full">
					{/* Identity section with entrance animation */}
					<div className="text-center mb-16 animate-fade-in-up">
						<h1 className="font-satoshi text-6xl sm:text-7xl font-medium text-text-1 mb-6 tracking-tight">
							Trey Goff
						</h1>
						<p className="text-xl sm:text-2xl text-text-2 max-w-2xl mx-auto leading-relaxed font-light">
							Building better governance through acceleration zones and
							institutional innovation.
						</p>
					</div>

					{/* Command hero */}
					<div className="animate-fade-in-up animation-delay-100 flex justify-center">
						<CommandHero />
					</div>

					{/* Mode tiles */}
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-up animation-delay-200">
						{modes.map((mode, index) => (
							<HolographicTile key={mode.href} {...mode} index={index} />
						))}
					</div>
				</div>
			</div>
		</>
	);
}
