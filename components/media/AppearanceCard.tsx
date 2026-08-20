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

function thumbnailShouldUseUnoptimized(src: string): boolean {
  if (src.startsWith('/') || src.startsWith('data:')) return false
  try {
    const host = new URL(src).hostname
    if (host === 'img.youtube.com' || host === 'i.ytimg.com') return false
    if (host.endsWith('.mzstatic.com')) return false
    return true
  } catch {
    return true
  }
}

const typeConfig: Record<AppearanceType, { label: string; icon: typeof Mic }> = {
  podcast: {
    label: 'Podcast',
    icon: Mic,
  },
  youtube: {
    label: 'YouTube',
    icon: Video,
  },
  talk: {
    label: 'Talk',
    icon: Presentation,
  },
  interview: {
    label: 'Interview',
    icon: Mic,
  },
}

export function AppearanceCard({ appearance, variant = 'list' }: AppearanceCardProps) {
  const thumbnail = getAppearanceThumbnail(appearance)
  const config = typeConfig[appearance.type]
  const Icon = config.icon
  const isFeatured = variant === 'featured'
  const actionLabel =
    appearance.type === 'podcast'
      ? 'Listen'
      : appearance.type === 'interview'
        ? 'Read / Listen'
        : 'Watch'

  return (
    <a
      href={appearance.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-lg border border-border-1 bg-surface-1 card-interactive transition-colors hover:border-warm/30',
        isFeatured ? 'md:flex-row' : '',
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden bg-bg-1 border-b border-border-1',
          isFeatured
            ? 'aspect-video md:aspect-auto md:w-80 md:shrink-0 md:border-b-0 md:border-r'
            : 'aspect-video',
        )}
      >
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt=""
            aria-hidden="true"
            fill
            sizes={
              isFeatured
                ? '(max-width: 768px) 100vw, 320px'
                : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
            }
            className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
            loading={isFeatured ? 'eager' : 'lazy'}
            priority={isFeatured}
            unoptimized={thumbnailShouldUseUnoptimized(thumbnail)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Icon className="h-12 w-12 text-text-3" />
          </div>
        )}
      </div>

      <div className={cn('flex flex-1 flex-col p-5', isFeatured && 'md:p-6')}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border-1 bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-text-1">
            <Icon className="h-3 w-3 text-warm" aria-hidden="true" />
            {config.label}
          </span>
          <time dateTime={appearance.date} className="font-mono text-xs text-text-3">
            {formatDate(appearance.date)}
          </time>
        </div>

        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-warm">
          {appearance.show}
        </p>

        <h3
          className={cn(
            'font-satoshi font-medium text-text-1 transition-colors group-hover:text-warm',
            isFeatured ? 'mb-3 text-lg md:text-xl' : 'mb-2 text-base',
          )}
        >
          {appearance.title}
        </h3>

        {appearance.summary && (
          <p className="mb-4 text-sm text-text-2 line-clamp-3">{appearance.summary}</p>
        )}

        <div className="mt-auto flex items-center gap-1.5 pt-2 text-xs font-medium text-text-3 transition-colors group-hover:text-warm">
          <span>{actionLabel}</span>
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
      </div>
    </a>
  )
}
