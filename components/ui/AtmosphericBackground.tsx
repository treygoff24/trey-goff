"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function AtmosphericBackground() {
	const reducedMotion = useReducedMotion();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	// Animation variants for the blobs - memoized to prevent recalculation on re-render
	// We use random values for a "living" organic feel
	const blobVariants = useMemo(
		() => ({
			animate: (i: number) => ({
				x: [0, Math.random() * 100 - 50, Math.random() * 100 - 50, 0],
				y: [0, Math.random() * 100 - 50, Math.random() * 100 - 50, 0],
				scale: [1, 1.1, 0.9, 1],
				opacity: [0.3, 0.5, 0.3],
				transition: {
					duration: 10 + Math.random() * 10,
					repeat: Infinity,
					repeatType: "reverse" as const,
					ease: "easeInOut" as const,
					delay: i * 2,
				},
			}),
		}),
		[]
	);

	if (!mounted) return null;

	// If reduced motion is enabled, just show a static gradient state
	if (reducedMotion) {
		return (
			<div className="fixed inset-0 -z-10 bg-bg-0 pointer-events-none overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-b from-bg-0 via-bg-1 to-bg-1" />
				<div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-accent/10 blur-[100px] rounded-full" />
				<div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-warm/10 blur-[100px] rounded-full" />
			</div>
		);
	}

	return (
		<div className="fixed inset-0 -z-10 bg-bg-0 pointer-events-none overflow-hidden">
			{/* Base dark gradient */}
			<div className="absolute inset-0 bg-gradient-to-b from-bg-0 via-bg-1 to-bg-1" />

			{/* Ambient Blobs */}
			<motion.div
				custom={1}
				variants={blobVariants}
				animate="animate"
				className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-accent/10 blur-[120px] mix-blend-screen"
			/>

			<motion.div
				custom={2}
				variants={blobVariants}
				animate="animate"
				className="absolute top-[10%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-warm/10 blur-[120px] mix-blend-screen"
			/>

			<motion.div
				custom={3}
				variants={blobVariants}
				animate="animate"
				className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-warm/5 blur-[100px] mix-blend-screen"
			/>

			{/* Subtle Grid Overlay - using white with low opacity to work with dark theme */}
			<div
				className="absolute inset-0 opacity-[0.03]"
				style={{
					backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.5) 1px, transparent 1px),
                                 linear-gradient(to bottom, rgba(255, 255, 255, 0.5) 1px, transparent 1px)`,
					backgroundSize: "40px 40px",
				}}
			/>

			{/* Noise overlay */}
			<div
				className="absolute inset-0 opacity-[0.03] mix-blend-overlay" // Increased opacity slightly for more texture
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
				}}
			/>
		</div>
	);
}
