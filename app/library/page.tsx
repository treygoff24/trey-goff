import { getAllBooks } from '@/lib/books'
import { generateBookSchema } from '@/lib/structured-data'
import { FloatingLibraryWrapper } from '@/components/library/FloatingLibraryWrapper'

export const metadata = {
  title: 'Library',
  description: "Books I've read, am reading, and want to read.",
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
            __html: JSON.stringify(
              generateBookSchema({
                title: book.title,
                author: book.author,
                isbn13: book.isbn13,
                url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://trey.world'}/library#${book.id}`,
                coverUrl: book.coverUrl,
                year: book.year,
              })
            ),
          }}
        />
      ))}

      {/* Full-viewport 3D library experience */}
      <div className="fixed inset-0 h-screen w-screen bg-bg-0">
        <FloatingLibraryWrapper books={books} />
      </div>
    </>
  )
}
