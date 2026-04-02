import { getAllBooks } from '@/lib/books'
import { loadBookColors } from '@/lib/library/colors'
import { generateBookSchema } from '@/lib/structured-data'
import { siteUrl } from '@/lib/site-config'
import { serializeJsonLd } from '@/lib/safe-json-ld'
import { StackLibrary } from '@/components/library/StackLibrary'
import coverMapData from '@/public/cover-map.json'

const libraryTitle = 'Library'
const libraryDescription =
  'Books that have shaped my thinking on governance, economics, and building better systems.'

export const metadata = {
  title: libraryTitle,
  description: libraryDescription,
}

export default async function LibraryPage() {
  const books = getAllBooks()
  const colors = await loadBookColors()
  const coverMap = coverMapData as Record<string, string>

  return (
    <>
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

      <StackLibrary
        books={books}
        colors={colors}
        coverMap={coverMap}
        title={libraryTitle}
        description={libraryDescription}
      />
    </>
  )
}
