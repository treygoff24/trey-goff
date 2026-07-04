import type { CSSProperties } from 'react'
import { getReceiptProjects } from '@/lib/projects'
import styles from './workshop.module.css'

export function ReceiptsLens() {
  const projects = getReceiptProjects()

  return (
    <section aria-label="Workshop receipts" className="mx-auto max-w-6xl">
      <p className="mb-5 font-mono text-xs leading-6 tracking-[0.12em] text-text-3">
        All figures measured from live runs. Nothing projected.
      </p>
      <div className={styles.receiptRows}>
        {projects.map((project, index) => (
          <button
            key={project.id}
            type="button"
            className={styles.receiptRow}
            style={{ '--workshop-row-index': index } as CSSProperties}
            data-workshop-project={project.id}
          >
            <span className={`${styles.rowTitle} text-[15px] font-medium leading-tight`}>
              {project.name}
            </span>
            <dl className={styles.receiptReadings}>
              {project.receipts?.map((receipt) => (
                <div key={`${receipt.label}-${receipt.value}`} className={styles.receiptReading}>
                  <dt className={styles.receiptLabel}>{receipt.label}</dt>
                  <dd className={styles.receiptValue}>{receipt.value}</dd>
                </div>
              ))}
            </dl>
          </button>
        ))}
      </div>
    </section>
  )
}
