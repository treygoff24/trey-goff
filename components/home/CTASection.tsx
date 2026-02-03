import Link from "next/link";
import { homeCta } from "@/data/home";
import { Reveal } from "@/components/motion/Reveal";

export function CTASection() {
  return (
    <section className="mt-20">
      <div className="section-shell rounded-3xl px-6 py-10 sm:px-10 sm:py-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <Reveal as="p" className="eyebrow text-text-3">
              {homeCta.eyebrow}
            </Reveal>
            <Reveal
              as="h2"
              delay={0.05}
              className="mt-4 font-satoshi text-3xl font-medium text-text-1"
            >
              {homeCta.title}
            </Reveal>
            <Reveal as="p" delay={0.1} className="mt-3 text-text-2">
              {homeCta.description}
            </Reveal>
          </div>

          <Reveal as="div" delay={0.15} className="flex flex-wrap gap-3">
            <Link
              href={homeCta.primary.href}
              className="inline-flex items-center justify-center rounded-full bg-warm px-6 py-3 text-sm font-semibold text-bg-0 shadow-lg shadow-warm/25 transition hover:-translate-y-0.5"
            >
              {homeCta.primary.label}
            </Link>
            <Link
              href={homeCta.secondary.href}
              className="inline-flex items-center justify-center rounded-full border border-border-1 px-6 py-3 text-sm font-medium text-text-1 transition hover:-translate-y-0.5 hover:border-warm/40 hover:text-warm"
            >
              {homeCta.secondary.label}
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
