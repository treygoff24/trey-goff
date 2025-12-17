export const metadata = {
  title: 'Writing',
  description: 'Essays on governance, technology, and institutional innovation.',
}

export default function WritingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <header className="mb-12">
        <h1 className="font-satoshi text-4xl font-medium text-text-1 mb-4">
          Writing
        </h1>
        <p className="text-lg text-text-2 max-w-2xl">
          Long-form essays on governance reform, technology policy, and building
          better institutions.
        </p>
      </header>

      <div className="rounded-lg border border-border-1 bg-surface-1 p-8 text-center">
        <p className="text-text-3">Essays coming soon.</p>
      </div>
    </div>
  )
}
