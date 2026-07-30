const DEFAULT_SITE_URL = 'https://www.treygoff.com'

function parseBooleanFlag(value: string | undefined): boolean {
  return value === 'true'
}

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL

export const rssAlternates = [
  { url: '/feed.xml', title: 'Trey Goff RSS Feed' },
  { url: '/writing/feed.xml', title: 'Writing RSS Feed' },
  { url: '/notes/feed.xml', title: 'Notes RSS Feed' },
]

/**
 * Next merges metadata shallowly: a page-level `alternates` replaces the root
 * layout's whole object, so any page adding a markdown alternate must restate
 * the canonical and feed links or silently lose them.
 */
export function pageAlternates(path: string, options?: { markdownPath?: string }) {
  return {
    canonical: `${siteUrl}${path}`,
    types: {
      'application/rss+xml': rssAlternates,
      ...(options?.markdownPath ? { 'text/markdown': `${siteUrl}${options.markdownPath}` } : {}),
    },
  }
}

export const isNewsletterEnabled = parseBooleanFlag(process.env.NEXT_PUBLIC_ENABLE_NEWSLETTER)
export const isInteractiveWorldEnabled = parseBooleanFlag(
  process.env.NEXT_PUBLIC_ENABLE_INTERACTIVE_WORLD,
)
export const isEditionEnabled = parseBooleanFlag(process.env.NEXT_PUBLIC_ENABLE_EDITION)
