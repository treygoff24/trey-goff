import { notFound } from 'next/navigation'
import { allEssays } from 'content-collections'
import { formatDate } from '@/lib/utils'
import { TagPill } from '@/components/ui/TagPill'
import {
  TableOfContents,
  MobileTableOfContents,
} from '@/components/writing/TableOfContents'
import { Prose } from '@/components/content/Prose'
import { SubscribeForm } from '@/components/newsletter/SubscribeForm'
import { markdownToHtml } from '@/lib/markdown'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return allEssays.map((essay) => ({
    slug: essay.slug,
  }))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const essay = allEssays.find((e) => e.slug === slug)

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
  const essay = allEssays.find((e) => e.slug === slug)

  if (!essay) {
    notFound()
  }

  const contentHtml = await markdownToHtml(essay.content)

  return (
    <article className="mx-auto max-w-4xl px-4 py-16">
      {/* Header */}
      <header className="mb-12">
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
              <TagPill key={tag} tag={tag} href={`/writing?tag=${tag}`} />
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

      {/* Newsletter CTA */}
      <div className="mt-16 rounded-lg border border-border-1 bg-surface-1 p-6">
        <h3 className="mb-2 font-satoshi text-lg font-medium text-text-1">
          Enjoyed this essay?
        </h3>
        <p className="mb-4 text-sm text-text-2">
          Subscribe to get new essays delivered to your inbox.
        </p>
        <SubscribeForm compact />
      </div>

      {/* Footer */}
      <footer className="mt-8 border-t border-border-1 pt-8">
        <p className="text-sm text-text-3">
          Last updated: {formatDate(essay.date)}
        </p>
      </footer>
    </article>
  )
}
