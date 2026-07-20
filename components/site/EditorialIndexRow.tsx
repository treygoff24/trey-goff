import Link from 'next/link'
import { cn } from '@/lib/utils'

interface EditorialIndexRowProps {
  href?: string
  number?: string
  meta?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  detail?: React.ReactNode
  tags?: string[]
  className?: string
}

export function EditorialIndexRow({
  href,
  number,
  meta,
  title,
  description,
  detail,
  tags = [],
  className,
}: EditorialIndexRowProps) {
  const content = (
    <>
      <div className="font-mono text-xs uppercase tracking-[0.16em] text-warm sm:pt-1">
        {number ?? meta}
      </div>
      <div className="min-w-0">
        {number && meta && (
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-3">
            {meta}
          </div>
        )}
        <h2 className="font-newsreader text-2xl font-medium leading-tight text-text-1 transition-colors group-hover:text-warm">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-2">{description}</p>
        )}
        {tags.length > 0 && (
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-text-3">
            {tags.slice(0, 4).join(' · ')}
          </p>
        )}
      </div>
      <div className="justify-self-end font-mono text-xs uppercase tracking-[0.14em] text-warm">
        {detail ?? '→'}
      </div>
    </>
  )

  if (!href) {
    return <div className={cn('tg-rule-row', className)}>{content}</div>
  }

  return (
    <Link
      href={href}
      className={cn('tg-rule-row group transition-colors hover:bg-surface-1/50', className)}
    >
      {content}
    </Link>
  )
}
