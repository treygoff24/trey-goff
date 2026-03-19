import { createHash, timingSafeEqual } from 'crypto'

/** HttpOnly cookie set after a one-time `?secret=` bootstrap on `/preview/*` (see `proxy.ts`). */
export const PREVIEW_SESSION_COOKIE = 'draft_preview_session'

const SESSION_TOKEN_PEPPER = 'trey-goff:draft-preview-session:v1'

export function previewSessionToken(previewSecret: string): string {
  return createHash('sha256')
    .update(`${SESSION_TOKEN_PEPPER}\0${previewSecret}`, 'utf8')
    .digest('base64url')
}

export function isValidPreviewSessionCookie(
  cookieValue: string | undefined,
  previewSecret: string | undefined,
): boolean {
  if (!cookieValue || !previewSecret) return false
  const expected = previewSessionToken(previewSecret)
  const a = Buffer.from(cookieValue, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export interface CanAccessDraftPreviewInput {
  nodeEnv: string | undefined
  /** Production requires `ALLOW_DRAFT_PREVIEW=true` in addition to a valid session cookie. */
  allowDraftPreview: boolean
  previewSecret: string | undefined
  sessionCookie: string | undefined
}

/**
 * Draft previews in production require an explicit feature flag plus a session cookie
 * (issued by `proxy.ts` after a valid `?secret=` on `/preview/*`).
 * Non-production environments stay open for local authoring.
 */
export function canAccessDraftPreview(input: CanAccessDraftPreviewInput): boolean {
  const { nodeEnv, allowDraftPreview, previewSecret, sessionCookie } = input

  if (nodeEnv !== 'production') {
    return true
  }

  if (!allowDraftPreview || !previewSecret) {
    return false
  }

  return isValidPreviewSessionCookie(sessionCookie, previewSecret)
}

/** Timing-safe comparison of the raw preview secret (query param bootstrap). */
export function arePreviewSecretsEqual(provided: string, expected: string): boolean {
  const providedHash = createHash('sha256').update(provided, 'utf8').digest()
  const expectedHash = createHash('sha256').update(expected, 'utf8').digest()
  return timingSafeEqual(providedHash, expectedHash)
}
