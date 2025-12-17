import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolveAllCovers } from '../lib/books/covers'
import type { BooksData } from '../lib/books/types'

async function main() {
  console.log('Resolving book covers...')

  // Ensure public directory exists
  mkdirSync('./public', { recursive: true })

  // Load books
  const booksData: BooksData = JSON.parse(
    readFileSync('./content/library/books.json', 'utf-8')
  )

  // Resolve covers
  const covers = await resolveAllCovers(booksData.books)

  // Write cover mapping
  const coverMap = Object.fromEntries(covers)
  writeFileSync('./public/cover-map.json', JSON.stringify(coverMap, null, 2))

  console.log(`Resolved ${covers.size} book covers`)
}

main().catch(console.error)
