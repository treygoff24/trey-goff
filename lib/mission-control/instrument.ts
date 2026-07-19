export interface Instrument<T> {
  data: T | null
  asOf: string
  source: string
  stale: boolean
}

export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() === '') return false

  const match = /^(\d{4}-\d{2}-\d{2})(?:T.*)?$/.exec(value)
  const timestamp = Date.parse(value)
  return (
    match !== null &&
    Number.isFinite(timestamp) &&
    new Date(`${match[1]}T00:00:00.000Z`).toISOString().slice(0, 10) === match[1]
  )
}

export function isStale(asOf: string, cadenceDays: number, now = new Date()): boolean {
  const timestamp = Date.parse(asOf)
  if (!Number.isFinite(timestamp)) return true

  return now.getTime() - timestamp > cadenceDays * 24 * 60 * 60 * 1000
}

export function attemptDate(now: Date): string {
  return now.toISOString()
}
