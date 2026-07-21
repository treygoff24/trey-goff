export const NONCE_REQUEST_HEADER = 'x-nonce'

export function isStrictCspPath(pathname: string): boolean {
  return /^\/interactive(?:\/|$)/.test(pathname)
}

export function isMediaPath(pathname: string): boolean {
  return /^\/media(?:\/|$)/.test(pathname)
}

interface BuildCspInput {
  isDevelopment?: boolean
  pathname: string
  nonce: string
}

// Vercel Speed Insights: the client script loads from va.vercel-scripts.com and
// beacons web vitals to vitals.vercel-insights.com; both must be allowlisted or
// the integration is blocked by our own policy.
const SPEED_INSIGHTS_SCRIPT_HOST = 'https://va.vercel-scripts.com'
const SPEED_INSIGHTS_BEACON_HOST = 'https://vitals.vercel-insights.com'

export function buildCsp({ pathname, nonce, isDevelopment = false }: BuildCspInput): string {
  const allowEval = isDevelopment || isStrictCspPath(pathname)
  const scriptSrc = isStrictCspPath(pathname)
    ? `script-src 'self' 'nonce-${nonce}'${allowEval ? " 'unsafe-eval'" : ''} ${SPEED_INSIGHTS_SCRIPT_HOST}`
    : `script-src 'self' 'unsafe-inline'${allowEval ? " 'unsafe-eval'" : ''} ${SPEED_INSIGHTS_SCRIPT_HOST}`
  const connectSrc = isDevelopment
    ? `connect-src 'self' ws: wss: ${SPEED_INSIGHTS_BEACON_HOST}`
    : `connect-src 'self' ${SPEED_INSIGHTS_BEACON_HOST}`
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
