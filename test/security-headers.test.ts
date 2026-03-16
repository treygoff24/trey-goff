import { test } from 'node:test'
import assert from 'node:assert/strict'
// @ts-expect-error -- ts extension import works at runtime with tsx
import { nextConfig } from '../next.config.ts'
import { buildCsp, isInteractiveLibraryPath } from '@/lib/security/csp'

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
    'CSP should be set dynamically in proxy with per-request nonce',
  )
})

test('CSP uses strict nonce policy on interactive/library and static-friendly policy elsewhere', () => {
  const nonce = 'test-nonce-value'

  const defaultCsp = buildCsp({ pathname: '/about', nonce, isDevelopment: false })
  const interactiveCsp = buildCsp({ pathname: '/interactive', nonce, isDevelopment: false })
  const libraryCsp = buildCsp({ pathname: '/library', nonce, isDevelopment: false })

  const defaultScriptSrc = toDirectiveMap(defaultCsp).get('script-src') || ''
  const interactiveScriptSrc = toDirectiveMap(interactiveCsp).get('script-src') || ''
  const libraryScriptSrc = toDirectiveMap(libraryCsp).get('script-src') || ''

  // Default routes remain static-friendly for caching and do not require nonce.
  assert.match(defaultScriptSrc, /'unsafe-inline'/, 'default routes should allow inline scripts')
  assert.doesNotMatch(
    defaultScriptSrc,
    /'unsafe-eval'/,
    'default routes should not allow unsafe-eval',
  )

  // Interactive/library routes stay nonce-based and eval-enabled for Three.js.
  for (const scriptSrc of [interactiveScriptSrc, libraryScriptSrc]) {
    assert.match(
      scriptSrc,
      new RegExp(`'nonce-${nonce}'`),
      'strict routes should include nonce token',
    )
    assert.doesNotMatch(
      scriptSrc,
      /'unsafe-inline'/,
      'strict routes should not allow unsafe-inline',
    )
    assert.match(scriptSrc, /'unsafe-eval'/, 'strict routes should allow unsafe-eval')
  }
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

test('interactive/library route classification includes roots and subpaths only', () => {
  assert.equal(isInteractiveLibraryPath('/interactive'), true)
  assert.equal(isInteractiveLibraryPath('/interactive/world'), true)
  assert.equal(isInteractiveLibraryPath('/library'), true)
  assert.equal(isInteractiveLibraryPath('/library/shelf'), true)

  assert.equal(isInteractiveLibraryPath('/about'), false)
  assert.equal(isInteractiveLibraryPath('/interactive-playground'), false)
  assert.equal(isInteractiveLibraryPath('/library-tools'), false)
})
