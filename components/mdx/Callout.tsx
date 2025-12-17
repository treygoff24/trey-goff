import { cn } from '@/lib/utils'

interface CalloutProps {
  type?: 'idea' | 'warning' | 'info' | 'tip'
  title?: string
  children: React.ReactNode
}

const typeStyles = {
  idea: {
    border: 'border-warm',
    bg: 'bg-warm/10',
    icon: '💡',
  },
  warning: {
    border: 'border-warning',
    bg: 'bg-warning/10',
    icon: '⚠️',
  },
  info: {
    border: 'border-accent',
    bg: 'bg-accent/10',
    icon: 'ℹ️',
  },
  tip: {
    border: 'border-success',
    bg: 'bg-success/10',
    icon: '✨',
  },
}

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const styles = typeStyles[type]

  return (
    <aside
      className={cn(
        'my-6 rounded-lg border-l-4 p-4',
        styles.border,
        styles.bg
      )}
      role="note"
    >
      {title && (
        <div className="mb-2 flex items-center gap-2 font-satoshi font-medium text-text-1">
          <span>{styles.icon}</span>
          <span>{title}</span>
        </div>
      )}
      <div className="text-text-2 [&>p:last-child]:mb-0">{children}</div>
    </aside>
  )
}
