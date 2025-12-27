'use client'

import { useMemo, useState } from 'react'
import type { Appearance, AppearanceType } from '@/lib/media/types'
import { sortAppearancesByDate } from '@/lib/media'
import { AppearanceCard } from './AppearanceCard'
import { MediaFilter } from './MediaFilter'

interface MediaClientProps {
  appearances: Appearance[]
  featuredAppearances: Appearance[]
  availableTypes: AppearanceType[]
}

export function MediaClient({
  appearances,
  featuredAppearances,
  availableTypes,
}: MediaClientProps) {
  const [typeFilter, setTypeFilter] = useState<AppearanceType | null>(null)

  const filteredAppearances = useMemo(() => {
    const featuredIds = new Set(featuredAppearances.map((appearance) => appearance.id))
    let filtered = appearances.filter((appearance) => !featuredIds.has(appearance.id))

    if (typeFilter) {
      filtered = filtered.filter((appearance) => appearance.type === typeFilter)
    }

    return sortAppearancesByDate(filtered)
  }, [appearances, featuredAppearances, typeFilter])

  return (
    <>
      {featuredAppearances.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-6 font-satoshi text-xl font-medium text-text-1">
            Featured
          </h2>
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {featuredAppearances.map((appearance) => (
              <AppearanceCard
                key={appearance.id}
                appearance={appearance}
                variant="featured"
              />
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <MediaFilter
          activeFilter={typeFilter}
          onFilterChange={setTypeFilter}
          availableTypes={availableTypes}
        />
      </section>

      <section>
        {filteredAppearances.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAppearances.map((appearance) => (
              <AppearanceCard key={appearance.id} appearance={appearance} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-text-3">
            No {typeFilter ? `${typeFilter}s` : 'appearances'} yet.
          </p>
        )}
      </section>
    </>
  )
}
