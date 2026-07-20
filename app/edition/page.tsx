import type { Metadata } from 'next'
import { DormantEdition } from '@/components/edition/DormantEdition'
import { EditionExperience } from '@/components/edition/EditionExperience'
import { editionCatalog } from '@/lib/edition/manifest'
import { isEditionEnabled } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'The Edition',
  description: 'A front page composed from the real writing, work, and books on this site.',
  robots: { index: false, follow: false },
}

export default function EditionPage() {
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
    }),
  )

  return isEditionEnabled ? <EditionExperience catalog={catalog} /> : <DormantEdition />
}
