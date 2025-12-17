import Link from 'next/link'

const modes = [
  { href: '/writing', label: 'Writing', description: 'Essays and notes' },
  { href: '/library', label: 'Library', description: 'Books and reading' },
  { href: '/graph', label: 'Graph', description: 'Connected ideas' },
  { href: '/projects', label: 'Projects', description: "Things I've built" },
]

export default function HomePage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-bg-0 via-bg-1 to-bg-1" />

      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        {/* Identity */}
        <h1 className="font-satoshi text-4xl font-medium text-text-1 mb-4">
          Trey Goff
        </h1>
        <p className="text-xl text-text-2 mb-12 max-w-xl mx-auto">
          Building better governance through acceleration zones and
          institutional innovation.
        </p>

        {/* Command bar placeholder */}
        <button
          className="mx-auto mb-16 flex w-full max-w-md items-center gap-3 rounded-lg border border-border-1 bg-surface-1 px-4 py-3 text-left text-text-3 transition-colors hover:border-border-2 hover:bg-surface-2"
          aria-label="Open search"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span>Search everything...</span>
          <kbd className="ml-auto hidden rounded bg-surface-2 px-2 py-0.5 font-mono text-xs sm:inline-block">
            ⌘K
          </kbd>
        </button>

        {/* Mode tiles */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {modes.map((mode) => (
            <Link
              key={mode.href}
              href={mode.href}
              className="group rounded-lg border border-border-1 bg-surface-1 p-6 text-left transition-all hover:border-border-2 hover:bg-surface-2"
            >
              <h2 className="font-satoshi text-lg font-medium text-text-1 group-hover:text-warm">
                {mode.label}
              </h2>
              <p className="mt-1 text-sm text-text-3">{mode.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
