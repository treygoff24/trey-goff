/**
 * Fails the build if any instrument manifest or its data files are malformed. Runs in
 * `prebuild` so a bad ledger never reaches a route.
 */

import {
  getClaimsLedger,
  getInstrumentManifest,
  instrumentedSlugs,
} from '@/lib/instruments/manifest'

const slugs = [...instrumentedSlugs()].sort()

for (const slug of slugs) {
  const manifest = getInstrumentManifest(slug)
  if (!manifest) throw new Error(`${slug} lists a manifest that failed to load`)

  const ledger = getClaimsLedger(slug)
  const claims = ledger ? `${ledger.claims.length} claims` : 'no ledger'
  process.stdout.write(
    `instruments: ${slug} — ${manifest.instruments.length} instruments, ${claims}\n`,
  )
}

process.stdout.write(`instruments: ${slugs.length} instrumented piece(s) validated\n`)
