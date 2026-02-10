"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

export interface OverlayContent {
	type: "book" | "project" | "post" | "generic";
	title: string;
	subtitle?: string;
	description?: string;
	image?: string;
	/** Link to full content on normal site */
	readMoreUrl?: string;
	/** Additional metadata */
	meta?: Record<string, string>;
	/** Tags or categories */
	tags?: string[];
}

interface ContentOverlayProps {
	content: OverlayContent | null;
	onClose: () => void;
	/** Reduced motion preference */
	reducedMotion?: boolean;
}

// =============================================================================
// Components
// =============================================================================

function OverlayHeader({
	type,
	title,
	subtitle,
	onClose,
}: {
	type: OverlayContent["type"];
	title: string;
	subtitle?: string;
	onClose: () => void;
}) {
	const typeLabel = {
		book: "Book",
		project: "Project",
		post: "Essay",
		generic: "Content",
	}[type];

	return (
		<div className="flex items-start justify-between border-b border-border-1 pb-4">
			<div>
				<p className="text-xs font-medium uppercase tracking-wider text-warm">
					{typeLabel}
				</p>
				<h2 id="overlay-title" className="mt-1 font-satoshi text-2xl font-medium text-text-1">
					{title}
				</h2>
				{subtitle && (
					<p className="mt-0.5 text-sm text-text-2">{subtitle}</p>
				)}
			</div>
			<button
				onClick={onClose}
				className="rounded-lg p-2 text-text-3 transition-colors hover:bg-surface-1 hover:text-text-1"
				aria-label="Close overlay"
			>
				<svg
					className="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>
	);
}

function OverlayImage({ src, alt }: { src: string; alt: string }) {
	return (
		<div className="relative aspect-video w-full overflow-hidden rounded-lg bg-surface-1">
			<Image
				src={src}
				alt={alt}
				fill
				className="object-cover"
				sizes="(max-width: 512px) 100vw, 512px"
				unoptimized
			/>
		</div>
	);
}

function OverlayMeta({ meta }: { meta: Record<string, string> }) {
	return (
		<dl className="grid grid-cols-2 gap-2 rounded-lg bg-surface-1 p-3">
			{Object.entries(meta).map(([key, value]) => (
				<div key={key}>
					<dt className="text-xs text-text-3">{key}</dt>
					<dd className="text-sm text-text-1">{value}</dd>
				</div>
			))}
		</dl>
	);
}

function OverlayTags({ tags }: { tags: string[] }) {
	return (
		<div className="flex flex-wrap gap-2">
			{tags.map((tag) => (
				<span
					key={tag}
					className="rounded-full bg-surface-1 px-3 py-1 text-xs text-text-2"
				>
					{tag}
				</span>
			))}
		</div>
	);
}

// =============================================================================
// Main Component
// =============================================================================

export function ContentOverlay({
	content,
	onClose,
	reducedMotion = false,
}: ContentOverlayProps) {
	const overlayRef = useRef<HTMLDivElement>(null);
	const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

	// Save focus on open and restore on close
	useEffect(() => {
		if (content) {
			previouslyFocusedElementRef.current = document.activeElement as HTMLElement;
		} else if (previouslyFocusedElementRef.current) {
			previouslyFocusedElementRef.current.focus();
			previouslyFocusedElementRef.current = null;
		}
	}, [content]);

	// Close on Escape key
	useEffect(() => {
		if (!content) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [content, onClose]);

	// Close on click outside
	const handleBackdropClick = useCallback(
		(e: React.MouseEvent) => {
			if (e.target === e.currentTarget) {
				onClose();
			}
		},
		[onClose]
	);

	// Focus trap
	useEffect(() => {
		if (!content || !overlayRef.current) return;

		const focusableElements = overlayRef.current.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		const firstElement = focusableElements[0] as HTMLElement;
		const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

		firstElement?.focus();

		const handleTab = (e: KeyboardEvent) => {
			if (e.key !== "Tab") return;

			if (e.shiftKey && document.activeElement === firstElement) {
				e.preventDefault();
				lastElement?.focus();
			} else if (!e.shiftKey && document.activeElement === lastElement) {
				e.preventDefault();
				firstElement?.focus();
			}
		};

		document.addEventListener("keydown", handleTab);
		return () => document.removeEventListener("keydown", handleTab);
	}, [content]);

	if (!content) return null;

	return (
		<div
			className={cn(
				"fixed inset-0 z-50 flex items-center justify-center bg-bg-0/80 p-4 backdrop-blur-sm",
				!reducedMotion && "animate-fade-in"
			)}
			onClick={handleBackdropClick}
			role="dialog"
			aria-modal="true"
			aria-labelledby="overlay-title"
		>
			<div
				ref={overlayRef}
				className={cn(
					"max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border-1 bg-bg-1 p-6 shadow-2xl",
					!reducedMotion && "animate-scale-in"
				)}
			>
				<OverlayHeader
					type={content.type}
					title={content.title}
					subtitle={content.subtitle}
					onClose={onClose}
				/>

				<div className="mt-4 space-y-4">
					{content.image && (
						<OverlayImage src={content.image} alt={content.title} />
					)}

					{content.description && (
						<p className="text-text-2">{content.description}</p>
					)}

					{content.meta && Object.keys(content.meta).length > 0 && (
						<OverlayMeta meta={content.meta} />
					)}

					{content.tags && content.tags.length > 0 && (
						<OverlayTags tags={content.tags} />
					)}

					{content.readMoreUrl && (
						<div className="flex gap-3 pt-2">
							<Link
								href={content.readMoreUrl}
								className="flex-1 rounded-lg bg-warm px-4 py-2.5 text-center text-sm font-medium text-bg-0 transition-colors hover:bg-warm/90"
							>
								{content.type === "book" ? "Read Review" : "View Full"}
							</Link>
							<button
								onClick={onClose}
								className="rounded-lg border border-border-1 px-4 py-2.5 text-sm text-text-2 transition-colors hover:bg-surface-1 hover:text-text-1"
							>
								Back to World
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

// =============================================================================
// Hook for overlay state
// =============================================================================

export function useContentOverlay() {
	const [content, setContent] = useState<OverlayContent | null>(null);

	const openOverlay = useCallback((newContent: OverlayContent) => {
		setContent(newContent);
	}, []);

	const closeOverlay = useCallback(() => {
		setContent(null);
	}, []);

	return {
		content,
		openOverlay,
		closeOverlay,
		isOpen: content !== null,
	};
}
