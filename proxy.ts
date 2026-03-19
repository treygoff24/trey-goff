import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
  arePreviewSecretsEqual,
  PREVIEW_SESSION_COOKIE,
  previewSessionToken,
} from '@/lib/preview-auth'
import { buildCsp, isInteractiveLibraryPath, NONCE_REQUEST_HEADER } from '@/lib/security/csp'

function createNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
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

  const pathname = request.nextUrl.pathname
  const strictRoute = isInteractiveLibraryPath(pathname)
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

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|assets/|manifests/|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpe?g|gif|webp|avif|svg|ico|css|js|map|txt|xml|pdf|woff2?|ttf|otf)$).*)',
  ],
}
