import { editionRequestSchema } from '@/lib/edition/schema'

export const EDITION_MAX_BODY_BYTES = 2048

export type ParseEditionRequestResult =
  | { ok: true; intent: string }
  | { ok: false; status: 400 | 413; error: string }

export function parseEditionRequestBody(rawBody: string): ParseEditionRequestResult {
  if (new TextEncoder().encode(rawBody).byteLength > EDITION_MAX_BODY_BYTES) {
    return { ok: false, status: 413, error: 'Request body too large' }
  }

  let value: unknown
  try {
    value = JSON.parse(rawBody) as unknown
  } catch {
    return { ok: false, status: 400, error: 'Invalid JSON' }
  }

  const parsed = editionRequestSchema.safeParse(value)
  if (!parsed.success) {
    const tooLong = parsed.error.issues.some(
      (issue) => issue.path[0] === 'intent' && issue.code === 'too_big',
    )
    return {
      ok: false,
      status: 400,
      error: tooLong
        ? 'Tell us what brought you here in 500 characters or fewer.'
        : 'Tell us what brought you here.',
    }
  }

  return { ok: true, intent: parsed.data.intent }
}
