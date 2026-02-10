import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { buildCsp, isInteractiveLibraryPath, NONCE_REQUEST_HEADER } from '@/lib/security/csp'

function createNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const strictRoute = isInteractiveLibraryPath(pathname)
  const nonce = strictRoute ? createNonce() : ''
  const requestHeaders = new Headers(request.headers)
  const csp = buildCsp({
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
