const DEFAULT_SITE_URL = 'https://trey.world'

function parseBooleanFlag(value: string | undefined): boolean {
  return value === 'true'
}

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL

export const isNewsletterEnabled = parseBooleanFlag(process.env.NEXT_PUBLIC_ENABLE_NEWSLETTER)
export const isInteractiveWorldEnabled = parseBooleanFlag(
  process.env.NEXT_PUBLIC_ENABLE_INTERACTIVE_WORLD,
)
