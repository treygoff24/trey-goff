/**
 * Amazon URL validation for the Floating Library.
 * Validates that URLs point to legitimate Amazon domains.
 */

/**
 * Regex pattern for valid Amazon hostnames.
 * Matches:
 * - amazon.com
 * - www.amazon.com
 * - smile.amazon.com
 * - amazon.co.uk, amazon.de, amazon.co.jp, etc.
 * - *.amazon.com (any subdomain)
 *
 * Does NOT match:
 * - amazon-deals.com (lookalike)
 * - notamazon.com
 */
const AMAZON_HOSTNAME_PATTERN = /^([\w-]+\.)?amazon(\.[a-z]{2,3}){1,2}$/

/**
 * Check if a URL is a valid Amazon product link.
 *
 * @param url - The URL to validate
 * @returns true if the URL points to a legitimate Amazon domain
 *
 * @example
 * isValidAmazonUrl('https://amazon.com/dp/B001234567') // true
 * isValidAmazonUrl('https://www.amazon.co.uk/gp/product/B001234567') // true
 * isValidAmazonUrl('https://smile.amazon.com/dp/B001234567') // true
 * isValidAmazonUrl('https://amazon-deals.com/product') // false
 * isValidAmazonUrl('javascript:alert(1)') // false
 */
export function isValidAmazonUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  try {
    const parsed = new URL(url)

    // Must be https (or http for legacy links)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false
    }

    // Hostname must match Amazon pattern
    const hostname = parsed.hostname.toLowerCase()
    return AMAZON_HOSTNAME_PATTERN.test(hostname)
  } catch {
    // Invalid URL
    return false
  }
}

/**
 * Format an Amazon URL for display (shorten for UI).
 *
 * @param url - The Amazon URL
 * @returns A shortened display string, or null if invalid
 */
export function formatAmazonUrl(url: string | undefined | null): string | null {
  if (!isValidAmazonUrl(url)) {
    return null
  }

  try {
    const parsed = new URL(url!)
    // Extract ASIN if present (10-char alphanumeric after /dp/ or /gp/product/)
    const asinMatch = url!.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)
    if (asinMatch) {
      return `amazon.com/dp/${asinMatch[1]}`
    }
    return parsed.hostname
  } catch {
    return null
  }
}
