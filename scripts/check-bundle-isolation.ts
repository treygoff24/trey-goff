#!/usr/bin/env tsx
/**
 * Bundle isolation: keep heavy interactive packages out of static/editorial routes.
 *
 * Next App Router does not expose useful route mappings in `.next/build-manifest.json`.
 * This checker resolves routes through the App Router manifests, then scans each route's
 * client-reference manifest, dynamic loadable manifest, rendered HTML, and referenced chunks.
 */

import * as fs from 'fs'
import * as path from 'path'
import { INSTRUMENT_SENTINEL } from '../components/instruments/sentinel'

const NEXT_DIR = '.next'
const SERVER_APP_DIR = path.join(NEXT_DIR, 'server/app')

const PROTECTED_ROUTES = [
  '/',
  '/writing',
  '/projects',
  '/about',
  '/library',
  '/notes',
  '/media',
  '/topics',
  '/transmissions',
  '/powerlifting',
  '/subscribe',
  '/now',
  '/colophon',
  '/graph',
  '/edition',
  '/mission-control',
  '/resident',
  '/stack',
  '/jobsite',
]

const HEAVY_3D_PATTERNS = [
  {
    label: 'three',
    needles: ['node_modules/three/', '.pnpm/three@', '"three"', "'three'", 'THREE.'],
  },
  { label: '@react-three', needles: ['node_modules/@react-three/', '.pnpm/@react-three+'] },
  { label: 'postprocessing', needles: ['node_modules/postprocessing/', '.pnpm/postprocessing@'] },
  {
    label: 'troika-three-text',
    needles: ['node_modules/troika-three-text/', '.pnpm/troika-three-text@'],
  },
  { label: 'three-stdlib', needles: ['node_modules/three-stdlib/', '.pnpm/three-stdlib@'] },
]

const LIBRARY_FORBIDDEN_PATTERNS = [
  { label: 'sigma', needles: ['node_modules/sigma/', '.pnpm/sigma@'] },
  { label: 'graphology', needles: ['node_modules/graphology', '.pnpm/graphology'] },
  { label: '@react-sigma', needles: ['node_modules/@react-sigma/', '.pnpm/@react-sigma+'] },
]

interface ForbiddenPattern {
  label: string
  needles: string[]
}

interface RouteAnalysis {
  route: string
  artifacts: string[]
  chunks: string[]
  forbidden: Array<{ label: string; artifact: string }>
}

function readText(filePath: string): string {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
}

function readJsonRecord(filePath: string): Record<string, unknown> {
  if (!fs.existsSync(filePath)) return {}
  const parsed: unknown = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {}
}

function routeToAppPath(route: string): string {
  return route === '/' ? '/page' : `${route}/page`
}

function routeToServerPath(route: string): string {
  return route === '/' ? 'page' : `${route.slice(1)}/page`
}

function routeToHtmlPath(route: string): string {
  return path.join(SERVER_APP_DIR, route === '/' ? 'index.html' : `${route.slice(1)}.html`)
}

function routeToRscPath(route: string): string {
  return path.join(SERVER_APP_DIR, route === '/' ? 'index.rsc' : `${route.slice(1)}.rsc`)
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort()
}

/**
 * Chunk references are already `static/chunks/...` paths relative to `.next`, and App Router
 * nests them by route. Reducing them to a basename silently resolved nested chunks to files
 * that do not exist, so those chunks were never scanned at all.
 */
function staticChunkPath(chunk: string): string {
  return path.join(NEXT_DIR, chunk)
}

function extractChunks(text: string): string[] {
  return unique(
    [...text.matchAll(/(?:\/_next\/)?static\/chunks\/[^"'<>\s)]+\.js/g)].map((match) =>
      match[0].replace(/^\/_next\//, ''),
    ),
  )
}

/**
 * One entry of Next's `react-loadable-manifest.json`: a dynamically imported module and the
 * chunk files it pulls in. Fields stay optional and loosely typed because this is a build
 * artifact read off disk, not a value this repo produces.
 */
interface LoadableManifestEntry {
  files?: unknown
}

function collectLoadableChunks(filePath: string): string[] {
  const manifest = readJsonRecord(filePath)
  const chunks: string[] = []

  for (const value of Object.values(manifest)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue
    const { files } = value as LoadableManifestEntry
    if (!Array.isArray(files)) continue
    for (const file of files) {
      if (typeof file === 'string' && file.endsWith('.js')) chunks.push(file)
    }
  }

  return unique(chunks)
}

function matchesForbidden(content: string, patterns: ForbiddenPattern[]): string[] {
  const hits: string[] = []
  for (const pattern of patterns) {
    if (pattern.needles.some((needle) => content.includes(needle))) hits.push(pattern.label)
  }
  return unique(hits)
}

function resolveRouteArtifacts(route: string): RouteAnalysis | null {
  const serverPath = routeToServerPath(route)
  const artifactCandidates = [
    path.join(SERVER_APP_DIR, `${serverPath}_client-reference-manifest.js`),
    path.join(SERVER_APP_DIR, `${serverPath}.js`),
    routeToHtmlPath(route),
    routeToRscPath(route),
  ].filter((candidate) => fs.existsSync(candidate))

  const loadablePath = path.join(SERVER_APP_DIR, serverPath, 'react-loadable-manifest.json')
  const loadableChunks = collectLoadableChunks(loadablePath)
  if (fs.existsSync(loadablePath)) artifactCandidates.push(loadablePath)

  if (artifactCandidates.length === 0) return null

  const chunks = unique([
    ...loadableChunks,
    ...artifactCandidates.flatMap((artifact) => extractChunks(readText(artifact))),
  ])

  const artifacts = unique([
    ...artifactCandidates,
    ...chunks.map(staticChunkPath).filter(fs.existsSync),
  ])
  const routePatterns =
    route === '/library' ? [...HEAVY_3D_PATTERNS, ...LIBRARY_FORBIDDEN_PATTERNS] : HEAVY_3D_PATTERNS

  const forbidden = artifacts.flatMap((artifact) =>
    matchesForbidden(readText(artifact), routePatterns).map((label) => ({ label, artifact })),
  )

  return { route, artifacts, chunks, forbidden }
}

/* Instrument isolation — see `verifyInstrumentIsolation` below for what is actually proved. */
const INSTRUMENTS_DIR = 'content/instruments'
const ESSAYS_DIR = 'content/essays'

function instrumentedSlugs(): string[] {
  if (!fs.existsSync(INSTRUMENTS_DIR)) return []
  return fs
    .readdirSync(INSTRUMENTS_DIR, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        fs.existsSync(path.join(INSTRUMENTS_DIR, entry.name, 'manifest.json')),
    )
    .map((entry) => entry.name)
    .sort()
}

function essaySlugs(): string[] {
  if (!fs.existsSync(ESSAYS_DIR)) return []
  return fs
    .readdirSync(ESSAYS_DIR)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/, ''))
    .sort()
}

interface EssayArtifacts {
  /** The prerendered page itself: HTML and the Flight payload beside it. */
  pages: string[]
  /** Every client chunk those documents reference, as files on disk. */
  chunks: string[]
}

function essayArtifacts(slug: string): EssayArtifacts {
  const pages = [
    path.join(SERVER_APP_DIR, `writing/${slug}.html`),
    path.join(SERVER_APP_DIR, `writing/${slug}.rsc`),
  ].filter((candidate) => fs.existsSync(candidate))

  const chunks = unique(pages.flatMap((page) => extractChunks(readText(page))))
    .map(staticChunkPath)
    .filter(fs.existsSync)

  return { pages, chunks }
}

function sentinelHits(paths: readonly string[]): string[] {
  return paths.filter((candidate) => readText(candidate).includes(INSTRUMENT_SENTINEL))
}

/**
 * A draft essay is not in `generateStaticParams` on a production build, so it has no page on
 * disk to inspect. That is not a leak — it is the draft gate working — and treating it as one
 * would mean an instrumented piece could never be developed behind the preview route.
 */
function isDraft(slug: string): boolean {
  const frontmatter = readText(path.join(ESSAYS_DIR, `${slug}.mdx`)).split('---')[1] ?? ''
  return /^status:\s*['"]?draft['"]?\s*$/m.test(frontmatter)
}

interface InstrumentCheck {
  instrumented: string[]
  skipped: string[]
  plainChecked: number
  failures: string[]
}

/**
 * The forbidden-package scan cannot see first-party code, so it would pass even if every essay
 * shipped the ledger. Each instrument component stamps a sentinel onto its root instead, and
 * this proves two things about it:
 *
 *  - an instrumented piece must carry the sentinel in the client JavaScript its page actually
 *    references. Prerendered HTML and the Flight payload do not count: `data-instrument` lands
 *    in both whether or not a single byte of instrument code reaches the browser.
 *  - *every* ordinary essay must be free of it, in chunks and in markup alike. Comparing one
 *    arbitrary plain slug let a non-representative essay hide a leak in all the others.
 */
function verifyInstrumentIsolation(): InstrumentCheck {
  const all = instrumentedSlugs()
  const skipped = all.filter(isDraft)
  const instrumented = all.filter((slug) => !skipped.includes(slug))
  const failures: string[] = []

  // Positive artifact proof needs a published instrumented piece, but the leak scan below
  // must run whenever any instrument content exists — draft-only is exactly when a leak
  // would otherwise go unwatched.
  for (const slug of instrumented) {
    const { pages, chunks } = essayArtifacts(slug)
    if (pages.length === 0) {
      failures.push(`instrumented slug ${slug} has no built page artifacts`)
      continue
    }
    if (chunks.length === 0) {
      failures.push(`instrumented slug ${slug} references no client chunks on disk`)
      continue
    }
    if (sentinelHits(chunks).length === 0) {
      failures.push(
        `instrumented slug ${slug} ships no instrument client chunk (sentinel absent from all ${chunks.length} referenced chunks)`,
      )
    }
  }

  const plain = essaySlugs()
    .filter((slug) => !all.includes(slug))
    .map((slug) => ({ slug, ...essayArtifacts(slug) }))
    .filter((essay) => essay.pages.length > 0)

  if (plain.length === 0) {
    failures.push('no ordinary essay was built to compare the instrumented slugs against')
  }

  for (const essay of plain) {
    for (const artifact of sentinelHits([...essay.pages, ...essay.chunks])) {
      failures.push(`ordinary essay ${essay.slug} loads instrument code: ${artifact}`)
    }
  }

  return { instrumented, skipped, plainChecked: plain.length, failures }
}

function verifyAppRoutesExist(): string[] {
  const appRoutes = readJsonRecord(path.join(NEXT_DIR, 'app-path-routes-manifest.json'))
  return PROTECTED_ROUTES.filter((route) => appRoutes[routeToAppPath(route)] !== route)
}

/**
 * Wave 4 put publication furniture on two index routes: the cover on `/writing` and the
 * instrumented marker on `/edition`. Both are server-rendered on purpose, so neither may pull
 * an instrument chunk — an index page is not a reading surface and must not pay for one.
 */
const INSTRUMENT_FREE_ROUTES = ['/writing', '/edition']

function verifyIndexRoutesInstrumentFree(analyses: readonly RouteAnalysis[]): string[] {
  return analyses
    .filter((analysis) => INSTRUMENT_FREE_ROUTES.includes(analysis.route))
    .flatMap((analysis) =>
      analysis.artifacts
        .filter((artifact) => readText(artifact).includes(INSTRUMENT_SENTINEL))
        .map((artifact) => `${analysis.route} loads instrument code: ${artifact}`),
    )
}

function verifyInteractiveDynamicImport(): string | null {
  const source = readText('components/interactive/InteractiveShell.tsx')
  if (!source) return 'components/interactive/InteractiveShell.tsx missing'
  return source.includes('dynamic(') && source.includes('InteractiveWorld')
    ? null
    : 'InteractiveWorld should stay behind next/dynamic in InteractiveShell'
}

// /machine is the one new heavy R3F route; its scene must load via next/dynamic
// so the three.js payload never lands in a protected editorial route's bundle.
function verifyMachineDynamicImport(): string | null {
  const source = readText('components/machine/MachineShell.tsx')
  if (!source) return 'components/machine/MachineShell.tsx missing'
  return source.includes('dynamic(') && source.includes('MachineWorld')
    ? null
    : 'MachineWorld should stay behind next/dynamic in MachineShell'
}

console.log('Bundle Isolation Check\n')
console.log('='.repeat(50))

if (!fs.existsSync(NEXT_DIR)) {
  console.error('Missing .next directory. Run pnpm build first.')
  process.exit(1)
}

const missingAppRoutes = verifyAppRoutesExist()
const routeAnalyses = PROTECTED_ROUTES.map((route) => resolveRouteArtifacts(route))
const missingArtifacts = PROTECTED_ROUTES.filter((_, index) => routeAnalyses[index] === null)
const analyses = routeAnalyses.filter((analysis): analysis is RouteAnalysis => analysis !== null)
const interactiveWarning = verifyInteractiveDynamicImport()
const machineWarning = verifyMachineDynamicImport()
const instrumentCheck = verifyInstrumentIsolation()
const indexRouteLeaks = verifyIndexRoutesInstrumentFree(analyses)
const violations = analyses.flatMap((analysis) =>
  analysis.forbidden.map((hit) => ({ route: analysis.route, ...hit })),
)

console.log('\n1. Protected App Router routes')
console.log(`   Expected: ${PROTECTED_ROUTES.length}`)
console.log(`   Resolved artifacts for: ${analyses.length}`)
for (const analysis of analyses) {
  console.log(
    `   - ${analysis.route}: ${analysis.chunks.length} static chunks, ${analysis.artifacts.length} artifacts`,
  )
}

console.log('\n2. Forbidden package scan')
if (violations.length === 0) {
  console.log('   ✓ No protected route loads forbidden heavy packages')
} else {
  for (const violation of violations) {
    console.log(`   ✗ ${violation.route}: ${violation.label} in ${violation.artifact}`)
  }
}

console.log('\n3. Dynamic heavy route guard')
if (interactiveWarning) {
  console.log(`   ⚠ ${interactiveWarning}`)
} else {
  console.log('   ✓ /interactive keeps InteractiveWorld dynamically imported')
}
if (machineWarning) {
  console.log(`   ⚠ ${machineWarning}`)
} else {
  console.log('   ✓ /machine keeps MachineWorld dynamically imported')
}

console.log('\n4. Instrument isolation')
if (instrumentCheck.skipped.length > 0) {
  console.log(`   Draft (not built, not checked): ${instrumentCheck.skipped.join(', ')}`)
}
if (instrumentCheck.instrumented.length === 0) {
  console.log('   – no published instrumented pieces built; nothing to isolate')
} else {
  console.log(`   Instrumented slugs: ${instrumentCheck.instrumented.join(', ')}`)
  console.log(`   Ordinary essays asserted clean: ${instrumentCheck.plainChecked}`)
  if (instrumentCheck.failures.length === 0) {
    console.log(
      '   ✓ Instrument client code present in every instrumented piece, absent from every ordinary essay',
    )
  } else {
    for (const failure of instrumentCheck.failures) console.log(`   ✗ ${failure}`)
  }
}

if (indexRouteLeaks.length === 0) {
  console.log(`   ✓ ${INSTRUMENT_FREE_ROUTES.join(' and ')} stay free of instrument client code`)
} else {
  for (const leak of indexRouteLeaks) console.log(`   ✗ ${leak}`)
}

const failures = [
  ...instrumentCheck.failures,
  ...indexRouteLeaks,
  ...missingAppRoutes.map((route) => `missing app route mapping: ${route}`),
  ...missingArtifacts.map((route) => `missing route artifacts: ${route}`),
  ...violations.map((violation) => `${violation.route} imports ${violation.label}`),
]

console.log('\n' + '='.repeat(50))
console.log('SUMMARY')
console.log('='.repeat(50))
console.log(`Protected routes: ${PROTECTED_ROUTES.length}`)
console.log(`Missing app route mappings: ${missingAppRoutes.length}`)
console.log(`Missing route artifacts: ${missingArtifacts.length}`)
console.log(`Forbidden package violations: ${violations.length}`)
console.log(`Instrument isolation failures: ${instrumentCheck.failures.length}`)
console.log(`Warnings: ${(interactiveWarning ? 1 : 0) + (machineWarning ? 1 : 0)}`)

if (failures.length > 0) {
  console.log('\n✗ Bundle isolation FAILED')
  for (const failure of failures) console.log(`  - ${failure}`)
  process.exit(1)
}

console.log('\n✓ Bundle isolation verified')
