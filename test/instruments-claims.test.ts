import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import {
  dossierToHast,
  getClaimsLedger,
  getInstrumentManifest,
  isInstrumented,
} from '@/lib/instruments/manifest'
import {
  claimsLedgerSchema,
  countVerdicts,
  markSchema,
  sourceSchema,
  VERDICTS,
} from '@/lib/instruments/types'

const SLUG = 'ufo-claims-ledger'
const DIR = join(process.cwd(), 'content/instruments', SLUG)

const ledger = getClaimsLedger(SLUG)
assert.ok(ledger, 'ufo-claims-ledger has a claims ledger')

test('the ledger slug is instrumented and its manifest points at the claims data', () => {
  assert.equal(isInstrumented(SLUG), true)
  assert.equal(isInstrumented('a-slug-with-no-manifest'), false)

  const manifest = getInstrumentManifest(SLUG)
  assert.ok(manifest)
  assert.equal(manifest.data.claims, 'claims.json')
  assert.ok(manifest.instruments.includes('claim-ledger'))
})

test('shipped data files match the SHA-256 recorded in the manifest', () => {
  const manifest = getInstrumentManifest(SLUG)
  assert.ok(manifest)
  assert.ok(manifest.provenance.length > 0)

  for (const entry of manifest.provenance) {
    assert.match(entry.sha256, /^[0-9a-f]{64}$/)
    assert.ok(entry.source.endsWith('.md'), `${entry.path} records a markdown source`)
  }

  // The dossiers ship verbatim, so their recorded hashes must still describe what is on disk.
  for (const entry of manifest.provenance.filter((item) => item.path.startsWith('dossiers/'))) {
    const digest = createHash('sha256')
      .update(readFileSync(join(DIR, entry.path)))
      .digest('hex')
    assert.equal(digest, entry.sha256, `${entry.path} drifted from its recorded hash`)
  }
})

test('435 canonical ids cover 434 claims with C145 unassigned', () => {
  assert.deepEqual(ledger.canonicalIds, {
    first: 'C001',
    last: 'C435',
    total: 435,
    unassigned: ['C145'],
  })
  assert.equal(ledger.claims.length, 434)
  assert.equal(
    ledger.claims.some((claim) => claim.id === 'C145'),
    false,
  )
  assert.equal(new Set(ledger.claims.map((claim) => claim.id)).size, 434)
})

test('every canonical id except C145 carries exactly one claim', () => {
  const present = new Set(ledger.claims.map((claim) => claim.id))
  const missing: string[] = []
  for (let number = 1; number <= 435; number += 1) {
    const id = `C${String(number).padStart(3, '0')}`
    if (!present.has(id)) missing.push(id)
  }
  assert.deepEqual(missing, ['C145'])
})

test('section letters skip D, as the source records', () => {
  const letters = ledger.sections.map((section) => section.id)
  assert.equal(letters.includes('D'), false)
  assert.deepEqual(letters, [...letters].sort())
  assert.equal(letters.length, 21)

  const used = new Set(ledger.claims.map((claim) => claim.section))
  for (const letter of used) assert.ok(letters.includes(letter), `section ${letter} is declared`)
})

test('verdict totals come from the per-claim entries, not the coverage note', () => {
  const counts = countVerdicts(ledger.claims)

  assert.deepEqual(counts, {
    confirmed: 180,
    likely: 52,
    contested: 59,
    unsupported: 64,
    debunked: 20,
    unfalsifiable: 13,
  })

  // The source's coverage note states these instead. Both sum to 388, so the disagreement
  // is invisible to a total check — the per-claim entries are the record.
  const coverageNote = {
    confirmed: 182,
    likely: 51,
    contested: 59,
    unsupported: 61,
    debunked: 22,
    unfalsifiable: 13,
  }
  const sum = (record: Record<string, number>) => Object.values(record).reduce((a, b) => a + b, 0)
  assert.equal(sum(counts), 388)
  assert.equal(sum(coverageNote), 388)
  assert.notDeepEqual(counts, coverageNote)
})

test('worked claims carry a verdict and unverified claims do not', () => {
  const worked = ledger.claims.filter((claim) => claim.status === 'worked')
  const unverified = ledger.claims.filter((claim) => claim.status === 'unverified')

  assert.equal(worked.length, 388)
  assert.equal(unverified.length, 46)
  assert.equal(worked.length + unverified.length, ledger.claims.length)

  for (const claim of worked) {
    assert.ok(claim.verdict, `${claim.id} has a verdict`)
    assert.ok(VERDICTS.includes(claim.verdict), `${claim.id} verdict is in the enum`)
    assert.ok(claim.rationale, `${claim.id} has a rationale`)
  }
  for (const claim of unverified) {
    assert.equal(claim.verdict, null)
    assert.equal(claim.rationale, null)
  }
})

test('compound and qualified verdict labels keep their full text', () => {
  const compound = ledger.claims.find((claim) => claim.id === 'C002')
  const qualified = ledger.claims.find((claim) => claim.id === 'C217')

  assert.ok(compound)
  assert.equal(compound.verdict, 'confirmed')
  assert.match(compound.verdictLabel ?? '', /^confirmed \(Type A\) \/ /)

  assert.ok(qualified)
  assert.equal(qualified.verdict, 'contested')
  assert.equal(qualified.verdictLabel, 'contested - audit flagged')
})

test('claims linking a shipped dossier name one the manifest declares', () => {
  const manifest = getInstrumentManifest(SLUG)
  assert.ok(manifest)
  const linked = ledger.claims.filter((claim) => claim.dossier !== null)
  assert.ok(linked.length > 0)
  for (const claim of linked) {
    assert.ok(manifest.dossiers.includes(claim.dossier ?? ''), `${claim.id} dossier is declared`)
  }
})

test('the schema rejects a ledger whose claim count contradicts its canonical ids', () => {
  const broken = {
    ...ledger,
    claims: ledger.claims.slice(0, 10),
  }
  const result = claimsLedgerSchema.safeParse(broken)
  assert.equal(result.success, false)
})

test('the schema rejects a claim reinstating an unassigned id', () => {
  const first = ledger.claims[0]
  const result = claimsLedgerSchema.safeParse({
    ...ledger,
    claims: [{ ...first, id: 'C145' }, ...ledger.claims.slice(1)],
  })
  assert.equal(result.success, false)
})

test('the schema rejects a worked claim with no verdict', () => {
  const worked = ledger.claims.find((claim) => claim.status === 'worked')
  assert.ok(worked)
  const result = claimsLedgerSchema.safeParse({
    ...ledger,
    claims: ledger.claims.map((claim) =>
      claim.id === worked.id
        ? { ...claim, verdict: null, verdictLabel: null, rationale: null }
        : claim,
    ),
  })
  assert.equal(result.success, false)
})

test('the schema rejects an unassigned id outside the canonical range', () => {
  const result = claimsLedgerSchema.safeParse({
    ...ledger,
    canonicalIds: { ...ledger.canonicalIds, unassigned: ['C999'] },
  })
  assert.equal(result.success, false)
})

test('the schema rejects a canonical id that is neither claimed nor unassigned', () => {
  const result = claimsLedgerSchema.safeParse({
    ...ledger,
    canonicalIds: { ...ledger.canonicalIds, unassigned: ['C144'] },
    claims: ledger.claims.filter((claim) => claim.id !== 'C144'),
  })
  assert.equal(result.success, false)
})

test('only http and https links pass the schemas', () => {
  const source = { title: 'A filing', url: 'https://example.com/filing' }
  assert.equal(sourceSchema.safeParse(source).success, true)
  for (const url of ['javascript:alert(1)', 'data:text/html,<script>', 'ftp://example.com']) {
    assert.equal(sourceSchema.safeParse({ ...source, url }).success, false, url)
  }

  assert.equal(
    claimsLedgerSchema.safeParse({
      ...ledger,
      source: { ...ledger.source, url: 'javascript:alert(1)' },
    }).success,
    false,
  )
})

test('mark ids are slugs', () => {
  const mark = { id: 'moon-photos-1', kind: 'killed', anchor: null, text: 'a passage' }
  assert.equal(markSchema.safeParse(mark).success, true)
  for (const id of ['Moon Photos', 'moon_photos', '-leading', 'trailing-']) {
    assert.equal(markSchema.safeParse({ ...mark, id }).success, false, id)
  }
})

test('a dossier renders through the sanitized pipeline, never as raw markdown', async () => {
  const tree = await dossierToHast(SLUG, 'tehran')
  assert.equal(tree.type, 'root')
  assert.ok(tree.children.length > 0)

  await assert.rejects(async () => dossierToHast(SLUG, 'not-a-dossier'))
})
