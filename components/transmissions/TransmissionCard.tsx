'use client'

import { cn, formatDate } from '@/lib/utils'
import { ExternalLink, Radio } from 'lucide-react'
import { TagPill } from '@/components/ui/TagPill'
import type { Transmission } from '@/lib/transmissions/types'

interface TransmissionCardProps {
  transmission: Transmission
  variant?: 'featured' | 'list'
}

export function TransmissionCard({
  transmission,
  variant = 'list',
}: TransmissionCardProps) {
  const isFeatured = variant === 'featured'

  return (
    <a
      href={transmission.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group relative block overflow-hidden rounded-lg',
        'border border-dashed border-border-2 bg-surface-1/50',
        'transition-all duration-300 motion-reduce:transition-none',
        'hover:border-warm/40 hover:bg-surface-1',
        'hover:shadow-[0_0_40px_-10px_rgba(255,184,107,0.25)]',
        isFeatured && 'md:flex md:items-stretch'
      )}
    >
      {/* Signal wave effect - left edge */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-warm/0 via-warm/30 to-warm/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 motion-reduce:transition-none" />

      {/* Animated signal rings on hover */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <div className="relative">
          <div className="signal-ring signal-ring-1" />
          <div className="signal-ring signal-ring-2" />
          <div className="signal-ring signal-ring-3" />
          <Radio className="relative z-10 h-4 w-4 text-text-3 group-hover:text-warm transition-colors duration-300 motion-reduce:transition-none" aria-hidden="true" />
        </div>
      </div>

      {/* Content */}
      <div className={cn('flex flex-1 flex-col p-5 pl-14', isFeatured && 'md:p-6 md:pl-16')}>
        {/* Channel / Publication header */}
        <div className="mb-3 flex items-center gap-3 text-xs">
          <span className="font-mono uppercase tracking-wider text-warm/80">
            {transmission.channel || transmission.publication.slice(0, 3).toUpperCase()}
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-border-1 to-transparent" />
          <span className="text-text-3">{formatDate(transmission.date)}</span>
        </div>

        {/* Title */}
        <h3
          className={cn(
            'font-satoshi font-medium text-text-1 group-hover:text-warm transition-colors duration-200 motion-reduce:transition-none',
            isFeatured ? 'text-xl mb-2' : 'text-lg mb-1.5'
          )}
        >
          {transmission.title}
        </h3>

        {/* Publication name */}
        <p className="text-sm text-text-2 mb-3">
          Published in <span className="text-text-1">{transmission.publication}</span>
        </p>

        {/* Summary - shown for featured or always if short */}
        {(isFeatured || transmission.summary.length < 150) && (
          <p className={cn(
            'text-sm text-text-3 mb-4 line-clamp-2',
            isFeatured && 'line-clamp-3'
          )}>
            {transmission.summary}
          </p>
        )}

        {/* Tags */}
        {transmission.tags.length > 0 && (
          <div className="mt-auto mb-4 flex flex-wrap gap-1.5">
            {transmission.tags.slice(0, 4).map((tag) => (
              <TagPill key={tag} tag={tag} size="sm" />
            ))}
          </div>
        )}

        {/* External link indicator */}
        <div className="flex items-center gap-2 text-sm text-text-3 group-hover:text-warm transition-colors duration-200 motion-reduce:transition-none">
          <span>Read on {transmission.publication}</span>
          <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none" aria-hidden="true" />
        </div>
      </div>

      {/* Transmission status indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warm/40 opacity-75 group-hover:opacity-100" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-warm/60 group-hover:bg-warm" />
        </span>
        <span className="text-xs font-mono uppercase tracking-wider text-text-3 opacity-0 group-hover:opacity-100 transition-opacity">
          Live
        </span>
      </div>
    </a>
  )
}
