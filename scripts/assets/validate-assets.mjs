import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

// gltf-validator is CommonJS with no declared default export, so a plain ESM
// default import resolves at runtime but trips the import linter.
const validator = createRequire(import.meta.url)('gltf-validator')

const assetRoot = path.resolve(process.argv[2] ?? 'public/assets')
const files = await collect(assetRoot)
const glbs = files.filter((file) => file.toLowerCase().endsWith('.glb'))
const looseGltf = files.filter((file) => file.toLowerCase().endsWith('.gltf'))

if (looseGltf.length > 0) {
  console.error('Use binary .glb files for runtime assets. Loose .gltf files found:')
  for (const file of looseGltf) console.error(`  - ${path.relative(process.cwd(), file)}`)
  process.exitCode = 1
}

if (glbs.length === 0) {
  console.log(
    `No .glb files found in ${path.relative(process.cwd(), assetRoot)}. Nothing to validate.`,
  )
} else {
  let failed = false
  for (const file of glbs) {
    const bytes = new Uint8Array(await readFile(file))
    const report = await validator.validateBytes(bytes, {
      uri: path.basename(file),
      maxIssues: 100,
      ignoredIssues: ['UNUSED_OBJECT'],
    })
    const issues = report.issues
    const label = path.relative(process.cwd(), file)
    console.log(
      `${label}: ${issues.numErrors} errors, ${issues.numWarnings} warnings, ${issues.numInfos} infos`,
    )
    if (issues.numErrors > 0) {
      failed = true
      for (const message of issues.messages.filter((item) => item.severity === 0)) {
        console.error(`  ${message.code}: ${message.message}`)
      }
    }
  }
  if (failed) process.exitCode = 1
}

async function collect(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true })
    const nested = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(directory, entry.name)
        return entry.isDirectory() ? collect(fullPath) : [fullPath]
      }),
    )
    return nested.flat()
  } catch (error) {
    if (error?.code === 'ENOENT') return []
    throw error
  }
}
