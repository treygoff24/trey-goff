import { mkdirSync } from 'fs'
import { generateSearchIndex } from '../lib/search/generate-index'
import { writeStableJsonFile } from './lib/stable-json'

// Ensure public directory exists
mkdirSync('./public', { recursive: true })

const index = generateSearchIndex()
const result = writeStableJsonFile('./public/search-index.json', index as unknown as Record<string, unknown>, {
  formatting: 0,
  preserveKeys: ['generatedAt'],
})

console.log(
  `${result.changed ? 'Generated' : 'Search index unchanged:'} ${index.documents.length} documents${
    result.preservedTimestamp ? ' (preserved generatedAt)' : ''
  }`,
)
