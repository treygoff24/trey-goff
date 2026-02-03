import Link from "next/link";
import { homeHero } from "@/data/home";
import { CommandHero } from "@/components/home/CommandHero";
import { TagPill } from "@/components/ui/TagPill";
import { Reveal } from "@/components/motion/Reveal";

export function HeroSection() {
  return (
    <section className="relative">
      <div className="section-shell overflow-hidden rounded-3xl px-6 py-10 sm:px-10 sm:py-14">
        <div className="relative z-10 flex flex-col gap-8">
          <div className="eyebrow text-text-3">{homeHero.eyebrow}</div>

          <Reveal as="h1" className="font-satoshi text-4xl font-medium text-text-1 sm:text-6xl">
            {homeHero.headline}
          </Reveal>

          <Reveal as="p" delay={0.05} className="max-w-2xl text-lg text-text-2 sm:text-xl">
            {homeHero.subhead}
          </Reveal>

          <Reveal as="div" delay={0.1} className="flex flex-wrap gap-2">
            {homeHero.highlights.map((item) => (
              <TagPill key={item} tag={item} size="md" className="border-white/10 text-text-2" />
            ))}
          </Reveal>

          <Reveal as="div" delay={0.15} className="flex flex-wrap gap-3">
            <Link
              href={homeHero.ctas.primary.href}
              className="inline-flex items-center justify-center rounded-full bg-warm px-6 py-3 text-sm font-medium text-bg-0 shadow-lg shadow-warm/25 transition hover:-translate-y-0.5 hover:shadow-warm/40"
            >
              {homeHero.ctas.primary.label}
            </Link>
            <Link
              href={homeHero.ctas.secondary.href}
              className="inline-flex items-center justify-center rounded-full border border-border-1 px-6 py-3 text-sm font-medium text-text-1 transition hover:-translate-y-0.5 hover:border-warm/40 hover:text-warm"
            >
              {homeHero.ctas.secondary.label}
            </Link>
            <Link
              href={homeHero.ctas.tertiary.href}
              className="inline-flex items-center justify-center rounded-full border border-transparent px-4 py-3 text-sm font-medium text-text-3 transition hover:text-text-1"
            >
              {homeHero.ctas.tertiary.label}
            </Link>
          </Reveal>
        </div>

        <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-warm/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="mt-10">
        <CommandHero />
      </div>
    </section>
  );
}
