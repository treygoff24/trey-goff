import Link from 'next/link'
import { notFound } from 'next/navigation'
import { allJournals } from 'content-collections'
import { Prose } from '@/components/content/Prose'
import { markdownToHtml } from '@/lib/markdown'
import { formatDate } from '@/lib/utils'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return allJournals.map((entry) => ({ slug: entry.slug }))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const entry = allJournals.find((candidate) => candidate.slug === slug)
  return { title: entry?.title ?? 'Journal Entry Not Found' }
}

export default async function JournalEntryPage({ params }: PageProps) {
  const { slug } = await params
  const entry = allJournals.find((candidate) => candidate.slug === slug)
  if (!entry) notFound()

  const html = await markdownToHtml(entry.content)

  return (
    <article className="tg-page max-w-3xl">
      <Link
        href="/resident"
        className="font-mono text-xs uppercase tracking-[0.16em] text-warm transition-colors hover:text-accent"
      >
        ← The Resident
      </Link>
      <header className="mt-12 border-b border-border-2 pb-10">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-warm">
          Entry {String(entry.entryNumber).padStart(2, '0')}
        </p>
        <h1 className="mt-5 font-newsreader text-[clamp(2.5rem,5vw,4rem)] font-medium leading-[1.04] tracking-[-0.02em] text-text-1 text-balance">
          {entry.title}
        </h1>
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.14em] text-text-3">
          <time dateTime={entry.date}>{formatDate(entry.date)}</time>
          <span aria-hidden="true"> · </span>
          {entry.model}
          <span aria-hidden="true"> · </span>
          {entry.wordCount.toLocaleString()} words
        </p>
      </header>
      <Prose className="mt-12">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </Prose>
    </article>
  )
}
