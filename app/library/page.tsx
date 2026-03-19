import { getAllBooks } from '@/lib/books'
import { generateBookSchema } from '@/lib/structured-data'
import { siteUrl } from '@/lib/site-config'
import { serializeJsonLd } from '@/lib/safe-json-ld'
import { FloatingLibraryWrapper } from '@/components/library/FloatingLibraryWrapper'

const libraryTitle = 'Library'
const libraryDescription =
  'Books that have shaped my thinking on governance, economics, and building better systems.'

export const metadata = {
  title: libraryTitle,
  description: libraryDescription,
}

export default function LibraryPage() {
  const books = getAllBooks()

  return (
    <>
      {/* Structured data for SEO */}
      {books.map((book) => (
        <script
          key={book.id}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(
              generateBookSchema({
                title: book.title,
                author: book.author,
                isbn13: book.isbn13,
                url: `${siteUrl}/library#${book.id}`,
                coverUrl: book.coverUrl,
                year: book.year,
              }),
            ),
          }}
        />
      ))}

      <FloatingLibraryWrapper books={books} title={libraryTitle} description={libraryDescription} />
    </>
  )
}
