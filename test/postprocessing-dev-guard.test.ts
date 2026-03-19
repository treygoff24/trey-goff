import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf-8')
}

test('home starfield only enables postprocessing in production', () => {
  const source = read('components/ui/StarfieldBackground.tsx')

  assert.match(source, /const enablePostProcessing = process\.env\.NODE_ENV === 'production'/)
  assert.match(source, /\{enablePostProcessing && \(/)
})

test('library postprocessing only enables effects in production', () => {
  const source = read('components/library/floating/PostProcessingEffects.tsx')

  assert.match(source, /const enablePostProcessing = process\.env\.NODE_ENV === 'production'/)
  assert.match(source, /if \(!enabled \|\| !enablePostProcessing\)/)
})
