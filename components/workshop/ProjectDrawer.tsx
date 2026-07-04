'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { DISCIPLINE_LABELS, getProject, type Project } from '@/lib/projects'
import styles from './workshop.module.css'

type ProjectDrawerProps = {
  project: Project | null
  onClose: () => void
  onSelectProject: (id: string) => void
}

const lineageChipClass =
  'cursor-pointer border border-border-2 px-2 py-1 text-left font-mono text-[11px] tracking-[0.1em] text-warm transition hover:border-warm hover:bg-[color-mix(in_oklab,var(--color-warm)_8%,transparent)] hover:text-text-1 focus-visible:border-warm focus-visible:text-text-1'

const linkLabels = {
  github: 'GitHub',
  site: 'Site',
} as const

function externalHref(value: string): string | null {
  if (/^https?:\/\//.test(value)) return value
  return value.match(/https?:\/\/\S+/)?.[0] ?? null
}

function InstallCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false)
  const resetRef = useRef(0)

  useEffect(() => () => window.clearTimeout(resetRef.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      window.clearTimeout(resetRef.current)
      resetRef.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be unavailable (permissions, insecure context); the
      // command stays selectable by hand.
    }
  }

  return (
    <section className="mt-8" aria-label="Install command">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-text-3">Install</p>
      <div className="flex items-stretch border border-border-1">
        <code className="min-w-0 flex-1 whitespace-pre-wrap [overflow-wrap:anywhere] px-3 py-2.5 font-mono text-xs leading-5 text-text-2">
          {/* <wbr> after each slash lets long URLs wrap at path boundaries
              instead of mid-token; overflow-wrap:anywhere stays as the
              fallback when a single segment still overflows. */}
          {command.split(/(?<=\/)(?!\/)/).map((segment, index, segments) => (
            <Fragment key={index}>
              {segment}
              {index < segments.length - 1 ? <wbr /> : null}
            </Fragment>
          ))}
        </code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 border-l border-border-1 px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-warm transition hover:bg-[color-mix(in_oklab,var(--color-warm)_8%,transparent)] hover:text-text-1"
        >
          {copied ? 'Copied' : 'Copy'}
          <span aria-live="polite" className="sr-only">
            {copied ? 'Install command copied to clipboard' : ''}
          </span>
        </button>
      </div>
    </section>
  )
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

function shippedLabel(project: Project): string {
  const match = project.shippedAt.match(/^(\d{4})-(\d{2})/)
  const label = match ? `${MONTH_NAMES[Number(match[2]) - 1]} ${match[1]}` : String(project.year)
  return project.dateApprox ? `~ ${label}` : label
}

function lineageTargets(ids: readonly string[] | undefined): readonly Project[] {
  return (ids ?? []).map((id) => getProject(id)).filter((project): project is Project => !!project)
}

export function ProjectDrawer({ project, onClose, onSelectProject }: ProjectDrawerProps) {
  const [mounted, setMounted] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const closingProjectIdRef = useRef<string | null>(null)
  const hasOpenedRef = useRef(false)
  const nextProjectRef = useRef<string | null>(null)

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

    const isProjectSwap = nextProjectRef.current === project.id
    if (!isProjectSwap) previousFocusRef.current = document.activeElement as HTMLElement | null
    closingProjectIdRef.current = project.id
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (isProjectSwap) {
      if (panelRef.current) panelRef.current.scrollTop = 0
      titleRef.current?.focus({ preventScroll: true })
      nextProjectRef.current = null
    } else {
      closeButtonRef.current?.focus()
    }

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
      const activeIndex = focusable.indexOf(active as HTMLElement)
      if (activeIndex === -1) {
        // The focused element is inside the panel but not in the standard Tab
        // sequence (e.g. the titled h2 with tabIndex={-1}). Wrap focus instead
        // of letting Tab escape into the background.
        event.preventDefault()
        if (event.shiftKey) last.focus()
        else first.focus()
        return
      }
      if (event.shiftKey && activeIndex === 0) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && activeIndex === focusable.length - 1) {
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
      const nextProjectId = nextProjectRef.current
      if (nextProjectId && nextProjectId !== closingId) return

      const restoreFocus = () => {
        if (
          previous &&
          previous.isConnected &&
          previous !== document.body &&
          !previous.hasAttribute('data-workshop-panel')
        ) {
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
      window.setTimeout(restoreFocus, 0)
    }
  }, [project, onClose])

  if (!mounted || !project) return null

  const { install, ...urlLinks } = project.links ?? {}
  const links = Object.entries(urlLinks) as Array<[keyof typeof linkLabels, string]>
  const descends = lineageTargets(project.lineage?.descends)
  const builtWith = lineageTargets(project.lineage?.builtWith)
  const hasLineage = descends.length > 0 || builtWith.length > 0

  const selectProject = (id: string) => {
    nextProjectRef.current = id
    onSelectProject(id)
  }

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
              ref={titleRef}
              id="project-drawer-title"
              tabIndex={-1}
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
              ref={titleRef}
              id="project-drawer-title"
              tabIndex={-1}
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

            {install ? <InstallCommand key={project.id} command={install} /> : null}

            {hasLineage ? (
              <div className="mt-8 space-y-4" aria-label="Lineage">
                {descends.length ? (
                  <div>
                    <p className="mb-2 font-mono text-[11px] tracking-[0.12em] text-text-3">
                      descends from
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {descends.map((target) => (
                        <button
                          key={target.id}
                          type="button"
                          className={lineageChipClass}
                          onClick={() => selectProject(target.id)}
                        >
                          {target.name} →
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {builtWith.length ? (
                  <div>
                    <p className="mb-2 font-mono text-[11px] tracking-[0.12em] text-text-3">
                      built with
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {builtWith.map((target) => (
                        <button
                          key={target.id}
                          type="button"
                          className={lineageChipClass}
                          onClick={() => selectProject(target.id)}
                        >
                          {target.name} →
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <section className={`mt-8 ${styles.drawerRule} pt-6`} aria-label="Project facts">
              <dl className="flex items-baseline justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.14em]">
                <dt className="text-text-3">Ship date</dt>
                <dd className="text-text-2">{shippedLabel(project)}</dd>
              </dl>
              {project.tags?.length ? (
                <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
                  {project.tags.map((tag) => (
                    <li
                      key={tag}
                      className="border border-border-1 px-2 py-1 font-mono text-[11px] tracking-[0.1em] text-text-3"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : null}
              {!links.length && !install ? (
                <p className="mt-5 text-sm leading-6 text-text-3">
                  No public links for this one yet.
                </p>
              ) : null}
            </section>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
