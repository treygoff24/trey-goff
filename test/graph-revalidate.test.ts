import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import path from 'node:path'

test('graph page exports revalidate constant set to 3600', () => {
  const graphPagePath = path.join(process.cwd(), 'app/graph/page.tsx')
  const content = fs.readFileSync(graphPagePath, 'utf-8')

  assert.match(content, /export const revalidate/, 'Should export revalidate constant')
  assert.match(content, /export const revalidate\s*=\s*3600/, 'revalidate should be set to 3600')
})
