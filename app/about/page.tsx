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
            <blockquote className="mt-9 border-l-2 border-warm pl-6 font-newsreader text-xl italic leading-8 text-text-1/85">
              Make the most meaning you can from every second of existence — then go find a bigger
              lever.
            </blockquote>
          </div>

          <aside className="md:sticky md:top-24">
            <div className="flex aspect-[4/5] items-center justify-center border border-border-2 bg-bg-1 [background-image:repeating-linear-gradient(135deg,rgba(111,214,154,0.10)_0_10px,transparent_10px_20px)]">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-3">
                drop portrait
              </span>
            </div>
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
                    <a href="https://twitter.com/treygoff" className="hover:text-warm">
                      Twitter
                    </a>
                    <a href="https://github.com/treygoff" className="hover:text-warm">
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
