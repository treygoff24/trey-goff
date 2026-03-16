import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function matcherRegex(): RegExp {
  const content = readFileSync(join(process.cwd(), 'proxy.ts'), 'utf-8')
  const match = content.match(/matcher:\s*\[\s*'([^']+)'/)
  assert.ok(match, 'proxy.ts should define a matcher pattern')
  const matcher = match[1]
  return new RegExp(`^${matcher}$`)
}

test('proxy matcher does not bypass dotted slugs', () => {
  const regex = matcherRegex()

  assert.match('/writing/node.js-guide', regex, 'dotted article slugs should still receive CSP')
  assert.match('/projects/v2.0', regex, 'dotted route segments should still receive CSP')
})

test('proxy matcher excludes known static assets/endpoints', () => {
  const regex = matcherRegex()

  assert.doesNotMatch('/robots.txt', regex)
  assert.doesNotMatch('/sitemap.xml', regex)
  assert.doesNotMatch('/_next/static/chunks/app.js', regex)
  assert.doesNotMatch('/assets/chunks/nebula_blue.webp', regex)
  assert.doesNotMatch('/assets/fonts/site.woff2', regex)
})
