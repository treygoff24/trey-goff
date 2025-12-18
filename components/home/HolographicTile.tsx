"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import Link from "next/link";
import type { MouseEvent } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface HolographicTileProps {
	href: string;
	label: string;
	description: string;
	icon: React.ReactNode;
	index: number;
}

export function HolographicTile({
	href,
	label,
	description,
	icon,
	index,
}: HolographicTileProps) {
	const reducedMotion = useReducedMotion();
	const mouseX = useMotionValue(0);
	const mouseY = useMotionValue(0);

	const handleMouseMove = ({ currentTarget, clientX, clientY }: MouseEvent) => {
		if (reducedMotion) return;
		const { left, top } = currentTarget.getBoundingClientRect();
		mouseX.set(clientX - left);
		mouseY.set(clientY - top);
	};

	return (
		<Link href={href} className="group relative block h-full">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
				onMouseMove={handleMouseMove}
				className="relative h-full overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.04] hover:shadow-2xl"
			>
				{/* Glow Highlight Pattern */}
				<motion.div
					className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
					style={{
						background: useMotionTemplate`
              radial-gradient(
                650px circle at ${mouseX}px ${mouseY}px,
                rgba(255, 184, 107, 0.15),
                transparent 80%
              )
            `,
					}}
				/>

				{/* Border Glow */}
				<motion.div
					className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
					style={{
						background: useMotionTemplate`
                    radial-gradient(
                        600px circle at ${mouseX}px ${mouseY}px,
                        rgba(255, 184, 107, 0.4),
                        transparent 40%
                    )
                `,
						zIndex: 1, // on top of bg, below content? No, this is border glow, needs mask if we want only border.
						// Actually, standard approach for border glow is a parent with padding or a pseudo element.
						// Or just a radial gradient on the border color itself if using border-transparent.
					}}
				/>

				{/* Content */}
				<div className="relative z-10">
					<div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-text-2 ring-1 ring-white/10 transition-colors duration-300 group-hover:bg-warm/10 group-hover:text-warm group-hover:ring-warm/20">
						{icon}
					</div>

					<h2 className="mb-2 font-satoshi text-xl font-medium text-text-1 transition-colors duration-300 group-hover:text-warm">
						{label}
					</h2>

					<p className="text-sm leading-relaxed text-text-3 group-hover:text-text-2 transition-colors duration-300">
						{description}
					</p>
				</div>

				{/* Decorative corner accents */}
				<div className="absolute top-0 right-0 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
					<div className="h-1.5 w-1.5 rounded-full bg-warm/50" />
				</div>
			</motion.div>
		</Link>
	);
}
