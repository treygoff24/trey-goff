import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

test('preview auth uses crypto.timingSafeEqual for secret comparison', () => {
  const previewAuthPath = join(process.cwd(), 'lib/preview-auth.ts')
  const content = readFileSync(previewAuthPath, 'utf-8')

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
    /providedSecret\s*===\s*previewSecret|secret(?:Param)?\s*===\s*(?:preview)?[Ss]ecret/,
    'Should not use === for secret comparison (timing attack vulnerability)'
  )
})
