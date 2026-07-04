import Link from 'next/link'
import { notFound } from 'next/navigation'
import { allEssays } from 'content-collections'
import { formatDate } from '@/lib/utils'
import { TableOfContents, MobileTableOfContents } from '@/components/writing/TableOfContents'
import { Prose } from '@/components/content/Prose'
import { RelatedLinks } from '@/components/content/RelatedLinks'
import { SubscribeForm } from '@/components/newsletter/SubscribeForm'
import { markdownToHtml } from '@/lib/markdown'
import { generateArticleSchema, generateBreadcrumbSchema } from '@/lib/structured-data'
import { getBacklinksForEssay, getOutgoingLinksForEssay } from '@/lib/backlinks'
import { isNewsletterEnabled, siteUrl } from '@/lib/site-config'
import { serializeJsonLd } from '@/lib/safe-json-ld'

const isProduction = process.env.NODE_ENV === 'production'
const visibleEssays = isProduction
  ? allEssays.filter((essay) => essay.status !== 'draft')
  : allEssays

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return visibleEssays.map((essay) => ({
    slug: essay.slug,
  }))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const essay = visibleEssays.find((e) => e.slug === slug)

  if (!essay) {
    return { title: 'Essay Not Found' }
  }

  return {
    title: essay.title,
    description: essay.summary,
  }
}

export default async function EssayPage({ params }: PageProps) {
  const { slug } = await params
  const essay = visibleEssays.find((e) => e.slug === slug)

  if (!essay) {
    notFound()
  }

  const contentHtml = await markdownToHtml(essay.content)
  const articleSchema = generateArticleSchema({
    title: essay.title,
    summary: essay.summary,
    date: essay.date,
    slug: essay.slug,
  })
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: siteUrl },
    { name: 'Writing', url: `${siteUrl}/writing` },
    { name: essay.title, url: `${siteUrl}/writing/${essay.slug}` },
  ])
  const outgoingLinks = getOutgoingLinksForEssay(essay.slug)
  const backlinks = getBacklinksForEssay(essay.slug)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(articleSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbSchema),
        }}
      />
      <article className="mx-auto max-w-4xl px-4 py-16">
        {/* Header */}
        <header className="mb-12">
          <p className="tg-eyebrow text-warm">
            Essay
            {essay.status === 'evergreen' && <span className="ml-3 text-text-3">· Evergreen</span>}
          </p>

          <h1 className="mt-6 mb-5 font-newsreader text-[clamp(2.4rem,4.8vw,3.5rem)] font-medium leading-[1.08] tracking-[-0.02em] text-text-1 text-balance">
            {essay.title}
          </h1>

          <p className="mb-7 max-w-2xl text-xl leading-relaxed text-text-2">{essay.summary}</p>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-[0.14em] text-text-3">
            <time dateTime={essay.date}>{formatDate(essay.date)}</time>
            <span aria-hidden="true">·</span>
            <span>{essay.readingTime} min read</span>
            <span aria-hidden="true">·</span>
            <span>{essay.wordCount.toLocaleString()} words</span>
          </div>

          {essay.tags.length > 0 && (
            <p className="mt-5 flex flex-wrap gap-x-3 gap-y-2 font-mono text-[11px] uppercase tracking-[0.14em]">
              {essay.tags.map((tag, index) => (
                <span key={tag} className="flex items-center gap-3">
                  {index > 0 && (
                    <span aria-hidden="true" className="text-text-3">
                      ·
                    </span>
                  )}
                  <Link
                    href={`/writing?tag=${encodeURIComponent(tag)}`}
                    className="text-text-3 transition-colors hover:text-warm"
                  >
                    {tag}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </header>

        {/* Mobile TOC */}
        <MobileTableOfContents contentSelector="#essay-content" sourceId={essay.slug} />

        {/* Content with desktop TOC */}
        <div className="grid gap-12 lg:grid-cols-[1fr_200px]">
          <Prose>
            <div id="essay-content" dangerouslySetInnerHTML={{ __html: contentHtml }} />
          </Prose>

          <TableOfContents contentSelector="#essay-content" sourceId={essay.slug} />
        </div>

        {(outgoingLinks.length > 0 || backlinks.length > 0) && (
          <section className="mt-12 rounded-lg border border-border-1 bg-surface-1 p-6">
            <h2 className="mb-4 font-newsreader text-xl font-medium text-text-1">Connections</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <RelatedLinks title="Links out" links={outgoingLinks} />
              <RelatedLinks title="Backlinks" links={backlinks} />
            </div>
          </section>
        )}

        {isNewsletterEnabled ? (
          <div className="mt-16 rounded-lg border border-border-1 bg-surface-1 p-6">
            <h3 className="mb-2 font-newsreader text-xl font-medium text-text-1">
              Enjoyed this essay?
            </h3>
            <p className="mb-4 text-sm text-text-2">
              Subscribe to get new essays delivered to your inbox.
            </p>
            <SubscribeForm compact />
          </div>
        ) : (
          <section className="mt-16 border-t border-border-2 pt-8">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-3">
              Continue exploring
            </p>
            <h3 className="mt-3 font-newsreader text-2xl font-medium text-text-1">
              Follow the thread from here.
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-2">
              Move into the wider archive, browse connected topics, or jump over to the projects
              turning these ideas into something concrete.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/writing" className="tg-action">
                More essays →
              </Link>
              <Link href="/topics" className="tg-action-secondary">
                Browse topics
              </Link>
              <Link href="/projects" className="tg-action-secondary">
                See projects
              </Link>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-8 border-t border-border-1 pt-8">
          <p className="text-sm text-text-3">Last updated: {formatDate(essay.date)}</p>
        </footer>
      </article>
    </>
  )
}
