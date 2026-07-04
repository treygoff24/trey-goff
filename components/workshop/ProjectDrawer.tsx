'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { DISCIPLINE_LABELS, type Project } from '@/lib/projects'
import styles from './workshop.module.css'

type ProjectDrawerProps = {
  project: Project | null
  onClose: () => void
}

const linkLabels = {
  github: 'GitHub',
  site: 'Site',
  install: 'Install',
} as const

function externalHref(value: string): string | null {
  if (/^https?:\/\//.test(value)) return value
  return value.match(/https?:\/\/\S+/)?.[0] ?? null
}

function lineageChips(project: Project): string[] {
  return [...(project.lineage?.descends ?? []), ...(project.lineage?.builtWith ?? [])]
}

export function ProjectDrawer({ project, onClose }: ProjectDrawerProps) {
  const [mounted, setMounted] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const closingProjectIdRef = useRef<string | null>(null)
  const hasOpenedRef = useRef(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (project) hasOpenedRef.current = true
    if (!project && !hasOpenedRef.current) return

    const url = new URL(window.location.href)
    if (project) {
      url.searchParams.set('p', project.id)
    } else {
      url.searchParams.delete('p')
    }
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }, [project])

  useEffect(() => {
    if (!project) return

    previousFocusRef.current = document.activeElement as HTMLElement | null
    closingProjectIdRef.current = project.id
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const getFocusable = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => !element.hasAttribute('disabled'))

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = getFocusable()
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) {
        event.preventDefault()
        return
      }

      const active = document.activeElement
      if (!panelRef.current?.contains(active)) {
        event.preventDefault()
        first.focus()
        return
      }
      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow

      const previous = previousFocusRef.current
      previousFocusRef.current = null
      const closingId = closingProjectIdRef.current
      closingProjectIdRef.current = null

      const restoreFocus = () => {
        if (previous && previous.isConnected && previous !== document.body) {
          previous.focus()
          return
        }
        if (closingId) {
          const row = document.querySelector<HTMLElement>(`[data-workshop-project="${closingId}"]`)
          if (row) {
            row.focus()
            return
          }
        }
        const activeTab = document.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
        if (activeTab) {
          activeTab.focus()
        }
      }

      restoreFocus()
    }
  }, [project, onClose])

  if (!mounted || !project) return null

  const links = Object.entries(project.links ?? {}) as Array<[keyof typeof linkLabels, string]>
  const chips = lineageChips(project)

  return createPortal(
    // z-[80] is the shared drawer/modal layer — AuroraLibrary's detail drawer
    // uses the same value so the two site drawers never stack above each other.
    <div
      className="fixed inset-0 z-[80]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-drawer-title"
    >
      <button
        type="button"
        aria-label="Close project details"
        className={styles.drawerBackdrop}
        onClick={onClose}
      />
      <div ref={panelRef} className={`tg-scroll ${styles.drawerPanel}`}>
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="mb-6 ml-auto grid h-9 w-9 place-items-center rounded-full border border-border-1 text-text-2 transition hover:border-warm hover:text-warm"
        >
          ×
        </button>

        {project.sealed ? (
          <>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-text-3">
              {project.year} · {DISCIPLINE_LABELS[project.discipline]}
            </p>
            <h2
              id="project-drawer-title"
              className="font-newsreader text-4xl font-medium leading-tight text-text-1"
            >
              Sealed project
            </h2>
            <p className="mt-5 text-base leading-7 text-text-2">{project.sealedNote}</p>
            <p className="mt-8 border-t border-border-1 pt-6 text-sm leading-6 text-text-3">
              Some work is real and cannot be shown.
            </p>
          </>
        ) : (
          <>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-text-3">
              {DISCIPLINE_LABELS[project.discipline]} · {project.status}
            </p>
            <h2
              id="project-drawer-title"
              className="font-newsreader text-4xl font-medium leading-tight text-text-1"
            >
              {project.name}
            </h2>
            <p className="mt-4 text-base leading-7 text-text-2">{project.oneLiner}</p>

            {project.note ? (
              <p className="mt-7 border-t border-border-1 pt-6 text-sm leading-7 text-text-2">
                {project.note}
              </p>
            ) : null}

            {project.receipts?.length ? (
              <section className={`mt-8 ${styles.drawerRule}`} aria-label="Receipts">
                <dl>
                  {project.receipts.map((receipt) => (
                    <div
                      key={`${receipt.label}-${receipt.value}`}
                      className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-border-1 py-3"
                    >
                      <dt className="text-sm text-text-2">{receipt.label}</dt>
                      <dd className="font-mono text-sm text-warm">{receipt.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            {links.length ? (
              <nav className="mt-8 flex flex-wrap gap-3" aria-label="Project links">
                {links.map(([kind, value]) => {
                  const href = externalHref(value)
                  return href ? (
                    <a
                      key={kind}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs uppercase tracking-[0.16em] text-warm underline decoration-border-2 underline-offset-4 transition hover:text-text-1"
                    >
                      {linkLabels[kind]} →
                    </a>
                  ) : null
                })}
              </nav>
            ) : null}

            {chips.length ? (
              <div className="mt-8 flex flex-wrap gap-2" aria-label="Lineage">
                {chips.map((chip) => (
                  <span
                    key={chip}
                    className="border border-border-1 px-2 py-1 font-mono text-[11px] tracking-[0.1em] text-text-3"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
