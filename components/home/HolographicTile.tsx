"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useState } from "react";

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
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

	const handleMouseMove = ({ currentTarget, clientX, clientY }: MouseEvent) => {
		if (reducedMotion) return;
		const { left, top } = currentTarget.getBoundingClientRect();
		setMousePos({ x: clientX - left, y: clientY - top });
	};

	const animationDelay = reducedMotion ? "0s" : `${0.2 + index * 0.1}s`;
	const animationClass = reducedMotion ? "" : "animate-fade-in-up";

	return (
		<Link href={href} className="group relative block h-full">
			<div
				onMouseMove={handleMouseMove}
				className={`holographic-tile relative h-full overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.04] hover:shadow-2xl ${animationClass}`}
				style={
					{
						animationDelay,
						"--mouse-x": `${mousePos.x}px`,
						"--mouse-y": `${mousePos.y}px`,
					} as React.CSSProperties
				}
			>
				{/* Glow Highlight Pattern */}
				{!reducedMotion && (
					<div
						className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
						style={{
							background: `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(245, 162, 90, 0.15), transparent 80%)`,
						}}
					/>
				)}

				{/* Border Glow */}
				{!reducedMotion && (
					<div
						className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
						style={{
							background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(245, 162, 90, 0.4), transparent 40%)`,
							zIndex: 1,
						}}
					/>
				)}

				{/* Content */}
				<div className="relative z-10">
					<div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-text-2 ring-1 ring-white/10 transition-colors duration-300 group-hover:bg-warm/10 group-hover:text-warm group-hover:ring-warm/20">
						{icon}
					</div>

					<h2 className="mb-2 font-satoshi text-xl font-medium text-text-1 transition-colors duration-300 group-hover:text-warm">
						{label}
					</h2>

					<p className="text-sm leading-relaxed text-text-3 transition-colors duration-300 group-hover:text-text-2">
						{description}
					</p>
				</div>

				{/* Decorative corner accents */}
				<div className="absolute right-0 top-0 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
					<div className="h-1.5 w-1.5 rounded-full bg-warm/50" />
				</div>
			</div>
		</Link>
	);
}
