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

const NEXT_DIR = '.next'
const STATIC_CHUNKS_DIR = path.join(NEXT_DIR, 'static/chunks')
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

function staticChunkPath(chunk: string): string {
  return path.join(STATIC_CHUNKS_DIR, path.basename(chunk))
}

function extractChunks(text: string): string[] {
  return unique(
    [...text.matchAll(/(?:\/_next\/)?static\/chunks\/[^"'<>\s)]+\.js/g)].map((match) =>
      match[0].replace(/^\/_next\//, ''),
    ),
  )
}

function collectLoadableChunks(filePath: string): string[] {
  const manifest = readJsonRecord(filePath)
  const chunks: string[] = []

  for (const value of Object.values(manifest)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue
    const files = (value as Record<string, unknown>).files
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

function verifyAppRoutesExist(): string[] {
  const appRoutes = readJsonRecord(path.join(NEXT_DIR, 'app-path-routes-manifest.json'))
  return PROTECTED_ROUTES.filter((route) => appRoutes[routeToAppPath(route)] !== route)
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

const failures = [
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
console.log(`Warnings: ${(interactiveWarning ? 1 : 0) + (machineWarning ? 1 : 0)}`)

if (failures.length > 0) {
  console.log('\n✗ Bundle isolation FAILED')
  for (const failure of failures) console.log(`  - ${failure}`)
  process.exit(1)
}

console.log('\n✓ Bundle isolation verified')
