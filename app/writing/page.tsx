import Link from 'next/link'
import { allEssays } from 'content-collections'
import { EditorialHeader } from '@/components/site/EditorialHeader'
import { EditorialIndexRow } from '@/components/site/EditorialIndexRow'
import { formatDateShort } from '@/lib/utils'

export const metadata = {
  title: 'Writing',
  description: 'Essays on governance, technology, and institutional innovation.',
}

interface WritingPageProps {
  searchParams: Promise<{ tag?: string | string[] }>
}

export default async function WritingPage({ searchParams }: WritingPageProps) {
  const params = await searchParams
  const isProduction = process.env.NODE_ENV === 'production'
  const visibleEssays = isProduction
    ? allEssays.filter((essay) => essay.status !== 'draft')
    : allEssays

  const activeTag = Array.isArray(params?.tag) ? params?.tag[0] : params?.tag
  const sortedEssays = [...visibleEssays].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
  const filteredEssays = activeTag
    ? sortedEssays.filter((essay) => essay.tags.includes(activeTag))
    : sortedEssays
  const featuredEssay = filteredEssays.find((essay) => essay.featured) ?? filteredEssays[0]
  const moreEssays = featuredEssay
    ? filteredEssays.filter((essay) => essay.slug !== featuredEssay.slug)
    : filteredEssays

  return (
    <div className="tg-page max-w-5xl">
      <EditorialHeader
        eyebrow="Writing"
        title="Essays & field notes"
        standfirst="Long-form thinking on governance reform, institutional design, technology, faith, and the craft of building things that last."
      />

      {filteredEssays.length === 0 ? (
        <section className="mt-14 border-t border-warm pt-8 text-text-3">
          {activeTag ? `No essays tagged “${activeTag}” yet.` : 'Essays coming soon.'}
        </section>
      ) : (
        <>
          {featuredEssay && (
            <section className="mt-6">
              <article>
                <Link
                  href={`/writing/${featuredEssay.slug}`}
                  className="group block border-t-2 border-warm px-1 py-8 transition-colors hover:bg-warm/5 sm:py-10"
                >
                  <div className="mb-5 flex flex-wrap items-center gap-3">
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-warm">
                      Featured
                    </span>
                    <span className="text-sm text-text-3">
                      <time dateTime={featuredEssay.date}>
                        {formatDateShort(featuredEssay.date)}
                      </time>{' '}
                      · {featuredEssay.readingTime} min read
                    </span>
                  </div>
                  <h2 className="max-w-3xl font-newsreader text-[clamp(2rem,4vw,3.4rem)] font-normal leading-[1.08] text-text-1 transition-colors group-hover:text-warm">
                    {featuredEssay.title}
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-text-2">
                    {featuredEssay.summary}
                  </p>
                  <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-text-3">
                    {featuredEssay.tags.slice(0, 4).join(' · ')}
                  </p>
                </Link>
              </article>
            </section>
          )}

          <section className="mt-12">
            <p className="border-b border-border-1 pb-5 font-mono text-xs uppercase tracking-[0.2em] text-text-3">
              More essays
            </p>
            {moreEssays.map((essay) => (
              <article key={essay.slug}>
                <EditorialIndexRow
                  href={`/writing/${essay.slug}`}
                  meta={<time dateTime={essay.date}>{formatDateShort(essay.date)}</time>}
                  title={essay.title}
                  description={essay.summary}
                  tags={essay.tags}
                  detail={`${essay.readingTime} min →`}
                />
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  )
}
