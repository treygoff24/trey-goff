'use client'

import { cn } from '@/lib/utils'
import type { AppearanceType } from '@/lib/media/types'

interface MediaFilterProps {
  activeFilter: AppearanceType | null
  onFilterChange: (filter: AppearanceType | null) => void
  availableTypes: AppearanceType[]
}

const typeLabels: Record<AppearanceType, string> = {
  podcast: 'Podcasts',
  youtube: 'YouTube',
  talk: 'Talks',
  interview: 'Interviews',
}

export function MediaFilter({
  activeFilter,
  onFilterChange,
  availableTypes,
}: MediaFilterProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Media type filter">
      <button
        type="button"
        onClick={() => onFilterChange(null)}
        aria-pressed={activeFilter === null}
        className={cn(
          'rounded-full px-3 py-1 text-sm transition-colors',
          activeFilter === null
            ? 'bg-warm text-bg-0'
            : 'bg-surface-1 text-text-2 hover:bg-surface-2'
        )}
      >
        All
      </button>
      {availableTypes.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onFilterChange(type)}
          aria-pressed={activeFilter === type}
          className={cn(
            'rounded-full px-3 py-1 text-sm transition-colors',
            activeFilter === type
              ? 'bg-warm text-bg-0'
              : 'bg-surface-1 text-text-2 hover:bg-surface-2'
          )}
        >
          {typeLabels[type]}
        </button>
      ))}
    </div>
  )
}
