import { notFound } from 'next/navigation'
import { allEssays } from 'content-collections'
import { formatDate } from '@/lib/utils'
import { TagPill } from '@/components/ui/TagPill'
import {
  TableOfContents,
  MobileTableOfContents,
} from '@/components/writing/TableOfContents'
import { Prose } from '@/components/content/Prose'
import { markdownToHtml } from '@/lib/markdown'
import { timingSafeEqual } from 'crypto'

export const dynamic = 'force-dynamic'

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ secret?: string | string[] }>
}

export default async function EssayPreviewPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params
  const searchParamsResolved = await searchParams
  const secretParam = Array.isArray(searchParamsResolved?.secret)
    ? searchParamsResolved?.secret[0]
    : searchParamsResolved?.secret

  const isProduction = process.env.NODE_ENV === 'production'
  const previewSecret = process.env.DRAFT_PREVIEW_SECRET

  const secretBuffer = Buffer.from(secretParam || '')
  const expectedBuffer = Buffer.from(previewSecret || '')
  const isValidSecret = secretBuffer.length === expectedBuffer.length &&
    timingSafeEqual(secretBuffer, expectedBuffer)

  const canPreview = !isProduction || isValidSecret

  if (!canPreview) {
    notFound()
  }

  const essay = allEssays.find((e) => e.slug === slug)

  if (!essay) {
    notFound()
  }

  const contentHtml = await markdownToHtml(essay.content)

  return (
    <article className="mx-auto max-w-4xl px-4 py-16">
      {/* Preview banner */}
      <div className="mb-8 rounded-lg border border-warm/40 bg-warm/10 px-4 py-3 text-sm text-warm">
        Draft preview
      </div>

      {/* Header */}
      <header className="mb-12">
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

        <h1 className="font-satoshi text-4xl font-medium text-text-1 mb-4">
          {essay.title}
        </h1>

        <p className="text-xl text-text-2 mb-6">{essay.summary}</p>

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
              <TagPill
                key={tag}
                tag={tag}
                href={`/writing?tag=${encodeURIComponent(tag)}`}
              />
            ))}
          </div>
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
    </article>
  )
}
