import { getAllBooks } from '@/lib/books'
import { buildAuroraGraph, buildAuroraLibrary } from '@/lib/library/aurora'
import { generateLibraryBooksGraph } from '@/lib/structured-data'
import { siteUrl } from '@/lib/site-config'
import { serializeJsonLd } from '@/lib/safe-json-ld'
import { AuroraLibrary } from '@/components/library/AuroraLibrary'

const libraryTitle = 'Library'
const libraryDescription =
  'Everything Trey has read, mapped as a constellation, shelf, river, and index of ideas.'

export const metadata = {
  title: libraryTitle,
  description: libraryDescription,
}

export default function LibraryPage() {
  const books = getAllBooks()
  const auroraBooks = buildAuroraLibrary(books)
  const graph = buildAuroraGraph(auroraBooks)

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

      <AuroraLibrary
        books={graph.books}
        nodes={graph.nodes}
        edges={graph.edges}
        topicCount={graph.topicCounts.size}
      />
    </>
  )
}
