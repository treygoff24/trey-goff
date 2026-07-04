import type { CSSProperties } from 'react'
import { getBenches, sealedAriaLabel, type Project } from '@/lib/projects'
import styles from './workshop.module.css'

function meta(project: Project): string {
  return `${project.year} · ${project.status}`
}

function BenchProjectRow({ project }: { project: Project }) {
  const receipt = project.receipts?.[0]
  const content = (
    <>
      <span className="min-w-0">
        {project.sealed ? (
          <span aria-hidden="true" className={styles.redaction} />
        ) : (
          <span className={`${styles.rowTitle} text-2xl font-medium leading-tight`}>
            {project.name}
          </span>
        )}
        <span className="mt-2 block max-w-3xl text-sm leading-6 text-text-2">
          {project.sealed ? project.sealedNote : project.oneLiner}
        </span>
      </span>
      <span className="flex flex-wrap items-center justify-start gap-3 justify-self-start md:justify-end">
        {receipt ? <span className={styles.receiptChip}>{receipt.value}</span> : null}
        <span className={`${styles.meta} text-right`}>{meta(project)}</span>
      </span>
    </>
  )

  if (project.sealed) {
    return (
      <div className={styles.benchRow} aria-label={sealedAriaLabel(project)}>
        {content}
      </div>
    )
  }

  return (
    <button type="button" className={styles.benchRow} data-workshop-project={project.id}>
      {content}
    </button>
  )
}

export function BenchLens() {
  const benches = getBenches()

  return (
    <div className="mx-auto max-w-6xl">
      {benches.map((bench, index) => (
        <section
          key={bench.discipline}
          className={styles.benchSection}
          style={{ '--workshop-section-index': index } as CSSProperties}
          aria-labelledby={`bench-${bench.discipline}`}
        >
          <div className={styles.benchHeading}>
            <h2
              id={`bench-${bench.discipline}`}
              className="font-newsreader text-[clamp(2rem,4vw,3rem)] font-medium leading-tight text-text-1"
            >
              {bench.label}
            </h2>
            <span className={styles.meta}>× {bench.projects.length}</span>
          </div>
          <div>
            {bench.projects.map((project) => (
              <BenchProjectRow key={project.id} project={project} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
