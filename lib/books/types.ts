export interface Book {
  // Core fields (required)
  id: string
  title: string
  author: string
  year: number

  // Identifiers
  isbn?: string
  isbn13?: string

  // Status and rating
  status: 'want' | 'reading' | 'read' | 'abandoned'
  rating?: 1 | 2 | 3 | 4 | 5
  dateRead?: string // ISO date
  dateStarted?: string // ISO date

  // Categorization
  topics: string[]
  genre?: string

  // Content
  whyILoveIt: string // Always present, short blurb
  review?: string // Optional longer review

  // Links
  amazonUrl?: string
  goodreadsUrl?: string
  bookshopUrl?: string

  // Override cover (if manual)
  coverUrl?: string
}

export interface BooksData {
  books: Book[]
  lastUpdated: string
}

export type BookStatus = Book['status']
export type BookRating = NonNullable<Book['rating']>
