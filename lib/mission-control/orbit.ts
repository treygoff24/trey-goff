import appearancesData from '@/content/media/appearances.json'
import transmissionsData from '@/content/transmissions/publications.json'
import { attemptDate, isStale, isValidDate, type Instrument } from './instrument'

export interface OrbitEntry {
  title: string
  venue: string
  date: string
  url: string
  kind: 'appearance' | 'publication'
}

interface AppearancesSource {
  lastUpdated: string
  appearances: Array<{ title: string; show: string; date: string; url: string }>
}

interface PublicationsSource {
  lastUpdated: string
  transmissions: Array<{ title: string; publication: string; date: string; url: string }>
}

const source = 'content/transmissions/publications.json · content/media/appearances.json'

function absentOrbit(now: Date): Instrument<OrbitEntry[]> {
  return {
    data: null,
    asOf: attemptDate(now),
    source,
    stale: false,
  }
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() === '') return false
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isAppearanceSource(value: unknown): value is AppearancesSource {
  if (!value || typeof value !== 'object') return false
  const source = value as AppearancesSource
  return (
    isValidDate(source.lastUpdated) &&
    Array.isArray(source.appearances) &&
    source.appearances.every(
      (item) =>
        !!item &&
        typeof item.title === 'string' &&
        item.title.trim() !== '' &&
        typeof item.show === 'string' &&
        item.show.trim() !== '' &&
        isValidDate(item.date) &&
        isHttpUrl(item.url),
    )
  )
}

function isPublicationsSource(value: unknown): value is PublicationsSource {
  if (!value || typeof value !== 'object') return false
  const source = value as PublicationsSource
  return (
    isValidDate(source.lastUpdated) &&
    Array.isArray(source.transmissions) &&
    source.transmissions.every(
      (item) =>
        !!item &&
        typeof item.title === 'string' &&
        item.title.trim() !== '' &&
        typeof item.publication === 'string' &&
        item.publication.trim() !== '' &&
        isValidDate(item.date) &&
        isHttpUrl(item.url),
    )
  )
}

export function aggregateOrbit(
  appearancesData: unknown,
  transmissionsData: unknown,
  now = new Date(),
): Instrument<OrbitEntry[]> {
  try {
    if (!isAppearanceSource(appearancesData) || !isPublicationsSource(transmissionsData)) {
      throw new Error('Invalid orbit data')
    }
    const appearances = appearancesData
    const publications = transmissionsData
    const data = [
      ...appearances.appearances.map((item) => ({
        title: item.title,
        venue: item.show,
        date: item.date,
        url: item.url,
        kind: 'appearance' as const,
      })),
      ...publications.transmissions.map((item) => ({
        title: item.title,
        venue: item.publication,
        date: item.date,
        url: item.url,
        kind: 'publication' as const,
      })),
    ]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3)
    const asOf =
      [appearances.lastUpdated, publications.lastUpdated, ...data.map((item) => item.date)]
        .sort()
        .reverse()[0] ?? attemptDate(now)

    return {
      data,
      asOf,
      source,
      stale: isStale(asOf, 30, now),
    }
  } catch {
    return absentOrbit(now)
  }
}

export function getOrbitInstrument(now = new Date()): Instrument<OrbitEntry[]> {
  return aggregateOrbit(appearancesData, transmissionsData, now)
}
