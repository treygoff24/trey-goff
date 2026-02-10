import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf-8')
}

test('interactive and library layouts opt into dynamic rendering for nonce injection', () => {
  const interactiveLayout = read('app/interactive/layout.tsx')
  const libraryLayout = read('app/library/layout.tsx')

  assert.match(
    interactiveLayout,
    /import\s+\{\s*connection\s*\}\s+from\s+["']next\/server["']/,
    'interactive layout should import connection()'
  )
  assert.match(
    interactiveLayout,
    /await\s+connection\(\)/,
    'interactive layout should opt into dynamic rendering'
  )

  assert.match(
    libraryLayout,
    /import\s+\{\s*connection\s*\}\s+from\s+["']next\/server["']/,
    'library layout should import connection()'
  )
  assert.match(
    libraryLayout,
    /await\s+connection\(\)/,
    'library layout should opt into dynamic rendering'
  )
})

test('root layout remains static-friendly (no global connection call)', () => {
  const rootLayout = read('app/layout.tsx')

  assert.doesNotMatch(
    rootLayout,
    /await\s+connection\(\)/,
    'root layout should not force global dynamic rendering'
  )
})
