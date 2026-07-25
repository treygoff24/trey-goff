/**
 * The protocol check at the point of rendering rather than only at the point of loading.
 *
 * `sourceSchema` already rejects anything that is not `http(s)` when a piece's data is read at
 * build time, but that is one gate a long way from the `href` it protects. A source that
 * reaches a component by any other route — a fixture, a future API, a test — should not be
 * able to put `javascript:` in the document because the load-time gate was not the one it came
 * through. Returns `null` for anything that is not a fetchable web URL, and the callers render
 * the title as plain text rather than as a link that does something else.
 */
export function safeHref(url: string): string | null {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null
  } catch {
    return null
  }
}
