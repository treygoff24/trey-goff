/**
 * Small string helpers shared by the placeholder-SVG generators (books, media appearances,
 * and the book-cover resolver script). They all inline the same two functions to build
 * `data:image/svg+xml` covers; kept here so the escaping rules live in exactly one place.
 */

/** Escapes the five XML metacharacters so a title can be dropped into SVG markup. */
export function escapeXml(str: string): string {
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      case '"':
        return '&quot;'
      default:
        return c
    }
  })
}

/** Clips `str` to `max` characters, spending the last one on an ellipsis. */
export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '...' : str
}
