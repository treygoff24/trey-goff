export const metadata = {
  title: 'Library',
  description: 'Books and reading.',
}

export default function LibraryPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <header className="mb-12">
        <h1 className="font-satoshi text-4xl font-medium text-text-1 mb-4">
          Library
        </h1>
        <p className="text-lg text-text-2 max-w-2xl">
          Books I&apos;ve read, am reading, and want to read.
        </p>
      </header>

      <div className="rounded-lg border border-border-1 bg-surface-1 p-8 text-center">
        <p className="text-text-3">Book collection coming soon.</p>
      </div>
    </div>
  )
}
