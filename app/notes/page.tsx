export const metadata = {
  title: 'Notes',
  description: 'Quick thoughts, dispatches, and interesting links.',
}

export default function NotesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <header className="mb-12">
        <h1 className="font-satoshi text-4xl font-medium text-text-1 mb-4">
          Notes
        </h1>
        <p className="text-lg text-text-2">
          Quick thoughts, dispatches from the field, and interesting links.
        </p>
      </header>

      <div className="rounded-lg border border-border-1 bg-surface-1 p-8 text-center">
        <p className="text-text-3">Notes coming soon.</p>
      </div>
    </div>
  )
}
