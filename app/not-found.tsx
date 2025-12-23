import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-satoshi text-6xl font-bold text-text-1">404</h1>
      <p className="mt-4 text-xl text-text-2">This page does not exist yet.</p>
      <p className="mt-2 text-text-3">
        Try the command palette (Cmd+K) to find what you are looking for.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-warm px-6 py-3 font-medium text-bg-1 transition-colors hover:bg-warm/90"
      >
        Return home
      </Link>
    </div>
  )
}
