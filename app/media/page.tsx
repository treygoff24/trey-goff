import { MediaClient } from '@/components/media'
import {
  getAllAppearances,
  getAllTypes,
  getFeaturedAppearances,
} from '@/lib/media'

export const metadata = {
  title: 'Media',
  description: 'Podcasts, interviews, and talks.',
}

export default function MediaPage() {
  const appearances = getAllAppearances()
  const featuredAppearances = getFeaturedAppearances()
  const availableTypes = getAllTypes()

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <header className="mb-12">
        <h1 className="mb-4 font-satoshi text-4xl font-medium text-text-1">
          Media
        </h1>
        <p className="max-w-2xl text-lg text-text-2">
          Podcasts, interviews, and talks on governance, technology, and building better systems.
        </p>
      </header>

      <MediaClient
        appearances={appearances}
        featuredAppearances={featuredAppearances}
        availableTypes={availableTypes}
      />
    </div>
  )
}
