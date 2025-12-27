export type AppearanceType = 'podcast' | 'youtube' | 'talk' | 'interview'

export interface Appearance {
  id: string
  title: string
  show: string
  type: AppearanceType
  date: string
  url: string
  spotifyUrl?: string
  appleUrl?: string
  youtubeUrl?: string
  featured?: boolean
  summary: string
  showArtwork?: string
}

export interface AppearancesData {
  lastUpdated: string
  appearances: Appearance[]
}
