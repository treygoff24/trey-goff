import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { allEssays } from 'content-collections'
import { formatDate } from '@/lib/utils'
import { TagPill } from '@/components/ui/TagPill'
import { TableOfContents, MobileTableOfContents } from '@/components/writing/TableOfContents'
import { Prose } from '@/components/content/Prose'
import { markdownToHtml } from '@/lib/markdown'
import { loadInstrumentPiece } from '@/lib/instruments/manifest'
import { InstrumentArticle } from '@/components/instruments/InstrumentArticle'
import { canAccessDraftPreview, PREVIEW_SESSION_COOKIE } from '@/lib/preview-auth'

export const dynamic = 'force-dynamic'

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function EssayPreviewPage({ params }: PageProps) {
  const { slug } = await params
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(PREVIEW_SESSION_COOKIE)?.value

  const canPreview = canAccessDraftPreview({
    nodeEnv: process.env.NODE_ENV,
    allowDraftPreview: process.env.ALLOW_DRAFT_PREVIEW === 'true',
    previewSecret: process.env.DRAFT_PREVIEW_SECRET,
    sessionCookie,
  })

  if (!canPreview) {
    notFound()
  }

  const essay = allEssays.find((e) => e.slug === slug)

  if (!essay) {
    notFound()
  }

  // A piece with an instrument manifest renders through the instrument seam here too, so a
  // draft is previewed as the thing it will be rather than as plain prose. The auth gate
  // above is untouched: this branch is chosen after access has already been decided.
  const piece = loadInstrumentPiece(slug)
  const contentHtml = piece ? '' : await markdownToHtml(essay.content)

  return (
    <article className={`mx-auto px-4 py-16 ${piece ? 'max-w-[88rem]' : 'max-w-4xl'}`}>
      {/* Preview banner */}
      <div className="mb-8 rounded-lg border border-warm/40 bg-warm/10 px-4 py-3 text-sm text-warm">
        Draft preview
      </div>

      {/* Header */}
      <header className={`mb-12 ${piece ? 'max-w-4xl' : ''}`}>
        {essay.status === 'draft' && (
          <span className="mb-4 inline-block rounded-full bg-error/10 px-3 py-1 text-sm font-medium text-error">
            Draft
          </span>
        )}

        {essay.status === 'evergreen' && (
          <span className="mb-4 inline-block rounded-full bg-warm/10 px-3 py-1 text-sm font-medium text-warm">
            Evergreen
          </span>
        )}

        {/* Deliberately the production essay's own type, not a preview approximation. A draft
            is reviewed here before it ships, and a header set in a different family at a
            different size means the review is of a page that will never exist. */}
        <h1 className="mt-6 mb-5 font-newsreader text-[clamp(2.4rem,4.8vw,3.5rem)] leading-[1.08] font-medium tracking-[-0.02em] text-balance text-text-1">
          {essay.title}
        </h1>

        <p className="mb-7 max-w-2xl text-xl leading-relaxed text-text-2">{essay.summary}</p>

        <div className="flex flex-wrap items-center gap-4 text-sm text-text-3">
          <time dateTime={essay.date}>{formatDate(essay.date)}</time>
          <span>·</span>
          <span>{essay.readingTime} min read</span>
          <span>·</span>
          <span>{essay.wordCount.toLocaleString()} words</span>
        </div>

        {essay.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {essay.tags.map((tag) => (
              <TagPill key={tag} tag={tag} href={`/writing?tag=${encodeURIComponent(tag)}`} />
            ))}
          </div>
        )}
      </header>

      {piece ? (
        <InstrumentArticle markdown={essay.content} {...piece} />
      ) : (
        <>
          {/* Mobile TOC */}
          <MobileTableOfContents contentSelector="#essay-content" sourceId={essay.slug} />

          {/* Content with desktop TOC */}
          <div className="grid gap-12 lg:grid-cols-[1fr_200px]">
            <Prose>
              <div id="essay-content" dangerouslySetInnerHTML={{ __html: contentHtml }} />
            </Prose>

            <TableOfContents contentSelector="#essay-content" sourceId={essay.slug} />
          </div>
        </>
      )}
    </article>
  )
}
