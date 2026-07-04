import { MediaClient } from '@/components/media'
import { getAllAppearances, getAllTypes, getFeaturedAppearances } from '@/lib/media'

export const metadata = {
  title: 'Media',
  description: 'Podcasts, interviews, and talks.',
}

export default function MediaPage() {
  const appearances = getAllAppearances()
  const featuredAppearances = getFeaturedAppearances()
  const availableTypes = getAllTypes()

  return (
    <div className="tg-page max-w-6xl">
      <header className="tg-rise mb-12">
        <p className="tg-eyebrow text-warm">Media</p>
        <h1 className="mt-6 mb-4 font-newsreader text-[clamp(2.4rem,4.5vw,3.2rem)] font-medium leading-[1.06] tracking-[-0.02em] text-text-1">
          Conversations on the record.
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
