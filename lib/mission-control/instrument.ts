/**
 * The provenance every instrument carries, independent of its payload. Consumers that
 * only render the header (source, timestamp, staleness) take this instead of an
 * `Instrument<unknown>`, so the payload type never has to be erased to say "I ignore it".
 */
export interface InstrumentReading {
  asOf: string
  source: string
  stale: boolean
}

export interface Instrument<T> extends InstrumentReading {
  data: T | null
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
