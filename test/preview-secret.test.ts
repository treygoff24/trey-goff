import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

test('preview page uses crypto.timingSafeEqual for secret comparison', () => {
  const previewPagePath = join(
    process.cwd(),
    'app/preview/writing/[slug]/page.tsx'
  )
  const content = readFileSync(previewPagePath, 'utf-8')

  assert.match(
    content,
    /import.*timingSafeEqual.*from ['"]crypto['"]/,
    'Should import timingSafeEqual from crypto'
  )

  assert.match(
    content,
    /timingSafeEqual/,
    'Should use timingSafeEqual for comparison'
  )

  assert.doesNotMatch(
    content,
    /secret(?:Param)?\s*===\s*(?:preview)?[Ss]ecret/,
    'Should not use === for secret comparison (timing attack vulnerability)'
  )
})
