import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

test('Next.js version >= 16.1.5 to patch CVE-2025-56334, CVE-2025-56335, CVE-2025-56336', () => {
  const packageJsonPath = join(process.cwd(), 'package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

  const nextVersion = packageJson.dependencies.next
  assert(nextVersion, 'next should be in dependencies')

  const versionMatch = nextVersion.match(/[\d.]+/)
  assert(versionMatch, 'next version should be parseable')

  const [major, minor, patch] = versionMatch[0].split('.').map(Number)

  const meetsRequirement =
    major > 16 ||
    (major === 16 && minor > 1) ||
    (major === 16 && minor === 1 && patch >= 5)

  assert(
    meetsRequirement,
    `Next.js version ${versionMatch[0]} does not meet security requirement >= 16.1.5`
  )
})
