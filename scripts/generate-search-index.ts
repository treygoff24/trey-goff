import { writeFileSync, mkdirSync } from 'fs'
import { generateSearchIndex } from '../lib/search/generate-index'

// Ensure public directory exists
mkdirSync('./public', { recursive: true })

const index = generateSearchIndex()
writeFileSync('./public/search-index.json', JSON.stringify(index))
console.log(`Generated search index with ${index.documents.length} documents`)
