import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('Graph code splitting', () => {
  test('GraphClient uses dynamic import for GraphCanvas (ssr: false)', () => {
    const filePath = join(process.cwd(), 'components/graph/GraphClient.tsx')
    const source = readFileSync(filePath, 'utf-8')

    assert.match(
      source,
      /import\s+dynamic\s+from\s+['"]next\/dynamic['"]/,
      'Should import dynamic from next/dynamic'
    )

    assert.match(
      source,
      /dynamic\s*\(/,
      'Should use dynamic() function call'
    )

    assert.match(
      source,
      /ssr:\s*false/,
      'GraphCanvas dynamic import should have ssr: false'
    )
  })

  test('Graph page uses static import for GraphClient', () => {
    const filePath = join(process.cwd(), 'app/graph/page.tsx')
    const source = readFileSync(filePath, 'utf-8')

    assert.match(
      source,
      /import\s+\{[^}]*GraphClient[^}]*\}\s+from\s+['"]@\/components\/graph\/GraphClient['"]/,
      'Should have static import of GraphClient'
    )

    assert.doesNotMatch(
      source,
      /import\s+dynamic\s+from\s+['"]next\/dynamic['"]/,
      'Should NOT import dynamic from next/dynamic'
    )
  })
})
