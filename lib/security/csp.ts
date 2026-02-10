export const NONCE_REQUEST_HEADER = 'x-nonce'

export function isInteractiveLibraryPath(pathname: string): boolean {
  return /^\/(?:interactive|library)(?:\/|$)/.test(pathname)
}

interface BuildCspInput {
  pathname: string
  nonce: string
}

export function buildCsp({ pathname, nonce }: BuildCspInput): string {
  const scriptSrc = isInteractiveLibraryPath(pathname)
    ? `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`
    : `script-src 'self' 'unsafe-inline'`

  return [
    scriptSrc,
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
  ].join('; ')
}
