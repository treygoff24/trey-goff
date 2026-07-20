import { stat } from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const [input, output, preset = 'safe'] = process.argv.slice(2)
if (!input || !output || !['safe', 'aggressive', 'raw'].includes(preset)) {
  console.error('Usage: npm run assets:optimize -- input.glb output.glb [safe|aggressive|raw]')
  process.exit(1)
}

// meshopt needs MeshoptDecoder registered on the loader at runtime, and
// GLTFLoader throws outright without it. The `raw` preset skips mesh
// compression for assets small enough that the saving is not worth shipping a
// decoder for — a few KB of geometry compresses fine over the wire anyway.
const args = [
  'optimize',
  input,
  output,
  ...(preset === 'raw' ? ['--compress', 'false'] : ['--compress', 'meshopt']),
  '--texture-compress',
  'webp',
  '--texture-size',
  '2048',
]

if (preset === 'safe') {
  // Preserve semantic scene structure used by interaction, collisions, spawn points, and tests.
  args.push(
    '--flatten',
    'false',
    '--instance',
    'false',
    '--join',
    'false',
    '--palette',
    'false',
    '--simplify',
    'false',
  )
}

// gltf-transform is a local devDependency, not a global binary, so resolve it
// through the package runner. Calling it bare exits 1 with no output, which
// reads as a silent no-op rather than a failure.
console.log(`Running: gltf-transform ${args.join(' ')}`)
const result = spawnSync('pnpm', ['exec', 'gltf-transform', ...args], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
})
if (result.status !== 0) {
  console.error(`gltf-transform failed with status ${result.status ?? 'unknown'}`)
  process.exit(result.status ?? 1)
}

const [before, after] = await Promise.all([stat(input), stat(output)])
const saved = before.size > 0 ? (1 - after.size / before.size) * 100 : 0
console.log(
  `${path.basename(input)}: ${format(before.size)} → ${format(after.size)} (${saved.toFixed(1)}% smaller)`,
)
console.log('Now run: npm run assets:validate')
console.log('Then visually compare the source and optimized files at every scripted bookmark.')

function format(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}
