import { generatePersonSchema } from '@/lib/structured-data'
import { serializeJsonLd } from '@/lib/safe-json-ld'

export const metadata = {
  title: 'About',
  description: 'Who I am and what I believe.',
}

const facts = [
  ['Role', 'Chief of Staff & Director of Public Affairs, Próspera'],
  ['Roots', 'Mississippi → most everywhere'],
  ['Faith', 'Christian'],
]

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(generatePersonSchema()),
        }}
      />
      <div className="tg-page max-w-5xl">
        <header className="tg-rise max-w-4xl">
          <p className="tg-eyebrow text-warm">About</p>
          <h1 className="mt-6 font-newsreader text-[2.78rem] font-medium leading-[1.05] tracking-[-0.025em] text-text-1 text-balance sm:text-[clamp(2.9rem,4.8vw,4rem)] sm:leading-[1.03] sm:[text-wrap:wrap]">
            <span className="sr-only">
              An explorer working on the institutions that let human progress compound.
            </span>
            <span aria-hidden="true">
              An explorer working on the institutions that let human progress{' '}
              <span className="italic text-warm">compound</span>.
            </span>
          </h1>
        </header>

        <section className="mt-8 grid gap-12 md:grid-cols-[minmax(0,1fr)_20rem] md:items-start">
          <div className="max-w-2xl">
            <p className="font-newsreader text-[1.45rem] font-medium leading-[1.55] text-text-1">
              I&apos;m an explorer by temperament and curious to a fault. I work at the intersection
              of public-policy economics and institutional design — and I build the software and AI
              tooling that turns those ideas into something you can touch.
            </p>
            <div className="mt-8 space-y-5 text-base leading-8 text-text-2">
              <p>
                I was the first full-time employee at Próspera, where I now serve as chief of staff
                and director of public affairs. The mandate is easy to state and hard to do: design
                the institutions that let progress compound, and turn governance experiments into
                models other places can actually adopt.
              </p>
              <p>
                I&apos;m a strange mix — deep Mississippi southern roots and a cosmopolitan,
                world-traveling streak. That tension shows up in everything: how I think, what I
                read, and the way I build.
              </p>
              <p>
                I&apos;m a Christian and a husband. My aim is simple to name: find the biggest lever
                I can pull for the largest positive impact on the world, and wring the most meaning,
                purpose, and fulfillment from every precious second the Lord has given me.
              </p>
            </div>
            <blockquote className="mt-10 font-newsreader text-[1.4rem] font-light italic leading-[1.6] text-text-1/90">
              <span aria-hidden="true" className="mr-3 not-italic text-warm">
                —
              </span>
              Make the most meaning you can from every second of existence — then go find a bigger
              lever.
            </blockquote>
          </div>

          <aside className="md:sticky md:top-24">
            <figure className="border border-border-2 bg-bg-1">
              <svg
                viewBox="0 0 320 400"
                className="block aspect-[4/5] w-full"
                role="img"
                aria-label="A star chart tracing an orbit from Mississippi to Roatán, crossed at the present moment by a second, fainter orbit"
              >
                <defs>
                  <radialGradient id="orbit-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#6FD69A" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#6FD69A" stopOpacity="0" />
                  </radialGradient>
                </defs>
                {/* graticule */}
                <path d="M0 96 Q160 76 320 96" stroke="rgba(232,243,236,0.07)" fill="none" />
                <path d="M0 200 Q160 180 320 200" stroke="rgba(232,243,236,0.07)" fill="none" />
                <path d="M0 304 Q160 284 320 304" stroke="rgba(232,243,236,0.07)" fill="none" />
                <path d="M96 0 Q112 200 96 400" stroke="rgba(232,243,236,0.05)" fill="none" />
                <path d="M224 0 Q208 200 224 400" stroke="rgba(232,243,236,0.05)" fill="none" />
                {/* the wider orbit: everywhere else, unlabeled */}
                {[
                  [58, 60],
                  [262, 88],
                  [284, 180],
                  [42, 232],
                  [150, 48],
                  [236, 322],
                  [70, 348],
                ].map(([x, y]) => (
                  <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill="rgba(232,243,236,0.35)" />
                ))}
                {/* a second orbit, different plane — it doesn't track geography.
                    it crosses the first at the present moment. — F */}
                <path
                  d="M302 44 C 258 130, 232 216, 212 292 C 196 350, 164 378, 118 392"
                  stroke="#E8F3EC"
                  strokeWidth="1"
                  strokeDasharray="2 7"
                  fill="none"
                  opacity="0.32"
                />
                <text
                  x="290"
                  y="38"
                  fill="rgba(232,243,236,0.4)"
                  fontSize="8"
                  letterSpacing="1.5"
                  fontFamily="var(--font-mono)"
                >
                  F
                </text>
                {/* the arc that matters */}
                <path
                  d="M92 120 C 150 160, 190 220, 212 292"
                  stroke="#6FD69A"
                  strokeWidth="1.5"
                  strokeDasharray="1 0"
                  fill="none"
                  opacity="0.85"
                />
                <path
                  d="M212 292 C 224 330, 244 352, 276 368"
                  stroke="#6FD69A"
                  strokeWidth="1.25"
                  strokeDasharray="3 5"
                  fill="none"
                  opacity="0.55"
                />
                <circle cx="92" cy="120" r="14" fill="url(#orbit-glow)" />
                <circle cx="92" cy="120" r="3" fill="#97E8BB" />
                <circle cx="212" cy="292" r="18" fill="url(#orbit-glow)" />
                <circle cx="212" cy="292" r="3.5" fill="#97E8BB" />
                <text
                  x="106"
                  y="112"
                  fill="rgba(232,243,236,0.62)"
                  fontSize="9"
                  letterSpacing="1.5"
                  fontFamily="var(--font-mono)"
                >
                  32.3°N — MISSISSIPPI
                </text>
                <text
                  x="88"
                  y="310"
                  fill="rgba(232,243,236,0.62)"
                  fontSize="9"
                  letterSpacing="1.5"
                  fontFamily="var(--font-mono)"
                >
                  16.3°N — ROATÁN
                </text>
              </svg>
              <figcaption className="border-t border-border-1 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-text-3">
                The orbit so far
              </figcaption>
            </figure>
            <div className="mt-6 border-t border-border-2 pt-6">
              <div className="space-y-5">
                {facts.map(([label, value]) => (
                  <div key={label}>
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-warm">
                      {label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-text-2">{value}</p>
                  </div>
                ))}
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-warm">
                    Find me
                  </p>
                  <div className="mt-3 flex gap-4 text-sm font-semibold text-text-2">
                    <a href="https://x.com/thetreygoff" className="hover:text-warm">
                      Twitter
                    </a>
                    <a href="https://github.com/treygoff24" className="hover:text-warm">
                      GitHub
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </>
  )
}
