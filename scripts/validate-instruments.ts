/**
 * Fails the build if any instrument manifest or its data files are malformed, drifted from
 * their recorded provenance, or contradict a piece's known fixtures. Runs in `prebuild`,
 * so everything the unit tests assert about shipped instrument data is also enforced on a
 * standalone `pnpm build`.
 */

import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  dossierPath,
  getClaimsLedger,
  getInstrumentManifest,
  instrumentedSlugs,
} from '@/lib/instruments/manifest'
import type { ClaimsLedger } from '@/lib/instruments/types'

const INSTRUMENTS_DIR = join(process.cwd(), 'content/instruments')

interface LedgerFixture {
  first: string
  last: string
  total: number
  unassigned: string[]
  claims: number
  verdicts: Record<string, number>
}

/**
 * Per-piece facts that are true of the shipped data and must stay true. A ledger that
 * quietly gains or loses claims is a content error rather than a schema error, so the
 * numbers live here rather than in the schema.
 */
const LEDGER_FIXTURES: Record<string, LedgerFixture> = {
  'ufo-claims-ledger': {
    first: 'C001',
    last: 'C435',
    total: 435,
    unassigned: ['C145'],
    claims: 434,
    // Per-claim entries, not the coverage note's stated totals (which disagree; both sum
    // to 388, so only a per-verdict check catches drift).
    verdicts: {
      confirmed: 180,
      likely: 52,
      contested: 59,
      unsupported: 64,
      debunked: 20,
      unfalsifiable: 13,
    },
  },
}

function fail(message: string): never {
  throw new Error(`instruments: ${message}`)
}

function checkLedgerFixture(slug: string, ledger: ClaimsLedger | null) {
  const expected = LEDGER_FIXTURES[slug]
  if (!expected) return
  if (!ledger) fail(`${slug} has recorded ledger fixtures but ships no claims ledger`)

  const { first, last, total, unassigned } = ledger.canonicalIds
  const actual = { first, last, total, unassigned, claims: ledger.claims.length }
  const same =
    actual.first === expected.first &&
    actual.last === expected.last &&
    actual.total === expected.total &&
    actual.claims === expected.claims &&
    actual.unassigned.length === expected.unassigned.length &&
    actual.unassigned.every((id, index) => id === expected.unassigned[index])

  if (!same) {
    fail(`${slug} ledger drifted from its recorded fixture: ${JSON.stringify(actual)}`)
  }

  const verdictCounts: Record<string, number> = {}
  for (const claim of ledger.claims) {
    if (claim.verdict) verdictCounts[claim.verdict] = (verdictCounts[claim.verdict] ?? 0) + 1
  }
  for (const [verdict, count] of Object.entries(expected.verdicts)) {
    if (verdictCounts[verdict] !== count) {
      fail(
        `${slug} verdict drift: expected ${count} ${verdict}, found ${verdictCounts[verdict] ?? 0}`,
      )
    }
  }
}

const slugs = [...instrumentedSlugs()].sort()

for (const slug of slugs) {
  const manifest = getInstrumentManifest(slug)
  if (!manifest) fail(`${slug} lists a manifest that failed to load`)

  const ledger = getClaimsLedger(slug)
  checkLedgerFixture(slug, ledger)

  for (const dossier of manifest.dossiers) {
    const path = dossierPath(slug, dossier)
    if (!existsSync(path)) fail(`${slug} declares dossier ${dossier} but ${path} does not exist`)
  }

  for (const entry of manifest.provenance) {
    const path = join(INSTRUMENTS_DIR, slug, entry.path)
    if (!existsSync(path)) fail(`${slug} records provenance for missing file ${entry.path}`)

    // Markdown ships verbatim from the source corpus, so its recorded hash still describes
    // what is on disk. Derived JSON is hashed against an offline source not in this repo.
    if (!entry.path.endsWith('.md')) continue
    const digest = createHash('sha256').update(readFileSync(path)).digest('hex')
    if (digest !== entry.sha256) {
      fail(`${slug}/${entry.path} drifted from its recorded hash (${digest})`)
    }
  }

  const claims = ledger ? `${ledger.claims.length} claims` : 'no ledger'
  process.stdout.write(
    `instruments: ${slug} — ${manifest.instruments.length} instruments, ${claims}, ${manifest.dossiers.length} dossiers\n`,
  )
}

process.stdout.write(`instruments: ${slugs.length} instrumented piece(s) validated\n`)
