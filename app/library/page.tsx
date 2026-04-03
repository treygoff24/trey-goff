import { getAllBooks } from '@/lib/books'
import type { BookColorMap } from '@/lib/library/colors'
import { generateLibraryBooksGraph } from '@/lib/structured-data'
import { siteUrl } from '@/lib/site-config'
import { serializeJsonLd } from '@/lib/safe-json-ld'
import { StackLibrary } from '@/components/library/StackLibrary'
import bookColorsData from '@/public/book-colors.json'
import coverMapData from '@/public/cover-map.json'

const libraryTitle = 'Library'
const libraryDescription =
  'Books that have shaped my thinking on governance, economics, and building better systems.'

export const metadata = {
  title: libraryTitle,
  description: libraryDescription,
}

export default function LibraryPage() {
  const books = getAllBooks()
  const colors = bookColorsData as BookColorMap
  const coverMap = coverMapData as Record<string, string>

  const libraryJsonLd = generateLibraryBooksGraph(
    books.map((book) => ({
      title: book.title,
      author: book.author,
      isbn13: book.isbn13,
      url: `${siteUrl}/library#${book.id}`,
      coverUrl: book.coverUrl,
      year: book.year,
    })),
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(libraryJsonLd),
        }}
      />

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
