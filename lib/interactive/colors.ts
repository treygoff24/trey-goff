/**
 * Design tokens for Three.js - aligned with globals.css
 * Use these constants in Three.js materials since CSS variables
 * cannot be directly read by WebGL.
 */

export const THREE_COLORS = {
	// Backgrounds
	bg0: "#070A0F",
	bg1: "#0B1020",

	// Text (as hex approximations of rgba values)
	text1: "#EBEBEBEB",
	text2: "#B8B8B8B8",
	text3: "#858585",

	// Accent colors
	warm: "#FFB86B",
	accent: "#7C5CFF",
	success: "#34D399",
	warning: "#FBBF24",
	error: "#F87171",

	// Surfaces (as solid approximations)
	surface1: "#1A1A1F",
	surface2: "#252530",
} as const;

export type ThreeColorKey = keyof typeof THREE_COLORS;
