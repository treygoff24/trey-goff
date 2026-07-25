import type { Metadata } from 'next'
import { DormantEdition } from '@/components/edition/DormantEdition'
import { EditionExperience } from '@/components/edition/EditionExperience'
import { editionCatalog } from '@/lib/edition/manifest'
import { instrumentedSlugs } from '@/lib/instruments/manifest'
import { isEditionEnabled } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'The Edition',
  description: 'A front page composed from the real writing, work, and books on this site.',
  robots: { index: false, follow: false },
}

export default function EditionPage() {
  // Joined here and nowhere else: the server catalog that feeds the cached system prompt is
  // left exactly as it is, and only the client mapping learns which essays are instrumented.
  const instrumented = instrumentedSlugs()
  const catalog = editionCatalog.map(
    ({ type, slug, title, summary, tags, href, meta, coverUrl, accent }) => ({
      type,
      slug,
      title,
      summary,
      tags,
      href,
      meta,
      ...(coverUrl && { coverUrl }),
      ...(accent && { accent }),
      ...(type === 'essays' && instrumented.has(slug) && { instrumented: true }),
    }),
  )

  return isEditionEnabled ? <EditionExperience catalog={catalog} /> : <DormantEdition />
}
