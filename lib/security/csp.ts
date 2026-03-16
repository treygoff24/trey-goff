export const NONCE_REQUEST_HEADER = 'x-nonce'

export function isInteractiveLibraryPath(pathname: string): boolean {
  return /^\/(?:interactive|library)(?:\/|$)/.test(pathname)
}

interface BuildCspInput {
  isDevelopment?: boolean
  pathname: string
  nonce: string
}

export function buildCsp({ pathname, nonce, isDevelopment = false }: BuildCspInput): string {
  const allowEval = isDevelopment || isInteractiveLibraryPath(pathname)
  const scriptSrc = isInteractiveLibraryPath(pathname)
    ? `script-src 'self' 'nonce-${nonce}'${allowEval ? " 'unsafe-eval'" : ''}`
    : `script-src 'self' 'unsafe-inline'${allowEval ? " 'unsafe-eval'" : ''}`
  const connectSrc = isDevelopment ? "connect-src 'self' ws: wss:" : "connect-src 'self'"

  return [
    scriptSrc,
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    connectSrc,
  ].join('; ')
}
