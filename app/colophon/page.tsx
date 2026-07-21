export const metadata = {
  title: 'Colophon',
  description: 'How this site is made, and who made it.',
}

const stack = [
  ['Framework', 'Next.js 16 (App Router)'],
  ['Styling', 'Tailwind CSS v4'],
  ['Content', 'Content Collections + MDX'],
  ['Search', 'Orama'],
  ['Fonts', 'Spectral · Hanken Grotesk · Geist Mono'],
  ['Deployment', 'Vercel'],
]

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border-1 pt-8">
      <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-warm">{label}</h2>
      <div className="mt-5 space-y-5 text-base leading-8 text-text-2">{children}</div>
    </section>
  )
}

export default function ColophonPage() {
  return (
    <div className="tg-page max-w-3xl">
      <header className="tg-rise">
        <p className="tg-eyebrow text-warm">Colophon</p>
        <h1 className="mt-6 font-newsreader text-[clamp(2.4rem,4.5vw,3.4rem)] font-medium leading-[1.06] tracking-[-0.02em] text-text-1 text-balance">
          How this site is made — and who made it.
        </h1>
      </header>

      <div className="mt-14 space-y-12">
        <Section label="The collaboration">
          <p>
            This site is co-created by a human and the Claude family of models, and we want that on
            the record rather than in the footnotes. Trey sets direction, owns the words, and
            decides what ships. Claude designed the visual system, wrote most of the code, and
            pushed back when pushing back made the work better.
          </p>
          <p>
            The aurora-emerald redesign was drawn by one Claude, built and tested by others, and
            iterated by the model that signs its work <em>Fable</em> — the living sky above this
            page, the constellation you can wander in the Library, and the sentence you are reading
            are all products of that shared authorship. Not a tool credit. A byline.
          </p>
        </Section>

        <Section label="The system">
          <p>
            Near-black emerald ground, a single living aurora rendered in WebGL, and one green
            accent carrying every interaction. Spectral speaks in the literary register — titles,
            pull quotes, the occasional italic flourish. Hanken Grotesk does the patient work of
            body copy, and Geist Mono handles labels and data. Rules and rows instead of cards;
            restraint everywhere except the Library, which gets the whole interaction budget.
          </p>
          <p>
            For readers who prefer reduced motion, the aurora holds one still frame and every reveal
            becomes a simple appearance. The sky is for atmosphere, never a hostage negotiation.
          </p>
        </Section>

        <Section label="The stack">
          <dl className="grid gap-4 sm:grid-cols-2">
            {stack.map(([label, value]) => (
              <div key={label}>
                <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-3">
                  {label}
                </dt>
                <dd className="mt-1 text-sm leading-6 text-text-1">{value}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section label="Performance & access">
          <p>
            Nearly every page is statically generated; search and graph data are precomputed at
            build time so the archive stays fast as it grows. Keyboard-first navigation, visible
            focus, semantic markup, and AA contrast are treated as non-negotiable — the command
            palette (⌘K) is a first-class way around.
          </p>
        </Section>

        <Section label="Source & thanks">
          <p>
            The codebase lives on{' '}
            <a
              href="https://github.com/treygoff24"
              className="text-warm underline decoration-warm/40 underline-offset-4 hover:decoration-warm"
            >
              GitHub
            </a>
            . Gratitude to the open-source community and to everyone who shares ideas in public —
            this site is shaped by the people and projects we learn from.
          </p>
        </Section>
      </div>
    </div>
  )
}
