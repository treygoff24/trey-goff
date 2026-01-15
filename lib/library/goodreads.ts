/**
 * Goodreads URL validation for the Floating Library.
 * Validates that URLs point to legitimate Goodreads domains.
 */

/**
 * Regex pattern for valid Goodreads hostnames.
 * Matches:
 * - goodreads.com
 * - www.goodreads.com
 *
 * Does NOT match:
 * - goodreads-books.com (lookalike)
 * - notgoodreads.com
 */
const GOODREADS_HOSTNAME_PATTERN = /^(www\.)?goodreads\.com$/

/**
 * Check if a URL is a valid Goodreads link.
 *
 * @param url - The URL to validate
 * @returns true if the URL points to a legitimate Goodreads domain
 *
 * @example
 * isValidGoodreadsUrl('https://goodreads.com/book/show/12345') // true
 * isValidGoodreadsUrl('https://www.goodreads.com/book/show/12345') // true
 * isValidGoodreadsUrl('https://goodreads-books.com/book') // false
 * isValidGoodreadsUrl('javascript:alert(1)') // false
 */
export function isValidGoodreadsUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  try {
    const parsed = new URL(url)

    // Must be https (or http for legacy links)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false
    }

    // Hostname must match Goodreads pattern
    const hostname = parsed.hostname.toLowerCase()
    return GOODREADS_HOSTNAME_PATTERN.test(hostname)
  } catch {
    // Invalid URL
    return false
  }
}
