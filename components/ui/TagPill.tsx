import Link from 'next/link'
import { cn } from '@/lib/utils'

interface TagPillProps {
  tag: string
  href?: string
  active?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function TagPill({
  tag,
  href,
  active = false,
  size = 'sm',
  className,
}: TagPillProps) {
  const baseClasses = cn(
    'inline-flex items-center rounded-full border font-satoshi tag-interactive',
    size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
    active
      ? 'border-warm bg-warm/10 text-warm'
      : 'border-border-1 text-text-3 hover:border-warm/30 hover:text-text-2 hover:bg-warm/5',
    className
  )

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {tag}
      </Link>
    )
  }

  return <span className={baseClasses}>{tag}</span>
}
