/**
 * Derives content/instruments/ufo-claims-ledger/claims.json from the reading-bakeoff
 * corpus. The source repo is offline-only, so this runs by hand when the ledger data
 * changes; the manifest's recorded SHA-256 hashes are the provenance record.
 *
 *   pnpm tsx scripts/derive-ufo-claims.ts [sourceDir]
 */

import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { instrumentManifestSchema } from '@/lib/instruments/manifest'
import { claimsLedgerSchema, type Claim, type ClaimSection } from '@/lib/instruments/types'

const DEFAULT_SOURCE = '/Users/treygoff/Code/reading-bakeoff/content/ufo'
const OUT_DIR = join(process.cwd(), 'content/instruments/ufo-claims-ledger')

const SOURCE = {
  title: 'Master Claims Ledger — "Proof That NASA Censored Moon Photos"',
  episode: 'Jesse Michels interviewing physicist Maaneli Derakhshani',
  url: 'https://www.youtube.com/watch?v=uVVqFg2v7ro',
  date: '2026-07-20',
}

function group(match: RegExpMatchArray, index: number): string {
  const value = match[index]
  if (value === undefined) throw new Error(`${match[0]}: capture group ${index} did not match`)
  return value
}

function field(block: string, name: string): string | null {
  const match = block.match(new RegExp(`^- \\*\\*${name}:\\*\\* (.+)$`, 'm'))
  return match ? group(match, 1).trim() : null
}

function required(block: string, name: string, id: string): string {
  const value = field(block, name)
  if (value === null) throw new Error(`${id}: missing ${name}`)
  return value
}

function parseVerdict(raw: string, id: string) {
  const split = raw.indexOf(' — ')
  if (split === -1) throw new Error(`${id}: verdict has no rationale separator`)
  const verdictLabel = raw.slice(0, split).trim()
  const rationale = raw.slice(split + 3).trim()

  const verdict = verdictLabel.split(/[\s(]/)[0] ?? ''
  const findings = [...rationale.matchAll(/\(see ([^)]+)\)/g)]
  const last = findings.at(-1)
  const finding = last ? group(last, 1).trim() : null

  return { verdict, verdictLabel, rationale, finding }
}

function parseSections(markdown: string): ClaimSection[] {
  return [...markdown.matchAll(/^## ([A-Z])\. (.+)$/gm)].map((match) => ({
    id: group(match, 1),
    title: group(match, 2).trim(),
  }))
}

function parseClaims(markdown: string, dossierSlugs: Set<string>): Claim[] {
  const claims: Claim[] = []
  let section: string | null = null

  const blocks = markdown.split(/^(?=(?:## |### C))/m)
  for (const block of blocks) {
    const sectionHeading = block.match(/^## ([A-Z])\. /)
    if (sectionHeading) {
      section = group(sectionHeading, 1)
      continue
    }

    const heading = block.match(/^### (C\d{3}) — (.+)$/m)
    if (!heading) continue
    const id = group(heading, 1)
    const title = group(heading, 2)
    if (section === null) throw new Error(`${id}: appears before any section heading`)

    const verdictRaw = field(block, 'Verdict')
    const parsed = verdictRaw === null ? null : parseVerdict(verdictRaw, id)
    const dossier =
      parsed?.finding != null && dossierSlugs.has(basename(parsed.finding, '.md'))
        ? basename(parsed.finding, '.md')
        : null

    claims.push({
      id,
      section,
      title: title.trim(),
      claim: required(block, 'Claim', id),
      speakers: required(block, 'Speaker', id)
        .split(';')
        .map((speaker) => speaker.trim()),
      timestamps: [...required(block, 'Timestamp', id).matchAll(/\[(\d+:\d{2}:\d{2})\]/g)].map(
        (match) => group(match, 1),
      ),
      type: required(block, 'Type', id) as Claim['type'],
      status: required(block, 'Status', id) as Claim['status'],
      verdict: (parsed?.verdict ?? null) as Claim['verdict'],
      verdictLabel: parsed?.verdictLabel ?? null,
      rationale: parsed?.rationale ?? null,
      finding: parsed?.finding ?? null,
      dossier,
    })
  }

  return claims
}

function parseCanonicalIds(markdown: string) {
  const total = markdown.match(/\*\*Total claims:\*\* (\d+) \((C\d{3})–(C\d{3})\)/)
  if (!total) throw new Error('coverage note: could not read the canonical id range')

  const unassigned = [...markdown.matchAll(/(C\d{3}) is unassigned/g)].map((match) =>
    group(match, 1),
  )
  return {
    first: group(total, 2),
    last: group(total, 3),
    total: Number(group(total, 1)),
    unassigned,
  }
}

async function sha256(path: string): Promise<string> {
  return createHash('sha256')
    .update(await readFile(path))
    .digest('hex')
}

async function main() {
  const sourceDir = process.argv[2] ?? DEFAULT_SOURCE
  const claimsPath = join(sourceDir, 'claims.md')
  const dossierDir = join(sourceDir, 'dossiers')

  const markdown = await readFile(claimsPath, 'utf8')
  const dossierFiles = (await readdir(dossierDir)).filter((name) => name.endsWith('.md')).sort()
  const dossierSlugs = new Set(dossierFiles.map((name) => basename(name, '.md')))

  const ledger = claimsLedgerSchema.parse({
    source: SOURCE,
    canonicalIds: parseCanonicalIds(markdown),
    sections: parseSections(markdown),
    claims: parseClaims(markdown, dossierSlugs),
  })

  await mkdir(join(OUT_DIR, 'dossiers'), { recursive: true })
  await writeFile(join(OUT_DIR, 'claims.json'), `${JSON.stringify(ledger, null, 2)}\n`)

  const provenance = [
    { path: 'claims.json', source: 'claims.md', sha256: await sha256(claimsPath) },
  ]
  for (const name of dossierFiles) {
    const from = join(dossierDir, name)
    await writeFile(join(OUT_DIR, 'dossiers', name), await readFile(from))
    provenance.push({
      path: `dossiers/${name}`,
      source: `dossiers/${name}`,
      sha256: await sha256(from),
    })
  }

  const manifestPath = join(OUT_DIR, 'manifest.json')
  const manifest = instrumentManifestSchema.parse(JSON.parse(await readFile(manifestPath, 'utf8')))
  await writeFile(
    manifestPath,
    `${JSON.stringify(
      {
        ...manifest,
        dossiers: dossierFiles.map((name) => basename(name, '.md')),
        provenance,
      },
      null,
      2,
    )}\n`,
  )

  process.stdout.write(
    `${ledger.claims.length} claims, ${ledger.sections.length} sections, ${dossierFiles.length} dossiers\n`,
  )
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
