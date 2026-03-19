/**
 * Serialize structured data for embedding in `<script type="application/ld+json">`.
 * `JSON.stringify` alone is unsafe: `</script>` in a string value can break out of the script block.
 * @see https://owasp.org/www-community/attacks/xss/
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
