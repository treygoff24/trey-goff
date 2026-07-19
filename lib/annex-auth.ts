import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

/** HttpOnly cookie set after a one-time `?key=` bootstrap on `/classified`. */
export const ANNEX_SESSION_COOKIE = 'annex_session'

const SESSION_TOKEN_PEPPER = 'trey-goff:annex-session:v1'
export const ANNEX_SECRET_MIN_LENGTH = 32

/**
 * Returns an unset secret as gag-only mode, but rejects weak configured secrets.
 * Generate this value cryptographically; length is a minimum, not an entropy substitute.
 */
export function getConfiguredAnnexSecret(
  annexSecret = process.env.ANNEX_SECRET,
): string | undefined {
  if (!annexSecret) return undefined
  if (annexSecret.length < ANNEX_SECRET_MIN_LENGTH) {
    throw new Error(
      `ANNEX_SECRET must be at least ${ANNEX_SECRET_MIN_LENGTH} characters of cryptographically random data`,
    )
  }
  return annexSecret
}

export function annexSessionToken(annexSecret: string): string {
  return createHmac('sha256', annexSecret).update(SESSION_TOKEN_PEPPER, 'utf8').digest('base64url')
}

export function isValidAnnexSessionCookie(
  cookieValue: string | undefined,
  annexSecret: string | undefined,
): boolean {
  if (!cookieValue || !annexSecret || annexSecret.length < ANNEX_SECRET_MIN_LENGTH) return false
  const expected = annexSessionToken(annexSecret)
  const providedBuffer = Buffer.from(cookieValue, 'utf8')
  const expectedBuffer = Buffer.from(expected, 'utf8')
  if (providedBuffer.length !== expectedBuffer.length) return false
  return timingSafeEqual(providedBuffer, expectedBuffer)
}

export function canAccessAnnex(
  sessionCookie: string | undefined,
  annexSecret: string | undefined,
): boolean {
  return isValidAnnexSessionCookie(sessionCookie, annexSecret)
}

/** Timing-safe comparison of the raw annex key used during bootstrap. */
export function areAnnexSecretsEqual(provided: string, expected: string): boolean {
  const providedHash = createHash('sha256').update(provided, 'utf8').digest()
  const expectedHash = createHash('sha256').update(expected, 'utf8').digest()
  return timingSafeEqual(providedHash, expectedHash)
}
