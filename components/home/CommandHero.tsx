"use client";

import { motion } from "framer-motion";
import { useCommandPalette } from "@/components/command/CommandProvider";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

export function CommandHero() {
	const { setOpen } = useCommandPalette();
	const reducedMotion = useReducedMotion();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) return null;

	return (
		<motion.div
			initial={reducedMotion ? false : { opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={reducedMotion ? { duration: 0 } : { delay: 0.1, duration: 0.5 }}
			className="relative w-full max-w-lg mx-auto mb-20 group"
		>
			{/* Pulse Effect Container */}
			<motion.div
				animate={reducedMotion ? undefined : { scale: [1, 1.02, 1] }}
				transition={
					reducedMotion
						? undefined
						: {
								duration: 4,
								repeat: Infinity,
								ease: "easeInOut",
							}
				}
				className="relative z-10"
			>
				<button
					type="button"
					onClick={() => setOpen(true)}
					className="relative flex w-full items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-5 text-left text-text-3 backdrop-blur-md transition-all duration-300 hover:border-warm/30 hover:bg-white/[0.05] hover:shadow-[0_0_30px_-5px_rgba(255,184,107,0.15)] group-hover:border-warm/30 overflow-hidden"
					aria-label="Open search"
				>
					{/* Scanning Line Animation - only show if motion is allowed */}
					{!reducedMotion && (
						<motion.div
							className="absolute top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-warm/50 to-transparent z-20"
							animate={{ left: ["0%", "100%"] }}
							transition={{
								duration: 3,
								repeat: Infinity,
								ease: "linear",
								repeatDelay: 5,
							}}
							style={{ boxShadow: "0 0 10px 1px rgba(255, 184, 107, 0.3)" }}
						/>
					)}

					<Search
						className="h-6 w-6 text-text-3 transition-colors group-hover:text-warm"
						strokeWidth={1.5}
					/>

					<span className="text-lg font-light text-text-2 group-hover:text-text-1 transition-colors">
						Search everything...
						{!reducedMotion && (
							<motion.span
								animate={{ opacity: [1, 0, 1] }}
								transition={{ duration: 1, repeat: Infinity }}
								className="ml-0.5 inline-block w-[2px] h-5 align-middle bg-warm"
							/>
						)}
					</span>

					<kbd className="ml-auto hidden rounded-md bg-white/5 border border-white/10 px-3 py-1.5 font-mono text-xs text-text-3 sm:inline-block group-hover:border-warm/20 group-hover:text-warm/80 transition-colors">
						⌘K
					</kbd>
				</button>
			</motion.div>

			{/* Glow behind */}
			<div className="absolute inset-0 rounded-xl bg-gradient-to-r from-warm/20 to-accent/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
		</motion.div>
	);
}
