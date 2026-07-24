import { sanitizeModelText } from '@/lib/edition/catalog'

interface EditionProseProps {
  text: unknown
  maxLength: number
  className?: string
}

export function EditionProse({ text, maxLength, className }: EditionProseProps) {
  return <p className={className}>{sanitizeModelText(text, maxLength)}</p>
}
