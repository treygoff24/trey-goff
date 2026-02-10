import { test } from 'node:test'
import assert from 'node:assert/strict'
// @ts-expect-error -- ts extension import works at runtime with tsx
import { nextConfig } from '../next.config.ts'

test('next config includes security headers', async () => {
  assert.ok(nextConfig.headers, 'headers function should be defined')
  assert.equal(typeof nextConfig.headers, 'function', 'headers should be a function')

  const headers = await nextConfig.headers!()
  assert.ok(Array.isArray(headers), 'headers should return an array')
  assert.equal(headers.length, 2, 'should have two route configs')

  const interactiveRoute = headers.find(
    (r: { source: string }) => r.source === '/(interactive|library)/(.*)'
  )
  const defaultRoute = headers.find(
    (r: { source: string }) => r.source === '/((?!interactive|library).*)'
  )
  assert.ok(interactiveRoute, 'should have interactive/library route config')
  assert.ok(defaultRoute, 'should have default route config')

  for (const routeConfig of [interactiveRoute!, defaultRoute!]) {
    assert.ok(Array.isArray(routeConfig.headers), 'route should have headers array')

    const headerMap = new Map(
      routeConfig.headers!.map((h: { key: string; value: string }) => [h.key, h.value])
    )

    assert.ok(headerMap.has('Content-Security-Policy'), 'should have CSP header')
    const csp = headerMap.get('Content-Security-Policy')!
    assert.match(csp, /style-src 'self' 'unsafe-inline'/, 'CSP should allow inline styles for Tailwind')
    assert.match(csp, /img-src 'self' data: blob:/, 'CSP should allow data and blob images')
    assert.match(csp, /connect-src 'self'/, 'CSP should restrict connect-src')

    assert.equal(headerMap.get('X-Frame-Options'), 'DENY', 'should deny iframe embedding')
    assert.equal(headerMap.get('X-Content-Type-Options'), 'nosniff', 'should prevent MIME sniffing')
    assert.equal(
      headerMap.get('Referrer-Policy'),
      'strict-origin-when-cross-origin',
      'should have strict referrer policy'
    )
    assert.ok(headerMap.has('Strict-Transport-Security'), 'should have HSTS header')
    assert.match(headerMap.get('Strict-Transport-Security')!, /max-age=/, 'HSTS should specify max-age')
  }

  // Interactive routes should have unsafe-eval for Three.js shader compilation
  const interactiveHeaders = new Map(
    interactiveRoute!.headers!.map((h: { key: string; value: string }) => [h.key, h.value])
  )
  const interactiveCsp = interactiveHeaders.get('Content-Security-Policy')!
  assert.match(interactiveCsp, /script-src 'self' 'unsafe-eval'/, 'interactive CSP should allow eval for Three.js')

  // Default routes should NOT have unsafe-eval
  const defaultHeaders = new Map(
    defaultRoute!.headers!.map((h: { key: string; value: string }) => [h.key, h.value])
  )
  const defaultCsp = defaultHeaders.get('Content-Security-Policy')!
  assert.match(defaultCsp, /script-src 'self'/, 'default CSP should have script-src self')
  assert.doesNotMatch(defaultCsp, /unsafe-eval/, 'default CSP should NOT allow eval')
})
