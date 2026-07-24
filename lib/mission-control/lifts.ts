import liftsData from '@/data/lifts.json'
import { attemptDate, isStale, isValidDate, type Instrument } from './instrument'

export type LiftName = 'squat' | 'bench' | 'deadlift'

export interface LiftRecord {
  weight: number
  unit: string
  date: string
  type?: string
}

export interface LiftsSource {
  lastUpdated: string
  lifts: Record<LiftName, LiftRecord>
  history?: Partial<Record<LiftName, LiftRecord[]>>
}

export interface StrengthData {
  lifts: Array<{
    name: LiftName
    current: LiftRecord
    progression: LiftRecord[]
  }>
  total: number
  unit: string
}

const liftNames: LiftName[] = ['squat', 'bench', 'deadlift']

function isLiftRecord(value: unknown): value is LiftRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as LiftRecord
  return (
    Number.isFinite(record.weight) &&
    record.weight > 0 &&
    typeof record.unit === 'string' &&
    record.unit.trim() !== '' &&
    isValidDate(record.date)
  )
}

function absentStrength(now: Date): Instrument<StrengthData> {
  return {
    data: null,
    asOf: attemptDate(now),
    source: 'data/lifts.json',
    stale: false,
  }
}

export function aggregateLifts(source: unknown, now = new Date()): Instrument<StrengthData> {
  try {
    if (!source || typeof source !== 'object') return absentStrength(now)
    const liftsSource = source as LiftsSource
    if (
      !isValidDate(liftsSource.lastUpdated) ||
      !liftsSource.lifts ||
      typeof liftsSource.lifts !== 'object' ||
      Array.isArray(liftsSource.lifts) ||
      (liftsSource.history !== undefined &&
        (!liftsSource.history ||
          typeof liftsSource.history !== 'object' ||
          Array.isArray(liftsSource.history)))
    ) {
      return absentStrength(now)
    }

    const lifts = liftNames.map((name) => {
      const current = liftsSource.lifts[name]
      if (!isLiftRecord(current)) throw new Error(`Invalid ${name} record`)
      const historyValue = liftsSource.history?.[name]
      if (
        historyValue !== undefined &&
        (!Array.isArray(historyValue) || !historyValue.every(isLiftRecord))
      ) {
        throw new Error(`Invalid ${name} history`)
      }
      const history = historyValue ?? []
      if (history.some((record) => record.unit !== current.unit)) {
        throw new Error(`Mixed ${name} units`)
      }

      return {
        name,
        current,
        progression: [...history, current].sort((a, b) => a.date.localeCompare(b.date)),
      }
    })

    if (!lifts.every((lift) => lift.current.unit === lifts[0]!.current.unit)) {
      return absentStrength(now)
    }

    return {
      data: {
        lifts,
        total: lifts.reduce((total, lift) => total + lift.current.weight, 0),
        unit: lifts[0]!.current.unit,
      },
      asOf: liftsSource.lastUpdated,
      source: 'data/lifts.json',
      stale: isStale(liftsSource.lastUpdated, 90, now),
    }
  } catch {
    return absentStrength(now)
  }
}

export function getStrengthInstrument(now = new Date()): Instrument<StrengthData> {
  return aggregateLifts(liftsData, now)
}
