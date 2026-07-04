import { test } from 'node:test'
import assert from 'node:assert/strict'
// @ts-expect-error -- ts extension import works at runtime with tsx
import { nextConfig } from '../next.config.ts'
import { buildCsp, isMediaPath, isStrictCspPath } from '@/lib/security/csp'

function toDirectiveMap(csp: string): Map<string, string> {
  return new Map(
    csp
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((directive) => {
        const [name, ...value] = directive.split(/\s+/)
        return name ? ([name, value.join(' ')] as const) : null
      })
      .filter((entry): entry is readonly [string, string] => entry !== null),
  )
}

test('next config includes static security headers and no static CSP', async () => {
  assert.ok(nextConfig.headers, 'headers function should be defined')

  const headers = await nextConfig.headers!()
  const staticHeaders = headers[0]

  assert.equal(headers.length, 1, 'should have a single catch-all route for static headers')
  assert.ok(staticHeaders, 'expected a catch-all static headers entry')
  assert.equal(staticHeaders.source, '/:path*', 'static headers should apply to all routes')

  const headerMap = new Map((staticHeaders.headers ?? []).map((h) => [h.key, h.value] as const))
  assert.equal(headerMap.get('X-Frame-Options'), 'DENY')
  assert.equal(headerMap.get('X-Content-Type-Options'), 'nosniff')
  assert.equal(headerMap.get('Referrer-Policy'), 'strict-origin-when-cross-origin')
  assert.match(headerMap.get('Strict-Transport-Security') || '', /max-age=/)
  assert.equal(
    headerMap.has('Content-Security-Policy'),
    false,
    'CSP should be set dynamically in root proxy with per-request nonce on strict routes',
  )
})

test('CSP uses strict nonce policy on interactive and static-friendly policy elsewhere', () => {
  const nonce = 'test-nonce-value'

  const defaultCsp = buildCsp({ pathname: '/about', nonce, isDevelopment: false })
  const interactiveCsp = buildCsp({ pathname: '/interactive', nonce, isDevelopment: false })
  const libraryCsp = buildCsp({ pathname: '/library', nonce, isDevelopment: false })
  const mediaCsp = buildCsp({ pathname: '/media', nonce, isDevelopment: false })

  const defaultScriptSrc = toDirectiveMap(defaultCsp).get('script-src') || ''
  const interactiveScriptSrc = toDirectiveMap(interactiveCsp).get('script-src') || ''
  const libraryScriptSrc = toDirectiveMap(libraryCsp).get('script-src') || ''
  const defaultImgSrc = toDirectiveMap(defaultCsp).get('img-src') || ''
  const mediaImgSrc = toDirectiveMap(mediaCsp).get('img-src') || ''

  // Default routes remain static-friendly for caching and do not require nonce.
  assert.match(defaultScriptSrc, /'unsafe-inline'/, 'default routes should allow inline scripts')
  assert.doesNotMatch(
    defaultScriptSrc,
    /'unsafe-eval'/,
    'default routes should not allow unsafe-eval',
  )

  assert.match(
    interactiveScriptSrc,
    new RegExp(`'nonce-${nonce}'`),
    'interactive route should include nonce token',
  )
  assert.doesNotMatch(
    interactiveScriptSrc,
    /'unsafe-inline'/,
    'interactive route should not allow unsafe-inline',
  )
  assert.match(interactiveScriptSrc, /'unsafe-eval'/, 'interactive route should allow unsafe-eval')

  assert.match(libraryScriptSrc, /'unsafe-inline'/, 'library should use the static-friendly policy')
  assert.doesNotMatch(libraryScriptSrc, /'unsafe-eval'/, 'library should not allow unsafe-eval')
  assert.doesNotMatch(libraryScriptSrc, /'nonce-/, 'library should not require a nonce')

  assert.equal(
    defaultImgSrc,
    "'self' data: blob:",
    'default routes should keep a local-only image policy',
  )
  assert.match(
    mediaImgSrc,
    /https:\/\/img\.youtube\.com/,
    'media routes should allow YouTube thumbnails',
  )
  assert.match(
    mediaImgSrc,
    /https:\/\/i\.ytimg\.com/,
    'media routes should allow the alternate YouTube thumbnail host',
  )
  assert.match(
    mediaImgSrc,
    /https:\/\/\*\.mzstatic\.com/,
    'media routes should allow Apple podcast artwork hosts',
  )
})

test('CSP relaxes script and connect sources in development for the webpack runtime', () => {
  const nonce = 'test-nonce-value'
  const defaultCsp = buildCsp({ pathname: '/about', nonce, isDevelopment: true })
  const directiveMap = toDirectiveMap(defaultCsp)

  assert.match(
    directiveMap.get('script-src') || '',
    /'unsafe-eval'/,
    'development routes should allow unsafe-eval for the dev runtime',
  )
  assert.equal(
    directiveMap.get('connect-src'),
    "'self' ws: wss:",
    'development routes should allow websocket connections for HMR',
  )
})

test('strict CSP route classification includes interactive roots and subpaths only', () => {
  assert.equal(isStrictCspPath('/interactive'), true)
  assert.equal(isStrictCspPath('/interactive/world'), true)

  assert.equal(isStrictCspPath('/library'), false)
  assert.equal(isStrictCspPath('/library/shelf'), false)
  assert.equal(isStrictCspPath('/about'), false)
  assert.equal(isStrictCspPath('/interactive-playground'), false)
  assert.equal(isStrictCspPath('/library-tools'), false)
})

test('media route classification includes roots and subpaths only', () => {
  assert.equal(isMediaPath('/media'), true)
  assert.equal(isMediaPath('/media/podcast'), true)

  assert.equal(isMediaPath('/about'), false)
  assert.equal(isMediaPath('/media-playground'), false)
  assert.equal(isMediaPath('/medias'), false)
})
