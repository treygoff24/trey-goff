import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const packageJson = JSON.parse(readFileSync('package.json', 'utf-8')) as {
  scripts?: Record<string, string>
}

test('coverage test script preserves the content sync bootstrap from the main test script', () => {
  const testScript = packageJson.scripts?.test ?? ''
  const coverageScript = packageJson.scripts?.['test:coverage'] ?? ''

  assert.match(testScript, /^pnpm content:sync && /)
  assert.match(coverageScript, /^pnpm content:sync && /)
})
