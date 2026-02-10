'use client'

import Image from 'next/image'
import { cn, formatDate } from '@/lib/utils'
import { ExternalLink, Mic, Presentation, Video } from 'lucide-react'
import type { Appearance, AppearanceType } from '@/lib/media/types'
import { getAppearanceThumbnail } from '@/lib/media'

interface AppearanceCardProps {
  appearance: Appearance
  variant?: 'featured' | 'list'
}

const typeConfig: Record<
  AppearanceType,
  { label: string; icon: typeof Mic; className: string }
> = {
  podcast: {
    label: 'Podcast',
    icon: Mic,
    className: 'bg-accent/20 text-accent',
  },
  youtube: {
    label: 'YouTube',
    icon: Video,
    className: 'bg-error/20 text-error',
  },
  talk: {
    label: 'Talk',
    icon: Presentation,
    className: 'bg-warm/20 text-warm',
  },
  interview: {
    label: 'Interview',
    icon: Mic,
    className: 'bg-success/20 text-success',
  },
}

export function AppearanceCard({
  appearance,
  variant = 'list',
}: AppearanceCardProps) {
  const thumbnail = getAppearanceThumbnail(appearance)
  const config = typeConfig[appearance.type]
  const Icon = config.icon
  const isFeatured = variant === 'featured'

  return (
    <a
      href={appearance.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group block overflow-hidden rounded-lg border border-border-1 bg-surface-1 card-interactive',
        'hover:border-warm/30 hover:shadow-[0_8px_30px_-8px_rgba(255,184,107,0.15)]',
        isFeatured ? 'flex flex-col md:flex-row' : ''
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden bg-surface-2',
          isFeatured
            ? 'aspect-video md:aspect-auto md:w-80 md:shrink-0'
            : 'aspect-video'
        )}
      >
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt=""
            aria-hidden="true"
            fill
            className="object-cover transition-transform group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Icon className="h-12 w-12 text-text-3" />
          </div>
        )}
        <div
          className={cn(
            'absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
            config.className
          )}
        >
          <Icon className="h-3 w-3" />
          {config.label}
        </div>
      </div>

      <div className={cn('flex flex-1 flex-col p-4', isFeatured && 'md:p-6')}>
        <div className="mb-2 flex items-center gap-2 text-sm text-text-3">
          <span>{appearance.show}</span>
          <span>-</span>
          <span>{formatDate(appearance.date)}</span>
        </div>

        <h3
          className={cn(
            'font-satoshi font-medium text-text-1 group-hover:text-warm',
            isFeatured ? 'mb-3 text-xl' : 'mb-2 text-base'
          )}
        >
          {appearance.title}
        </h3>

        {isFeatured && appearance.summary && (
          <p className="mb-4 line-clamp-3 flex-1 text-sm text-text-2">
            {appearance.summary}
          </p>
        )}

        <div className="mt-auto flex items-center gap-1 text-sm text-text-3 group-hover:text-warm">
          <span>Watch</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </div>
      </div>
    </a>
  )
}
