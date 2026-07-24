import nowData from '@/data/now.json'
import { attemptDate, isStale, isValidDate, type Instrument } from './instrument'

export interface FocusData {
  mission: string
  location: string | null
  tz: string | null
  note: string
}

interface FocusSource extends FocusData {
  updated: string
}

function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return true
  } catch {
    return false
  }
}

function isFocusSource(value: unknown): value is FocusSource {
  if (!value || typeof value !== 'object') return false
  const source = value as FocusSource
  return (
    typeof source.mission === 'string' &&
    source.mission.trim() !== '' &&
    typeof source.note === 'string' &&
    source.note.trim() !== '' &&
    isValidDate(source.updated) &&
    (source.location === null ||
      (typeof source.location === 'string' && source.location.trim() !== '')) &&
    (source.tz === null || (typeof source.tz === 'string' && isTimeZone(source.tz)))
  )
}

function absentFocus(now: Date): Instrument<FocusData> {
  return {
    data: null,
    asOf: attemptDate(now),
    source: 'data/now.json',
    stale: false,
  }
}

export function aggregateFocus(source: unknown, now = new Date()): Instrument<FocusData> {
  if (!isFocusSource(source)) return absentFocus(now)

  return {
    data: {
      mission: source.mission,
      location: source.location,
      tz: source.tz,
      note: source.note,
    },
    asOf: source.updated,
    source: 'data/now.json',
    stale: isStale(source.updated, 30, now),
  }
}

export function getFocusInstrument(now = new Date()): Instrument<FocusData> {
  const e2eTimeZone =
    process.env.NODE_ENV !== 'production' ? process.env.MISSION_CONTROL_E2E_TIME_ZONE : undefined
  return aggregateFocus(e2eTimeZone ? { ...nowData, tz: e2eTimeZone } : nowData, now)
}
