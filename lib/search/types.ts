export interface SearchDocument {
  id: string
  type: 'essay' | 'note' | 'book' | 'project' | 'page' | 'action'
  title: string
  description?: string
  content?: string // First 200 chars for essays/notes
  tags?: string[]
  url: string
  keywords?: string[] // Additional search terms
  priority?: number // For ranking (higher = more important)
}

export interface SearchIndex {
  documents: SearchDocument[]
  version: string
  generatedAt: string
}
