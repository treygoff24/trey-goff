import Link from 'next/link'

export function DormantEdition() {
  return (
    <section className="mx-auto flex min-h-[78svh] w-full max-w-4xl flex-col items-center justify-center px-6 pb-24 pt-40 text-center sm:pt-36">
      <p className="tg-eyebrow text-warm">The Edition</p>
      <h1 className="mt-7 font-newsreader text-[clamp(3rem,7vw,5.2rem)] font-medium leading-none tracking-[-0.035em] text-text-1">
        The Edition is resting.
      </h1>
      <p className="mt-7 max-w-xl text-lg leading-8 text-text-2">
        The composing room is dark tonight. The essays, projects, and library are all still awake.
      </p>
      <Link href="/writing" className="tg-action mt-9">
        Browse the usual way →
      </Link>
    </section>
  )
}
