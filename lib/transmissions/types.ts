/**
 * External Publications / Transmissions Types
 *
 * Content published elsewhere, broadcast out into the world.
 */

export interface Transmission {
  id: string
  title: string
  publication: string
  /** Channel identifier for the broadcast aesthetic */
  channel?: string
  date: string
  url: string
  summary: string
  /** Tags for knowledge graph integration */
  tags: string[]
  /** Whether this is a featured/notable piece */
  featured?: boolean
}

export interface TransmissionsData {
  lastUpdated: string
  transmissions: Transmission[]
}
