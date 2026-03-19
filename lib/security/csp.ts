export const NONCE_REQUEST_HEADER = 'x-nonce'

export function isInteractiveLibraryPath(pathname: string): boolean {
  return /^\/(?:interactive|library)(?:\/|$)/.test(pathname)
}

export function isMediaPath(pathname: string): boolean {
  return /^\/media(?:\/|$)/.test(pathname)
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
  const imgSrc = isMediaPath(pathname)
    ? "img-src 'self' data: blob: https://img.youtube.com https://i.ytimg.com https://*.mzstatic.com"
    : "img-src 'self' data: blob:"

  return [
    scriptSrc,
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    imgSrc,
    connectSrc,
  ].join('; ')
}
