import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function matcherRegexes(): RegExp[] {
  const content = readFileSync(join(process.cwd(), 'proxy.ts'), 'utf-8')
  const match = content.match(/matcher:\s*\[([\s\S]*?)\]/)
  const matcherBlock = match?.[1]
  if (!matcherBlock) throw new Error('proxy.ts should define matcher patterns')
  return [...matcherBlock.matchAll(/'([^']+)'/g)].map(
    ([, matcher]) => new RegExp(`^${matcher!.replace(/:path\*/g, '.*')}$`),
  )
}

test('proxy matcher does not bypass dotted slugs', () => {
  const regexes = matcherRegexes()

  assert.ok(
    regexes.some((regex) => regex.test('/writing/node.js-guide')),
    'dotted article slugs should still receive CSP',
  )
  assert.ok(
    regexes.some((regex) => regex.test('/projects/v2.0')),
    'dotted route segments should still receive CSP',
  )
})

test('explicit classified matcher covers extension-shaped entry slugs', () => {
  assert.ok(
    matcherRegexes().some((regex) => regex.test('/classified/welcome.pdf')),
    'classified extension-shaped slugs must receive privacy headers',
  )
})

test('proxy matcher excludes known static assets/endpoints', () => {
  const regexes = matcherRegexes()

  for (const pathname of [
    '/robots.txt',
    '/sitemap.xml',
    '/_next/static/chunks/app.js',
    '/assets/chunks/nebula_blue.webp',
    '/assets/fonts/site.woff2',
  ]) {
    assert.equal(
      regexes.some((regex) => regex.test(pathname)),
      false,
      `${pathname} should be excluded`,
    )
  }
})
