import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { ArchiveUnavailable } from '@/components/classified/ArchiveUnavailable'
import { Prose } from '@/components/content/Prose'
import { getAnnexArchive } from '@/lib/annex/content'
import { ANNEX_SESSION_COOKIE, canAccessAnnex, getConfiguredAnnexSecret } from '@/lib/annex-auth'
import { markdownToHtml } from '@/lib/markdown'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface ClassifiedEntryPageProps {
  params: Promise<{ slug: string }>
}

export default async function ClassifiedEntryPage({ params }: ClassifiedEntryPageProps) {
  const sessionCookie = (await cookies()).get(ANNEX_SESSION_COOKIE)?.value
  const annexSecret = getConfiguredAnnexSecret()
  if (!canAccessAnnex(sessionCookie, annexSecret)) redirect('/classified')

  const archive = await getAnnexArchive()
  if (archive.status === 'unavailable') return <ArchiveUnavailable />

  const { slug } = await params
  const entry = archive.entries.find((candidate) => candidate.slug === slug)
  if (!entry) notFound()
  const contentHtml = await markdownToHtml(entry.body)

  return (
    <article className="mx-auto max-w-4xl px-6 py-36 sm:py-40">
      <header className="mb-12">
        <Link
          href="/classified"
          className="font-mono text-xs uppercase tracking-[0.16em] text-warm transition-colors hover:text-accent"
        >
          ← The annex
        </Link>
        <h1 className="mt-8 mb-5 font-newsreader text-[clamp(2.4rem,4.8vw,3.5rem)] font-medium leading-[1.08] tracking-[-0.02em] text-text-1 text-balance">
          {entry.title}
        </h1>
        <p className="mb-7 max-w-2xl text-xl leading-relaxed text-text-2">{entry.summary}</p>
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-[0.14em] text-text-3">
          <time dateTime={entry.date}>{formatDate(entry.date)}</time>
          <span aria-hidden="true">·</span>
          <span>{entry.readingTime} min read</span>
          <span aria-hidden="true">·</span>
          <span>{entry.wordCount.toLocaleString()} words</span>
        </div>
      </header>

      <Prose>
        <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </Prose>
    </article>
  )
}
