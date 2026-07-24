import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import test, { describe } from 'node:test'
import { NextRequest } from 'next/server'
import {
  ANNEX_SECRET_MIN_LENGTH,
  annexSessionToken,
  areAnnexSecretsEqual,
  canAccessAnnex,
  getConfiguredAnnexSecret,
  isValidAnnexSessionCookie,
} from '@/lib/annex-auth'
import { getAnnexArchive } from '@/lib/annex/content'
import { parseAnnexEntry } from '@/lib/annex/frontmatter'
import { proxy } from '@/proxy'

const entrySource = `---
title: A private note
date: 2026-07-19
summary: "A summary with: punctuation"
---
# The note

Private words live here.`

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('annex frontmatter', () => {
  test('parses required fields, body, and reading metadata', () => {
    const entry = parseAnnexEntry(entrySource, 'private-note')
    assert.equal(entry.title, 'A private note')
    assert.equal(entry.date, '2026-07-19')
    assert.equal(entry.summary, 'A summary with: punctuation')
    assert.match(entry.body, /^# The note/)
    assert.equal(entry.wordCount, 7)
    assert.equal(entry.readingTime, 1)
  })

  test('rejects malformed frontmatter and unsafe slugs', () => {
    assert.throws(() => parseAnnexEntry('No frontmatter', 'note'))
    assert.throws(() => parseAnnexEntry(entrySource, '../private-note'))
    assert.throws(() => parseAnnexEntry('---\ntitle: Missing fields\n---\nBody', 'missing-fields'))
    assert.throws(() =>
      parseAnnexEntry(entrySource.replace('2026-07-19', '2026-99-99'), 'invalid-date'),
    )
  })
})

describe('annex authentication gate', () => {
  test('derives and validates a secret-bound cookie', () => {
    const secret = 'current-annex-secret-with-at-least-thirty-two-chars'
    const token = annexSessionToken(secret)
    assert.equal(isValidAnnexSessionCookie(token, secret), true)
    assert.equal(canAccessAnnex(token, secret), true)
    assert.notEqual(token, annexSessionToken(`${secret}-rotated`))
  })

  test('rotating ANNEX_SECRET invalidates the old cookie', () => {
    const oldToken = annexSessionToken('old-annex-secret-with-at-least-thirty-two-chars')
    assert.equal(canAccessAnnex(oldToken, 'new-annex-secret-with-at-least-thirty-two-chars'), false)
  })

  test('missing ANNEX_SECRET always degrades to gag-only access', () => {
    assert.equal(canAccessAnnex('any-cookie', undefined), false)
    assert.equal(canAccessAnnex(undefined, undefined), false)
  })

  test('compares raw bootstrap keys through equal-length hashes', () => {
    assert.equal(areAnnexSecretsEqual('matching', 'matching'), true)
    assert.equal(areAnnexSecretsEqual('short', 'a-different-length-value'), false)
  })

  test('rejects configured secrets below the minimum entropy length', () => {
    assert.equal(getConfiguredAnnexSecret(undefined), undefined)
    assert.throws(
      () => getConfiguredAnnexSecret('too-short'),
      new RegExp(`ANNEX_SECRET must be at least ${ANNEX_SECRET_MIN_LENGTH} characters`),
    )
  })
})

describe('annex content retrieval', () => {
  test('fetches GitHub contents with no-store and parses entries', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = []
    const fetcher = (async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input)
      requests.push({ url, init })
      if (url.endsWith('/contents/entries')) {
        return jsonResponse([
          { name: 'private-note.md', path: 'entries/private-note.md', type: 'file' },
        ])
      }
      return jsonResponse({
        encoding: 'base64',
        content: Buffer.from(entrySource).toString('base64'),
      })
    }) as typeof fetch

    const archive = await getAnnexArchive({
      token: 'test-value',
      repo: 'example/annex-content',
      fetcher,
    })

    assert.equal(archive.status, 'ready')
    if (archive.status !== 'ready') return
    assert.equal(archive.entries[0]?.slug, 'private-note')
    assert.equal(requests.length, 2)
    assert.ok(requests.every(({ init }) => init?.cache === 'no-store'))
    assert.ok(requests.every(({ init }) => init?.signal instanceof AbortSignal))
    assert.ok(requests.every(({ init }) => new Headers(init?.headers).has('Authorization')))
  })

  test('bounds repository entry count, decoded entry size, and concurrent requests', async () => {
    let active = 0
    let peakActive = 0
    const directory = Array.from({ length: 80 }, (_, index) => ({
      name: `entry-${index}.md`,
      path: `entries/entry-${index}.md`,
      type: 'file',
    }))
    const fetcher = (async (input: string | URL | Request) => {
      const url = String(input)
      if (url.endsWith('/contents/entries')) return jsonResponse(directory)
      active++
      peakActive = Math.max(peakActive, active)
      await new Promise((resolve) => setTimeout(resolve, 1))
      active--
      return jsonResponse({
        encoding: 'base64',
        content: Buffer.from(entrySource).toString('base64'),
      })
    }) as typeof fetch

    const archive = await getAnnexArchive({
      token: 'test-value',
      repo: 'example/annex-content',
      fetcher,
    })

    assert.equal(archive.status, 'ready')
    if (archive.status === 'ready') assert.equal(archive.entries.length, 50)
    assert.ok(peakActive <= 4)
  })

  test('rejects oversized encoded entries and abort failures as sealed archives', async () => {
    const oversized = 'A'.repeat(400_000)
    const archive = await getAnnexArchive({
      token: 'test-value',
      repo: 'example/annex-content',
      fetcher: (async (input: string | URL | Request) => {
        if (String(input).endsWith('/contents/entries')) {
          return jsonResponse([
            { name: 'private-note.md', path: 'entries/private-note.md', type: 'file' },
          ])
        }
        return jsonResponse({ encoding: 'base64', content: oversized })
      }) as typeof fetch,
    })
    assert.deepEqual(archive, { status: 'unavailable' })

    const aborted = await getAnnexArchive({
      token: 'test-value',
      repo: 'example/annex-content',
      fetcher: (async () => {
        throw new DOMException('Timed out', 'AbortError')
      }) as typeof fetch,
    })
    assert.deepEqual(aborted, { status: 'unavailable' })
  })

  test('missing GitHub configuration does not fetch', async () => {
    let fetched = false
    const archive = await getAnnexArchive({
      token: '',
      repo: '',
      fetcher: (async () => {
        fetched = true
        throw new Error('must not fetch')
      }) as typeof fetch,
    })
    assert.deepEqual(archive, { status: 'unavailable' })
    assert.equal(fetched, false)
  })

  for (const [failure, fetcher] of [
    ['not found', async () => jsonResponse({}, 404)],
    ['rate limited', async () => jsonResponse({}, 429)],
    ['network failure', async () => Promise.reject(new Error('offline'))],
  ] as const) {
    test(`${failure} degrades to the sealed-archive state`, async () => {
      const archive = await getAnnexArchive({
        token: 'test-value',
        repo: 'example/annex-content',
        fetcher: fetcher as typeof fetch,
      })
      assert.deepEqual(archive, { status: 'unavailable' })
    })
  }
})

test('annex code stays outside client, content, public generators, and client-link boundaries', async () => {
  const roots = ['app', 'components', 'lib', 'scripts']
  const sourceFiles: string[] = []
  for (const root of roots) {
    const entries = await readdir(root, { recursive: true, withFileTypes: true })
    sourceFiles.push(
      ...entries
        .filter((entry) => entry.isFile() && /\.[cm]?[jt]sx?$/.test(entry.name))
        .map((entry) => path.join(entry.parentPath, entry.name)),
    )
  }
  sourceFiles.push('content-collections.ts')
  const sources = new Map(
    await Promise.all(
      sourceFiles.map(async (file) => [file, await readFile(file, 'utf8')] as const),
    ),
  )
  const extensions = ['.ts', '.tsx', '.js', '.jsx']
  const resolveImport = (from: string, specifier: string): string | undefined => {
    const base = specifier.startsWith('@/')
      ? specifier.slice(2)
      : specifier.startsWith('.')
        ? path.normalize(path.join(path.dirname(from), specifier))
        : undefined
    if (!base) return undefined
    return [
      ...extensions.map((extension) => `${base}${extension}`),
      ...extensions.map((extension) => path.join(base, `index${extension}`)),
    ].find((candidate) => sources.has(candidate))
  }
  const importsOf = (file: string): string[] => {
    const source = sources.get(file) ?? ''
    const specs = [...source.matchAll(/(?:from\s*|import\s*\()['"]([^'"]+)['"]/g)].map(
      (match) => match[1]!,
    )
    return specs
      .map((specifier) => resolveImport(file, specifier))
      .filter((value): value is string => Boolean(value))
  }
  const reachesAnnex = (root: string, seen = new Set<string>()): boolean => {
    if (root.includes('/classified/') || root.includes('/annex/') || root.endsWith('annex-auth.ts'))
      return true
    if (seen.has(root)) return false
    seen.add(root)
    return importsOf(root).some((dependency) => reachesAnnex(dependency, seen))
  }
  const publicRoots = new Set([
    ...sourceFiles.filter((file) => /^['"]use client['"]/m.test(sources.get(file) ?? '')),
    ...sourceFiles.filter((file) =>
      /from ['"]content-collections['"]/.test(sources.get(file) ?? ''),
    ),
    ...sourceFiles.filter(
      (file) =>
        file.startsWith('scripts/generate-') || file === 'scripts/sync-content-collections.ts',
    ),
  ])
  for (const root of publicRoots)
    assert.equal(reachesAnnex(root), false, `${root} must remain isolated`)

  const annexFiles = sourceFiles.filter(
    (file) =>
      file.includes('/classified/') || file.includes('/annex/') || file.endsWith('annex-auth.ts'),
  )
  for (const file of annexFiles) {
    const source = sources.get(file) ?? ''
    assert.doesNotMatch(source, /^['"]use client['"]/m, `${file} must remain server-only`)
    assert.doesNotMatch(source, /from ['"]content-collections['"]/, `${file} must remain isolated`)
  }

  const readingRoom = sources.get('components/classified/ReadingRoom.tsx') ?? ''
  assert.doesNotMatch(
    readingRoom,
    /from ['"]next\/link['"]/,
    'reading room must use native anchors',
  )

  // Existence-hiding: no public page may link or name /classified. Only the
  // annex's own files may; the proxy bootstrap lives at the repo root, outside
  // this scanned set. A stray /lab-style reference would blow the annex cover.
  const annexFileSet = new Set(annexFiles)
  for (const [file, source] of sources) {
    if (annexFileSet.has(file)) continue
    assert.doesNotMatch(
      source,
      /['"`]\/classified/,
      `${file} must not reference /classified (annex existence-hiding)`,
    )
  }
})

test('entry authorization is uniform before any missing-entry decision', async () => {
  const entryRoute = await readFile('app/classified/[slug]/page.tsx', 'utf8')
  assert.ok(entryRoute.indexOf('canAccessAnnex') < entryRoute.indexOf('notFound()'))
  assert.equal(canAccessAnnex(undefined, undefined), false)
  assert.equal(
    canAccessAnnex(undefined, 'valid-annex-secret-with-at-least-thirty-two-chars'),
    false,
  )
})

test('classified routes force dynamic no-store rendering and proxy applies privacy headers to every path', async () => {
  const proxySource = await readFile('proxy.ts', 'utf8')
  const layoutSource = await readFile('app/classified/layout.tsx', 'utf8')
  assert.match(layoutSource, /export const dynamic = 'force-dynamic'/)
  assert.match(layoutSource, /export const fetchCache = 'force-no-store'/)
  assert.match(layoutSource, /export const revalidate = 0/)
  assert.match(proxySource, /response\.headers\.set\('Cache-Control', 'no-store, private'\)/)
  assert.match(
    proxySource,
    /response\.headers\.set\('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet'\)/,
  )
  assert.match(proxySource, /\^\\\/classified\(\?:\\\/\|\$\)/)
  assert.match(proxySource, /response\.headers\.append\('Vary', 'Cookie'\)/)
  assert.ok(proxySource.includes("'/classified/:path*'"))

  for (const pathname of ['/classified', '/classified/private-note', '/classified/welcome.pdf']) {
    const response = proxy(new NextRequest(`https://trey.world${pathname}`))
    assert.equal(response.headers.get('Cache-Control'), 'no-store, private')
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow, noarchive, nosnippet')
    assert.match(response.headers.get('Vary') ?? '', /Cookie/)
  }
})

test('bootstrap failures receive a same-shaped dummy session cookie', () => {
  const previous = process.env.ANNEX_SECRET
  const secret = 'valid-annex-secret-with-at-least-thirty-two-chars'
  process.env.ANNEX_SECRET = secret
  try {
    const valid = proxy(
      new NextRequest(`https://trey.world/classified?key=${secret}`, {
        headers: { 'x-forwarded-for': '198.51.100.10' },
      }),
    )
    const invalid = proxy(
      new NextRequest('https://trey.world/classified?key=wrong', {
        headers: { 'x-forwarded-for': '198.51.100.11' },
      }),
    )
    const validCookie = valid.headers.get('set-cookie') ?? ''
    const invalidCookie = invalid.headers.get('set-cookie') ?? ''
    assert.match(validCookie, /annex_session=/)
    assert.match(invalidCookie, /annex_session=/)
    assert.equal(validCookie.length, invalidCookie.length)
    assert.notEqual(validCookie, invalidCookie)
  } finally {
    if (previous === undefined) delete process.env.ANNEX_SECRET
    else process.env.ANNEX_SECRET = previous
  }
})
