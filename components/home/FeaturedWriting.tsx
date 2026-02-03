import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { TagPill } from "@/components/ui/TagPill";
import { Reveal } from "@/components/motion/Reveal";

interface FeaturedEssay {
  slug: string;
  title: string;
  summary: string;
  date: string;
  readingTime: number;
  tags: string[];
  status: "draft" | "published" | "evergreen";
}

interface FeaturedWritingProps {
  essays: FeaturedEssay[];
}

export function FeaturedWriting({ essays }: FeaturedWritingProps) {
  return (
    <section className="mt-20">
      <Reveal as="div" className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow text-text-3">Start here</p>
          <h2 className="mt-3 font-satoshi text-3xl font-medium text-text-1">
            Featured essays
          </h2>
        </div>
        <Link
          href="/writing"
          className="text-sm font-medium text-text-3 transition hover:text-warm"
        >
          All writing
        </Link>
      </Reveal>

      {essays.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-text-3">
          New essays are on the way.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {essays.map((essay, index) => (
            <Reveal
              key={essay.slug}
              as="article"
              delay={0.05 * index}
              className="glass-panel group rounded-2xl p-6 transition hover:-translate-y-1"
            >
              <Link href={`/writing/${essay.slug}`} className="block">
                {essay.status === "evergreen" && (
                  <span className="mb-3 inline-flex rounded-full border border-warm/30 bg-warm/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-warm">
                    Evergreen
                  </span>
                )}
                <h3 className="font-satoshi text-xl font-medium text-text-1 transition group-hover:text-warm">
                  {essay.title}
                </h3>
                <p className="mt-3 text-sm text-text-2 line-clamp-4">
                  {essay.summary}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-text-3">
                  <time dateTime={essay.date}>{formatDate(essay.date)}</time>
                  <span>·</span>
                  <span>{essay.readingTime} min read</span>
                </div>
                {essay.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {essay.tags.slice(0, 3).map((tag) => (
                      <TagPill key={`${essay.slug}-${tag}`} tag={tag} />
                    ))}
                  </div>
                )}
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
