/**
 * Shape of `public/manifests/assets.manifest.json`.
 *
 * Written by `scripts/compress-assets.ts` and read back by
 * `scripts/validate-asset-budgets.ts`; both sides share this declaration so the
 * writer and the validator cannot drift apart.
 */

export interface AssetManifestEntry {
  file: string
  size: number
}

export interface AssetManifest {
  version: string
  generated: string
  chunks: Record<string, AssetManifestEntry>
  props: Record<string, AssetManifestEntry>
}
