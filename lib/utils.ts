import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function parseDateInput(date: string | Date): Date {
  if (date instanceof Date) return date

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!dateOnlyMatch) return new Date(date)

  const [, year, month, day] = dateOnlyMatch
  return new Date(Number(year), Number(month) - 1, Number(day))
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parseDateInput(date))
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parseDateInput(date))
}

export function formatDateRelative(date: string | Date): string {
  const now = new Date()
  const then = parseDateInput(date)
  const diffInDays =
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
      Date.UTC(then.getFullYear(), then.getMonth(), then.getDate())) /
    (1000 * 60 * 60 * 24)

  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  return `${Math.floor(diffInDays / 365)} years ago`
}
