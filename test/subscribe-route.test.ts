import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

test('subscribe route uses shared request helpers', () => {
  const src = readFileSync(join(process.cwd(), 'app/api/subscribe/route.ts'), 'utf-8')
  assert.match(src, /parseSubscribePostBody/)
  assert.match(src, /getTrustedClientIp/)
  assert.match(src, /isJsonContentType/)
})
