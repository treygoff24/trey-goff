/**
 * Mission-control panels each validate URLs arriving from third-party feeds before they
 * reach a link. Shared here so `orbit` and `shipping` agree on what counts as linkable.
 */

/** True only for a non-blank string parsing as an absolute `http:` or `https:` URL. */
export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() === '') return false
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
