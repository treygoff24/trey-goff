import Link from 'next/link'
import { cn } from '@/lib/utils'

interface TagPillProps {
  tag: string
  href?: string
  size?: 'sm' | 'md'
  className?: string
}

export function TagPill({ tag, href, size = 'sm', className }: TagPillProps) {
  const baseClasses = cn(
    'inline-flex items-center rounded-full border border-border-1 font-satoshi text-text-3 transition-colors hover:border-border-2 hover:text-text-2',
    size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
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
