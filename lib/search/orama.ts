import { create, insert, search, type Orama } from '@orama/orama'
import type { SearchDocument, SearchIndex } from './types'

type OramaSchema = {
  id: 'string'
  type: 'string'
  title: 'string'
  description: 'string'
  content: 'string'
  tags: 'string[]'
  url: 'string'
  keywords: 'string[]'
  priority: 'number'
}

let db: Orama<OramaSchema> | null = null
let initPromise: Promise<void> | null = null

export async function initializeSearch(): Promise<void> {
  if (db) return
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      // Fetch the pre-built index
      const response = await fetch('/search-index.json')
      if (!response.ok) {
        throw new Error(`Search index request failed: ${response.status}`)
      }

      const index: SearchIndex = await response.json()

      // Create Orama database
      db = await create({
        schema: {
          id: 'string',
          type: 'string',
          title: 'string',
          description: 'string',
          content: 'string',
          tags: 'string[]',
          url: 'string',
          keywords: 'string[]',
          priority: 'number',
        },
      })

      // Insert all documents
      for (const doc of index.documents) {
        await insert(db, {
          id: doc.id,
          type: doc.type,
          title: doc.title,
          description: doc.description || '',
          content: doc.content || '',
          tags: doc.tags || [],
          url: doc.url,
          keywords: doc.keywords || [],
          priority: doc.priority || 5,
        })
      }
    } catch (error) {
      db = null
      initPromise = null
      throw error
    }
  })()

  return initPromise
}

export interface SearchResult {
  id: string
  type: SearchDocument['type']
  title: string
  description?: string
  url: string
  score: number
}

export async function searchDocuments(query: string): Promise<SearchResult[]> {
  if (!db) {
    await initializeSearch()
  }

  if (!query.trim()) {
    return []
  }

  if (!db) {
    console.error('Search database failed to initialize')
    return []
  }

  const results = await search(db, {
    term: query,
    properties: ['title', 'description', 'content', 'tags', 'keywords'],
    boost: {
      title: 3,
      keywords: 2,
      description: 1.5,
      tags: 1.5,
      content: 1,
    },
    limit: 20,
  })

  return results.hits.map((hit) => ({
    id: hit.document.id as string,
    type: hit.document.type as SearchDocument['type'],
    title: hit.document.title as string,
    description: hit.document.description as string | undefined,
    url: hit.document.url as string,
    score: hit.score,
  }))
}
