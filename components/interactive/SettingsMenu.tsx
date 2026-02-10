"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useInteractiveStore } from "@/lib/interactive/store";
import type { QualityTier } from "@/lib/interactive/capabilities";

// =============================================================================
// Types
// =============================================================================

interface SettingsMenuProps {
	/** Whether menu is open */
	isOpen: boolean;
	/** Close callback */
	onClose: () => void;
	/** Current quality tier */
	qualityTier: QualityTier;
	/** Quality tier change callback */
	onQualityChange: (tier: QualityTier) => void;
	/** Whether reduced motion is enabled */
	reducedMotion: boolean;
	/** Reduced motion toggle callback */
	onReducedMotionChange: (enabled: boolean) => void;
}

// =============================================================================
// Quality Tier Options
// =============================================================================

const QUALITY_OPTIONS: Array<{ value: QualityTier; label: string; description: string }> = [
	{ value: "auto", label: "Auto", description: "Adjusts based on performance" },
	{ value: "low", label: "Low", description: "Best performance, minimal effects" },
	{ value: "medium", label: "Medium", description: "Balanced visuals and performance" },
	{ value: "high", label: "High", description: "Best visuals, requires good GPU" },
];

// =============================================================================
// Sub-components
// =============================================================================

function SettingRow({
	label,
	description,
	children,
}: {
	label: string;
	description?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-center justify-between gap-4 py-3">
			<div>
				<p className="text-sm font-medium text-text-1">{label}</p>
				{description && (
					<p className="text-xs text-text-3">{description}</p>
				)}
			</div>
			<div className="flex-shrink-0">{children}</div>
		</div>
	);
}

function Toggle({
	checked,
	onChange,
	label,
}: {
	checked: boolean;
	onChange: (checked: boolean) => void;
	label: string;
}) {
	return (
		<button
			role="switch"
			aria-checked={checked}
			aria-label={label}
			onClick={() => onChange(!checked)}
			className={cn(
				"relative h-6 w-11 rounded-full transition-colors",
				checked ? "bg-warm" : "bg-surface-2"
			)}
		>
			<span
				className={cn(
					"absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
					checked && "translate-x-5"
				)}
			/>
		</button>
	);
}

function Select({
	value,
	onChange,
	options,
	label,
}: {
	value: string;
	onChange: (value: string) => void;
	options: Array<{ value: string; label: string }>;
	label: string;
}) {
	return (
		<select
			value={value}
			onChange={(e) => onChange(e.target.value)}
			aria-label={label}
			className="rounded-lg border border-border-1 bg-surface-1 px-3 py-1.5 text-sm text-text-1 focus:outline-none focus:ring-2 focus:ring-warm"
		>
			{options.map((option) => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</select>
	);
}

// =============================================================================
// Main Component
// =============================================================================

export function SettingsMenu({
	isOpen,
	onClose,
	qualityTier,
	onQualityChange,
	reducedMotion,
	onReducedMotionChange,
}: SettingsMenuProps) {
	const menuRef = useRef<HTMLDivElement>(null);
	const cameraMode = useInteractiveStore((s) => s.settings.cameraMode);
	const updateSettings = useInteractiveStore((s) => s.updateSettings);

	// Close on Escape key
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

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
		if (!isOpen || !menuRef.current) return;

		const focusableElements = menuRef.current.querySelectorAll(
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
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-bg-0/80 p-4 backdrop-blur-sm"
			onClick={handleBackdropClick}
			role="dialog"
			aria-modal="true"
			aria-labelledby="settings-title"
		>
			<div
				ref={menuRef}
				className="w-full max-w-md rounded-xl border border-border-1 bg-bg-1 p-6 shadow-2xl"
			>
				{/* Header */}
				<div className="flex items-center justify-between border-b border-border-1 pb-4">
					<h2 id="settings-title" className="font-satoshi text-xl font-medium text-text-1">
						Settings
					</h2>
					<button
						onClick={onClose}
						className="rounded-lg p-2 text-text-3 transition-colors hover:bg-surface-1 hover:text-text-1"
						aria-label="Close settings"
					>
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Settings */}
				<div className="divide-y divide-border-1">
					{/* Quality Tier */}
					<SettingRow
						label="Graphics Quality"
						description={QUALITY_OPTIONS.find((o) => o.value === qualityTier)?.description}
					>
						<Select
							value={qualityTier}
							onChange={(v) => onQualityChange(v as QualityTier)}
							options={QUALITY_OPTIONS}
							label="Graphics quality"
						/>
					</SettingRow>

					{/* Camera Mode */}
					<SettingRow
						label="Camera Mode"
						description={cameraMode === "first-person" ? "Looking through eyes" : "Over-the-shoulder view"}
					>
						<Select
							value={cameraMode ?? "third-person"}
							onChange={(v) => updateSettings({ cameraMode: v as "first-person" | "third-person" })}
							options={[
								{ value: "third-person", label: "Third Person" },
								{ value: "first-person", label: "First Person" },
							]}
							label="Camera mode"
						/>
					</SettingRow>

					{/* Reduced Motion */}
					<SettingRow
						label="Reduced Motion"
						description="Minimize animations and effects"
					>
						<Toggle
							checked={reducedMotion}
							onChange={onReducedMotionChange}
							label="Reduced motion"
						/>
					</SettingRow>
				</div>

				{/* Footer */}
				<div className="mt-6 flex justify-end gap-3">
					<button
						onClick={onClose}
						className="rounded-lg bg-warm px-4 py-2 text-sm font-medium text-bg-0 transition-colors hover:bg-warm/90"
					>
						Done
					</button>
				</div>
			</div>
		</div>
	);
}

// =============================================================================
// Hook for settings state
// =============================================================================

export function useSettingsMenu() {
	const [isOpen, setIsOpen] = React.useState(false);

	const openSettings = useCallback(() => setIsOpen(true), []);
	const closeSettings = useCallback(() => setIsOpen(false), []);

	return {
		isOpen,
		openSettings,
		closeSettings,
	};
}
