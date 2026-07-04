import type { CSSProperties } from 'react'
import { DISCIPLINE_LABELS, getLedgerRows, sealedAriaLabel, type Project } from '@/lib/projects'
import styles from './workshop.module.css'

function ledgerDate(project: Project): string {
  const [year, month] = project.shippedAt.split('-')
  return `${project.dateApprox ? '~' : ''}${year}.${month ?? '01'}`
}

function SealedTitle() {
  return <span aria-hidden="true" className={styles.redaction} />
}

export function LedgerLens() {
  const rows = getLedgerRows()

  return (
    <section aria-label="Workshop ledger" className="mx-auto max-w-6xl">
      <div className={styles.ledgerRows}>
        {rows.map((project, index) => {
          const rowStyle = { '--workshop-row-index': index } as CSSProperties
          const content = (
            <>
              <time className={styles.meta} dateTime={project.shippedAt}>
                {ledgerDate(project)}
              </time>
              <span className="min-w-0">
                {project.sealed ? (
                  <SealedTitle />
                ) : (
                  <span className={`${styles.rowTitle} text-xl font-medium leading-tight`}>
                    {project.name}
                  </span>
                )}
              </span>
              <span className={styles.meta}>{DISCIPLINE_LABELS[project.discipline]}</span>
              <span className={styles.oneLine}>
                {project.sealed ? (
                  <span className={styles.meta}>{project.sealedNote}</span>
                ) : (
                  project.oneLiner
                )}
              </span>
              <span className={`${styles.meta} ${styles.status}`}>{project.status}</span>
            </>
          )

          return (
            <div key={project.id}>
              {project.sealed ? (
                <div
                  className={`${styles.ledgerRow} ${styles.sealedRow}`}
                  style={rowStyle}
                  aria-label={sealedAriaLabel(project)}
                >
                  {content}
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.ledgerRow}
                  style={rowStyle}
                  data-workshop-project={project.id}
                >
                  {content}
                </button>
              )}

              {project.annotation ? (
                <div className={styles.annotation}>
                  <span>{project.annotation}</span>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
