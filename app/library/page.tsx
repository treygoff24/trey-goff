import { LibraryClient } from '@/components/library/LibraryClient'

export const metadata = {
  title: 'Library',
  description: 'Books I\'ve read, am reading, and want to read.',
}

export default function LibraryPage() {
  return (
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
  )
}
