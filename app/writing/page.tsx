import { allEssays } from 'content-collections'
import { EssayCard } from '@/components/writing/EssayCard'
import { TagPill } from '@/components/ui/TagPill'

export const metadata = {
  title: 'Writing',
  description: 'Essays on governance, technology, and institutional innovation.',
}

interface WritingPageProps {
  searchParams?: { tag?: string | string[] }
}

export default function WritingPage({ searchParams }: WritingPageProps) {
  const isProduction = process.env.NODE_ENV === 'production'
  const visibleEssays = isProduction
    ? allEssays.filter((essay) => essay.status !== 'draft')
    : allEssays

  const activeTag = Array.isArray(searchParams?.tag)
    ? searchParams?.tag[0]
    : searchParams?.tag

  const allTags = Array.from(
    new Set(visibleEssays.flatMap((essay) => essay.tags))
  ).sort((a, b) => a.localeCompare(b))

  const sortedEssays = [...visibleEssays].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const filteredEssays = activeTag
    ? sortedEssays.filter((essay) => essay.tags.includes(activeTag))
    : sortedEssays

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <header className="mb-12">
        <h1 className="font-satoshi text-4xl font-medium text-text-1 mb-4">
          Writing
        </h1>
        <p className="text-lg text-text-2 max-w-2xl">
          Long-form essays on governance reform, technology policy, and building
          better institutions.
        </p>
      </header>

      {allTags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <TagPill tag="All" href="/writing" active={!activeTag} />
          {allTags.map((tag) => (
            <TagPill
              key={tag}
              tag={tag}
              href={`/writing?tag=${encodeURIComponent(tag)}`}
              active={activeTag === tag}
            />
          ))}
        </div>
      )}

      {filteredEssays.length === 0 ? (
        <div className="rounded-lg border border-border-1 bg-surface-1 p-8 text-center">
          <p className="text-text-3">
            {activeTag
              ? `No essays tagged "${activeTag}" yet.`
              : 'Essays coming soon.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredEssays.map((essay) => (
            <EssayCard
              key={essay.slug}
              title={essay.title}
              slug={essay.slug}
              date={essay.date}
              summary={essay.summary}
              tags={essay.tags}
              readingTime={essay.readingTime}
              status={essay.status}
            />
          ))}
        </div>
      )}
    </div>
  )
}
