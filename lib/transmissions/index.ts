import transmissionsData from '@/content/transmissions/publications.json'
import type { Transmission, TransmissionsData } from './types'

const data = transmissionsData as TransmissionsData

export function getAllTransmissions(): Transmission[] {
  return [...data.transmissions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export function getFeaturedTransmissions(): Transmission[] {
  return getAllTransmissions().filter((t) => t.featured)
}

export function getTransmissionsByPublication(
  publication: string
): Transmission[] {
  return getAllTransmissions().filter((t) => t.publication === publication)
}

export function getAllPublications(): string[] {
  const publications = new Set(data.transmissions.map((t) => t.publication))
  return Array.from(publications).sort()
}

export type { Transmission, TransmissionsData }
