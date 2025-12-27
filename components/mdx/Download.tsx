import { cn } from '@/lib/utils'
import { Download as DownloadIcon } from 'lucide-react'

interface DownloadProps {
  file: string
  label?: string
  size?: string
}

export function Download({ file, label, size }: DownloadProps) {
  const href = `/downloads/${file}`
  const displayLabel = label || file

  return (
    <a
      href={href}
      download
      className={cn(
        'my-6 flex items-center gap-3 rounded-lg border border-border-1 bg-surface-1 p-4',
        'transition-colors hover:border-warm hover:bg-surface-2',
        'group'
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warm/10 text-warm">
        <DownloadIcon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-satoshi font-medium text-text-1 group-hover:text-warm">
          {displayLabel}
        </p>
        {size && <p className="text-sm text-text-3">{size}</p>}
      </div>
      <span className="text-sm text-text-3 group-hover:text-warm">
        Download -&gt;
      </span>
    </a>
  )
}
