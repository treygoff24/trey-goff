import Link from "next/link";
import { TagPill } from "@/components/ui/TagPill";
import { Reveal } from "@/components/motion/Reveal";

interface ProjectLink {
  label: string;
  url: string;
}

interface FeaturedProjectProps {
  project?: {
    slug: string;
    name: string;
    oneLiner: string;
    problem: string;
    approach: string;
    status: "active" | "shipped" | "on-hold" | "archived" | "idea";
    type: "software" | "policy" | "professional" | "experiment";
    roles: string[];
    links: ProjectLink[];
    tags: string[];
  };
}

export function FeaturedProject({ project }: FeaturedProjectProps) {
  return (
    <section className="mt-20">
      <Reveal as="div" className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow text-text-3">Featured project</p>
          <h2 className="mt-3 font-satoshi text-3xl font-medium text-text-1">
            Selected work
          </h2>
        </div>
        <Link
          href="/projects"
          className="text-sm font-medium text-text-3 transition hover:text-warm"
        >
          View all projects
        </Link>
      </Reveal>

      {!project ? (
        <div className="glass-panel rounded-2xl p-8 text-text-3">
          Projects are coming online. Check back soon.
        </div>
      ) : (
        <div className="glass-panel rounded-3xl p-8 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-xl">
              <p className="eyebrow text-text-3">{project.type}</p>
              <h3 className="mt-3 font-satoshi text-2xl font-medium text-text-1">
                {project.name}
              </h3>
              <p className="mt-3 text-text-2">{project.oneLiner}</p>
            </div>
            <div className="flex items-center gap-2">
              <TagPill tag={project.status} size="md" className="border-warm/30 text-warm" />
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <p className="eyebrow text-text-3">Problem</p>
              <p className="mt-3 text-sm text-text-2">{project.problem}</p>
            </div>
            <div>
              <p className="eyebrow text-text-3">Approach</p>
              <p className="mt-3 text-sm text-text-2">{project.approach}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <TagPill key={tag} tag={tag} />
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/projects#${project.slug}`}
              className="inline-flex items-center justify-center rounded-full bg-warm px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-bg-0 transition hover:-translate-y-0.5"
            >
              Case study
            </Link>
            {project.links.map((link) => (
              <Link
                key={`${project.slug}-${link.url}`}
                href={link.url}
                className="inline-flex items-center justify-center rounded-full border border-border-1 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-text-2 transition hover:border-warm/40 hover:text-warm"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
