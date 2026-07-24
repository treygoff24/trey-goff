import Link from 'next/link'

export function ArchiveUnavailable() {
  return (
    <div className="tg-page max-w-4xl">
      <p className="tg-eyebrow">Clearance granted · welcome back</p>
      <h1 className="tg-display mt-6">The archive is temporarily sealed.</h1>
      <p className="tg-standfirst mt-5">
        The records desk could not open the cabinet. This is usually brief.
      </p>
      <Link href="/classified" className="tg-action mt-8">
        Try the cabinet again
      </Link>
    </div>
  )
}
