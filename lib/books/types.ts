export interface Book {
  id: string
  title: string
  author: string
  year: number

  isbn?: string
  isbn13?: string

  status: 'want' | 'reading' | 'read' | 'abandoned'
  rating?: 1 | 2 | 3 | 4 | 5
  dateRead?: string // ISO date
  dateStarted?: string // ISO date

  topics: string[]
  genre?: string

  whyILoveIt: string // Always present, short blurb
  review?: string // Optional longer review

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
