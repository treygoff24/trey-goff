import assert from 'node:assert/strict'
import test from 'node:test'
import { statSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const MAX_SIZE_KB = 400
const MAX_SIZE_BYTES = MAX_SIZE_KB * 1024

test('preview images should not exceed 400KB each', () => {
  const chunksDir = join(process.cwd(), 'public', 'assets', 'chunks')
  const files = readdirSync(chunksDir)
  const previewFiles = files.filter((f) => f.includes('preview'))

  assert.ok(previewFiles.length > 0, 'Should have at least one preview file')

  const oversizedFiles: Array<{ name: string; sizeKB: number }> = []

  for (const file of previewFiles) {
    const filePath = join(chunksDir, file)
    const stats = statSync(filePath)
    const sizeKB = Math.round(stats.size / 1024)

    if (stats.size > MAX_SIZE_BYTES) {
      oversizedFiles.push({ name: file, sizeKB })
    }
  }

  assert.strictEqual(
    oversizedFiles.length,
    0,
    `Found ${oversizedFiles.length} oversized preview images:\n${oversizedFiles
      .map((f) => `  - ${f.name}: ${f.sizeKB}KB`)
      .join('\n')}`
  )
})
