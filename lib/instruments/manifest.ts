import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { claimsLedgerSchema, type ClaimsLedger } from '@/lib/instruments/types'

const INSTRUMENTS_DIR = join(process.cwd(), 'content/instruments')

export const instrumentIdSchema = z.enum([
  'instrument-rail',
  'time-spine',
  'claim-ledger',
  'margin-notes',
  'audit-layer',
  'forecast-card',
  'stats',
])

/**
 * Per-piece accent, expressed in the aurora token system's terms: the manifest supplies
 * hue and chroma, the instrument branch turns them into custom properties. Raw colors
 * never appear here.
 */
export const accentSchema = z.object({
  hue: z.number().min(0).max(360),
  chroma: z.number().min(0).max(0.4),
})

export const provenanceEntrySchema = z.object({
  path: z.string().min(1),
  source: z.string().min(1),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
})

export const instrumentManifestSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  accent: accentSchema,
  instruments: z.array(instrumentIdSchema).min(1),
  data: z
    .object({
      claims: z.string().min(1).optional(),
      marks: z.string().min(1).optional(),
      stats: z.string().min(1).optional(),
      forecasts: z.string().min(1).optional(),
    })
    .default({}),
  dossiers: z.array(z.string().min(1)).default([]),
  /** SHA-256 of the corpus files each shipped data file was derived from. */
  provenance: z.array(provenanceEntrySchema).default([]),
})

export type InstrumentId = z.infer<typeof instrumentIdSchema>
export type Accent = z.infer<typeof accentSchema>
export type ProvenanceEntry = z.infer<typeof provenanceEntrySchema>
export type InstrumentManifest = z.infer<typeof instrumentManifestSchema>

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'))
}

let slugCache: Set<string> | undefined

/** Slugs with an instrument manifest. A piece not listed here renders on the ordinary path. */
export function instrumentedSlugs(): Set<string> {
  if (slugCache) return slugCache
  slugCache = existsSync(INSTRUMENTS_DIR)
    ? new Set(
        readdirSync(INSTRUMENTS_DIR, { withFileTypes: true })
          .filter(
            (entry) =>
              entry.isDirectory() && existsSync(join(INSTRUMENTS_DIR, entry.name, 'manifest.json')),
          )
          .map((entry) => entry.name),
      )
    : new Set()
  return slugCache
}

export function isInstrumented(slug: string): boolean {
  return instrumentedSlugs().has(slug)
}

const manifestCache = new Map<string, InstrumentManifest>()

export function getInstrumentManifest(slug: string): InstrumentManifest | null {
  if (!isInstrumented(slug)) return null

  const cached = manifestCache.get(slug)
  if (cached) return cached

  const manifest = instrumentManifestSchema.parse(
    readJson(join(INSTRUMENTS_DIR, slug, 'manifest.json')),
  )
  if (manifest.slug !== slug) {
    throw new Error(`instrument manifest for ${slug} declares slug ${manifest.slug}`)
  }

  manifestCache.set(slug, manifest)
  return manifest
}

const ledgerCache = new Map<string, ClaimsLedger>()

export function getClaimsLedger(slug: string): ClaimsLedger | null {
  const manifest = getInstrumentManifest(slug)
  if (!manifest?.data.claims) return null

  const cached = ledgerCache.get(slug)
  if (cached) return cached

  const ledger = claimsLedgerSchema.parse(
    readJson(join(INSTRUMENTS_DIR, slug, manifest.data.claims)),
  )
  ledgerCache.set(slug, ledger)
  return ledger
}

export function readDossier(slug: string, dossier: string): string {
  const manifest = getInstrumentManifest(slug)
  if (!manifest?.dossiers.includes(dossier)) {
    throw new Error(`${slug} has no dossier named ${dossier}`)
  }
  return readFileSync(join(INSTRUMENTS_DIR, slug, 'dossiers', `${dossier}.md`), 'utf8')
}
