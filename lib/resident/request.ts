import { z } from 'zod'

export const RESIDENT_MAX_BODY_BYTES = 4096
export const RESIDENT_MAX_MESSAGE_LENGTH = 1000

export const residentRequestSchema = z
  .object({
    message: z.string().trim().min(1).max(RESIDENT_MAX_MESSAGE_LENGTH),
    conversationId: z.uuid().optional(),
  })
  .strict()

export type ResidentRequest = z.infer<typeof residentRequestSchema>

export type ResidentRequestResult =
  | { ok: true; value: ResidentRequest }
  | { ok: false; status: 400 | 413; error: string }

export async function parseResidentRequest(request: Request): Promise<ResidentRequestResult> {
  const length = request.headers.get('content-length')
  if (length !== null && Number(length) > RESIDENT_MAX_BODY_BYTES) {
    return { ok: false, status: 413, error: 'Request body too large' }
  }

  const reader = request.body?.getReader()
  if (!reader) return { ok: false, status: 400, error: 'Request body is required' }

  const decoder = new TextDecoder()
  let bytes = 0
  let raw = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    bytes += value.byteLength
    if (bytes > RESIDENT_MAX_BODY_BYTES) {
      await reader.cancel()
      return { ok: false, status: 413, error: 'Request body too large' }
    }
    raw += decoder.decode(value, { stream: true })
  }
  raw += decoder.decode()

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return { ok: false, status: 400, error: 'Invalid JSON' }
  }

  const parsed = residentRequestSchema.safeParse(json)
  return parsed.success
    ? { ok: true, value: parsed.data }
    : { ok: false, status: 400, error: 'Invalid request body' }
}

export function isSameOrigin(origin: string | null, requestUrl: string): boolean {
  return origin === new URL(requestUrl).origin
}
