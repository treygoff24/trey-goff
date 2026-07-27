import { OG_SIZE, renderSiteOGCard } from '@/components/og/SiteOGCard'

export const runtime = 'nodejs'
export const alt = 'Trey Goff - Projects'
export const size = OG_SIZE
export const contentType = 'image/png'

export default function OGImage() {
  return renderSiteOGCard('Projects')
}
