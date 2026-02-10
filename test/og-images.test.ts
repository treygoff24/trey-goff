import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

test('opengraph-image.tsx should exist for all major pages', () => {
  const appDir = join(process.cwd(), 'app')
  
  const requiredOGImages = [
    join(appDir, 'projects', 'opengraph-image.tsx'),
    join(appDir, 'library', 'opengraph-image.tsx'),
    join(appDir, 'topics', '[tag]', 'opengraph-image.tsx'),
    join(appDir, 'graph', 'opengraph-image.tsx'),
    join(appDir, 'media', 'opengraph-image.tsx'),
    join(appDir, 'transmissions', 'opengraph-image.tsx'),
  ]

  for (const imagePath of requiredOGImages) {
    assert.strictEqual(
      existsSync(imagePath),
      true,
      `Missing opengraph-image.tsx at ${imagePath}`
    )
  }
})
