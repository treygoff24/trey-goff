import { EditorialHeader } from '@/components/site/EditorialHeader'
import { BenchLens } from '@/components/workshop/BenchLens'
import { LedgerLens } from '@/components/workshop/LedgerLens'
import { WorkshopShell } from '@/components/workshop/WorkshopShell'
import { DISCIPLINE_LABELS, getAllProjects, getChronologicalLineageProjects } from '@/lib/projects'
import styles from '@/components/workshop/workshop.module.css'

export const metadata = {
  title: 'Projects — The Workshop',
  description: "Everything I've built, and four ways to walk the floor.",
}

function LineagePlaceholder() {
  const projects = getChronologicalLineageProjects()

  return (
    <section aria-label="Lineage index" className="mx-auto max-w-6xl">
      <ol className={styles.lineageIndex}>
        {projects.map((project) => (
          <li key={project.id}>
            <button type="button" className={styles.lineageRow} data-workshop-project={project.id}>
              <span className={styles.meta}>{project.year}</span>
              <span className="font-newsreader text-xl font-medium leading-tight text-text-1">
                {project.name}
              </span>
              <span className={`${styles.meta} text-right md:text-left`}>
                {DISCIPLINE_LABELS[project.discipline]}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}

function ReceiptsPlaceholder() {
  return (
    <section aria-label="Receipts calibration" className="mx-auto max-w-6xl">
      <p className="border-t border-border-1 pt-5 font-mono text-xs tracking-[0.14em] text-text-3">
        Readings being calibrated.
      </p>
    </section>
  )
}

export default function ProjectsPage() {
  return (
    <div className="tg-page max-w-6xl">
      <EditorialHeader
        eyebrow="Projects"
        title="The Workshop"
        standfirst="Everything I've built, and four ways to walk the floor."
      />

      <WorkshopShell
        projects={getAllProjects()}
        bench={<BenchLens />}
        lineage={<LineagePlaceholder />}
        ledger={<LedgerLens />}
        receipts={<ReceiptsPlaceholder />}
      />
    </div>
  )
}
