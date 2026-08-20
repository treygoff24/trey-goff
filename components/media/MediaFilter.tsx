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

export function MediaFilter({ activeFilter, onFilterChange, availableTypes }: MediaFilterProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Media type filter">
      <button
        type="button"
        onClick={() => onFilterChange(null)}
        aria-pressed={activeFilter === null}
        className={cn(
          'inline-flex min-h-[44px] items-center rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm/40',
          activeFilter === null
            ? 'bg-warm text-bg-0 font-semibold shadow-sm'
            : 'border border-border-1 bg-surface-1 text-text-2 hover:border-warm/30 hover:bg-surface-2 hover:text-text-1',
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
            'inline-flex min-h-[44px] items-center rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm/40',
            activeFilter === type
              ? 'bg-warm text-bg-0 font-semibold shadow-sm'
              : 'border border-border-1 bg-surface-1 text-text-2 hover:border-warm/30 hover:bg-surface-2 hover:text-text-1',
          )}
        >
          {typeLabels[type]}
        </button>
      ))}
    </div>
  )
}
