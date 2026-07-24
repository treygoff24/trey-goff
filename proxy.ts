import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
  ANNEX_SESSION_COOKIE,
  annexSessionToken,
  areAnnexSecretsEqual,
  getConfiguredAnnexSecret,
} from '@/lib/annex-auth'
import {
  arePreviewSecretsEqual,
  PREVIEW_SESSION_COOKIE,
  previewSessionToken,
} from '@/lib/preview-auth'
import { buildCsp, isStrictCspPath, NONCE_REQUEST_HEADER } from '@/lib/security/csp'
import { createRateLimiter } from '@/lib/rate-limit'
import { getTrustedClientIp } from '@/lib/subscribe-request'

const annexBootstrapLimiter = createRateLimiter({ maxRequests: 10, windowMs: 15 * 60 * 1000 })

function createNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
}

function tryAnnexSecretBootstrap(request: NextRequest): NextResponse | null {
  if (request.nextUrl.pathname !== '/classified' || !request.nextUrl.searchParams.has('key')) {
    return null
  }

  const cleanUrl = request.nextUrl.clone()
  cleanUrl.searchParams.delete('key')
  // v1 accepts a key in the request line for a no-JS friend-link flow. It can appear in
  // operator server/CDN logs; v2 will use a fragment + POST exchange instead.
  const annexSecret = getConfiguredAnnexSecret() ?? ''
  const key = request.nextUrl.searchParams.get('key') ?? ''
  const response = NextResponse.redirect(cleanUrl)
  const allowed = annexBootstrapLimiter.check(getTrustedClientIp(request)).allowed
  const valid = allowed && Boolean(annexSecret) && areAnnexSecretsEqual(key, annexSecret)
  response.cookies.set(
    ANNEX_SESSION_COOKIE,
    annexSessionToken(valid ? annexSecret : `${annexSecret}\0invalid`),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 90,
    },
  )
  return response
}

function applyAnnexPrivacyHeaders(pathname: string, response: NextResponse): NextResponse {
  if (/^\/classified(?:\/|$)/.test(pathname)) {
    response.headers.set('Cache-Control', 'no-store, private')
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet')
    response.headers.append('Vary', 'Cookie')
  }
  return response
}

function tryPreviewSecretBootstrap(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname
  if (!pathname.startsWith('/preview/') || !request.nextUrl.searchParams.has('secret')) {
    return null
  }

  const secret = request.nextUrl.searchParams.get('secret') ?? ''
  const previewSecret = process.env.DRAFT_PREVIEW_SECRET ?? ''
  const nodeEnv = process.env.NODE_ENV
  const allowDraftPreview = process.env.ALLOW_DRAFT_PREVIEW === 'true'

  const cleanUrl = request.nextUrl.clone()
  cleanUrl.searchParams.delete('secret')

  if (nodeEnv === 'production') {
    if (!allowDraftPreview || !previewSecret) {
      return NextResponse.redirect(cleanUrl)
    }
    if (!arePreviewSecretsEqual(secret, previewSecret)) {
      return NextResponse.redirect(cleanUrl)
    }
    const token = previewSessionToken(previewSecret)
    const res = NextResponse.redirect(cleanUrl)
    res.cookies.set(PREVIEW_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    })
    return res
  }

  if (previewSecret && !arePreviewSecretsEqual(secret, previewSecret)) {
    return NextResponse.redirect(cleanUrl)
  }

  if (previewSecret) {
    const token = previewSessionToken(previewSecret)
    const res = NextResponse.redirect(cleanUrl)
    res.cookies.set(PREVIEW_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    })
    return res
  }

  return NextResponse.redirect(cleanUrl)
}

export function proxy(request: NextRequest) {
  const bootstrap = tryPreviewSecretBootstrap(request)
  if (bootstrap) {
    return bootstrap
  }

  const annexBootstrap = tryAnnexSecretBootstrap(request)
  if (annexBootstrap) {
    return applyAnnexPrivacyHeaders(request.nextUrl.pathname, annexBootstrap)
  }

  const pathname = request.nextUrl.pathname
  const strictRoute = isStrictCspPath(pathname)
  const nonce = strictRoute ? createNonce() : ''
  const requestHeaders = new Headers(request.headers)
  const csp = buildCsp({
    isDevelopment: process.env.NODE_ENV === 'development',
    pathname,
    nonce,
  })

  if (strictRoute) {
    requestHeaders.set(NONCE_REQUEST_HEADER, nonce)
    requestHeaders.set('Content-Security-Policy', csp)
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  response.headers.set('Content-Security-Policy', csp)
  if (strictRoute) {
    response.headers.set(NONCE_REQUEST_HEADER, nonce)
  }

  return applyAnnexPrivacyHeaders(pathname, response)
}

export const config = {
  matcher: [
    '/classified/:path*',
    '/((?!api|_next/static|_next/image|assets/|manifests/|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpe?g|gif|webp|avif|svg|ico|css|js|map|txt|xml|pdf|woff2?|ttf|otf)$).*)',
  ],
}
