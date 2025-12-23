import { LibraryClient } from '@/components/library/LibraryClient'
import { getAllBooks } from '@/lib/books'
import { generateBookSchema } from '@/lib/structured-data'

export const metadata = {
  title: 'Library',
  description: 'Books I\'ve read, am reading, and want to read.',
}

export default function LibraryPage() {
  const books = getAllBooks()

  return (
    <>
      {books.map((book) => (
        <script
          key={book.id}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              generateBookSchema({
                title: book.title,
                author: book.author,
                isbn13: book.isbn13,
                url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://trey.world'}/library#${book.id}`,
              })
            ),
          }}
        />
      ))}
      <div className="mx-auto max-w-6xl px-4 py-16">
        <header className="mb-12">
          <h1 className="mb-4 font-satoshi text-4xl font-medium text-text-1">
            Library
          </h1>
          <p className="max-w-2xl text-lg text-text-2">
            Books that have shaped my thinking on governance, economics, and building better systems.
          </p>
        </header>

        <LibraryClient />
      </div>
    </>
  )
}
