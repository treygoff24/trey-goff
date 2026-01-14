/**
 * Sci-fi procedural materials system.
 * All materials share synchronized uniforms for time and accent colors.
 */

// Shared uniforms manager
export {
	getSharedUniforms,
	updateSharedUniforms,
	resetSharedUniforms,
	type SharedUniforms,
} from "./uniforms";

// Material factories
export {
	createMetalPanelMaterial,
	type MetalPanelOptions,
} from "./metalPanels";

export {
	createGlowingStripMaterial,
	type GlowingStripOptions,
} from "./glowingStrips";

export {
	createFloorTileMaterial,
	type FloorTileOptions,
} from "./floorTiles";

export { createGlassMaterial, type GlassOptions } from "./glass";

export {
	createHolographicMaterial,
	type HolographicOptions,
} from "./holographic";
