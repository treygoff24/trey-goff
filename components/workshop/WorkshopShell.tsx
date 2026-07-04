'use client'

import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { type Project } from '@/lib/projects'
import { ProjectDrawer } from './ProjectDrawer'
import styles from './workshop.module.css'

type Lens = 'bench' | 'lineage' | 'ledger'

type WorkshopShellProps = {
  projects: readonly Project[]
  bench: ReactNode
  lineage: ReactNode
  ledger: ReactNode
}

const lenses: Array<{ key: Lens; label: string }> = [
  { key: 'bench', label: 'Bench' },
  { key: 'lineage', label: 'Lineage' },
  { key: 'ledger', label: 'Ledger' },
]

const lensKeys = new Set(lenses.map((item) => item.key))
const initialLensFlags: Record<Lens, boolean> = {
  bench: true,
  lineage: false,
  ledger: false,
}
const initialAnimatedFlags: Record<Lens, boolean> = {
  bench: false,
  lineage: false,
  ledger: false,
}

function lensFromHash(hash: string): Lens | null {
  const key = hash.replace(/^#/, '')
  return lensKeys.has(key as Lens) ? (key as Lens) : null
}

function replaceHash(lens: Lens) {
  const url = new URL(window.location.href)
  url.hash = lens
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
}

export function WorkshopShell({ projects, bench, lineage, ledger }: WorkshopShellProps) {
  const [hydrated, setHydrated] = useState(false)
  const [lens, setLens] = useState<Lens>('bench')
  const [revealed, setRevealed] = useState<Record<Lens, boolean>>(initialLensFlags)
  const [animated, setAnimated] = useState<Record<Lens, boolean>>(initialAnimatedFlags)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedIdRef = useRef<string | null>(null)
  const shellRef = useRef<HTMLDivElement | null>(null)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const reduceMotion = useReducedMotion()

  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  )
  const selectedProject = selectedId ? (projectsById.get(selectedId) ?? null) : null

  const setSelectedIdTracked = useCallback((id: string | null) => {
    selectedIdRef.current = id
    setSelectedId(id)
  }, [])

  const revealLens = useCallback((nextLens: Lens) => {
    setLens(nextLens)
    setRevealed((current) => (current[nextLens] ? current : { ...current, [nextLens]: true }))
  }, [])

  const selectLens = useCallback(
    (nextLens: Lens) => {
      revealLens(nextLens)
      replaceHash(nextLens)
    },
    [revealLens],
  )

  const openProject = useCallback(
    (id: string) => {
      if (projectsById.has(id)) setSelectedIdTracked(id)
    },
    [projectsById, setSelectedIdTracked],
  )

  const closeProject = useCallback(() => setSelectedIdTracked(null), [setSelectedIdTracked])

  useEffect(() => {
    setHydrated(true)

    const applyLocation = () => {
      const nextLens = lensFromHash(window.location.hash)
      if (nextLens) revealLens(nextLens)

      // Legacy anchors (e.g. /projects#the-control-room from wikilinks) open the drawer.
      const hashId = window.location.hash.replace(/^#/, '')
      if (!nextLens && projectsById.has(hashId)) {
        setSelectedIdTracked(hashId)
        return
      }

      const projectId = new URLSearchParams(window.location.search).get('p')
      if (projectId && projectsById.has(projectId)) {
        setSelectedIdTracked(projectId)
      } else {
        if (projectId) {
          const url = new URL(window.location.href)
          url.searchParams.delete('p')
          window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
        }
        if (selectedIdRef.current !== null) setSelectedIdTracked(null)
      }
    }

    applyLocation()
    window.addEventListener('hashchange', applyLocation)
    window.addEventListener('popstate', applyLocation)
    return () => {
      window.removeEventListener('hashchange', applyLocation)
      window.removeEventListener('popstate', applyLocation)
    }
  }, [projectsById, revealLens, setSelectedIdTracked])

  useEffect(() => {
    if (!hydrated || animated[lens]) return
    const timeout = window.setTimeout(
      () => setAnimated((current) => ({ ...current, [lens]: true })),
      lens === 'ledger' ? 1500 : 650,
    )
    return () => window.clearTimeout(timeout)
  }, [animated, hydrated, lens])

  useEffect(() => {
    const shell = shellRef.current
    if (!shell) return

    const onClick = (event: globalThis.MouseEvent) => {
      if (!(event.target instanceof HTMLElement)) return
      const trigger = event.target.closest<HTMLElement>('[data-workshop-project]')
      if (!trigger || !shell.contains(trigger)) return
      const id = trigger.dataset.workshopProject
      if (id) openProject(id)
    }

    shell.addEventListener('click', onClick)
    return () => shell.removeEventListener('click', onClick)
  }, [openProject])

  const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = lenses.findIndex((item) => item.key === lens)
    let nextIndex = currentIndex

    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % lenses.length
    else if (event.key === 'ArrowLeft')
      nextIndex = (currentIndex - 1 + lenses.length) % lenses.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = lenses.length - 1
    else return

    event.preventDefault()
    const nextLens = lenses[nextIndex]?.key ?? 'bench'
    selectLens(nextLens)
    tabRefs.current[nextIndex]?.focus()
  }

  // Three-phase visibility contract. All three must change together:
  // 1. SSR / pre-hydration: .shell[data-hydrated='false'] hides every panel
  //    except bench via CSS, so the server render and the first paint never
  //    flash inactive lenses.
  // 2. Hydrated: the `hidden` attribute on each tabpanel is toggled by the
  //    active lens; React owns visibility once the tablist is interactive.
  // 3. No-JS: the <noscript> style force-shows all panels and hides the
  //    tablist, turning the page into a scrollable index.
  const panels: Record<Lens, ReactNode> = { bench, lineage, ledger }

  return (
    <div ref={shellRef} className={styles.shell} data-hydrated={hydrated ? 'true' : 'false'}>
      <div
        role="tablist"
        aria-label="Workshop lenses"
        className={`${styles.tabStrip} mt-12 grid grid-cols-2 gap-x-8 gap-y-3 border-b border-border-1 md:flex md:gap-10`}
        onKeyDown={onTabKeyDown}
      >
        {lenses.map((item, index) => {
          const active = lens === item.key
          return (
            <button
              key={item.key}
              ref={(node) => {
                tabRefs.current[index] = node
              }}
              type="button"
              role="tab"
              id={`workshop-tab-${item.key}`}
              aria-selected={active}
              aria-controls={`workshop-panel-${item.key}`}
              tabIndex={active ? 0 : -1}
              data-active={active ? 'true' : 'false'}
              className={styles.tab}
              onClick={() => selectLens(item.key)}
            >
              {item.label}
              {active ? (
                <motion.span
                  layoutId="workshop-tab-indicator"
                  className={styles.tabIndicator}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: 'easeOut' }}
                />
              ) : null}
            </button>
          )
        })}
      </div>

      {lenses.map((item) => (
        <section
          key={item.key}
          id={`workshop-panel-${item.key}`}
          role="tabpanel"
          aria-labelledby={`workshop-tab-${item.key}`}
          tabIndex={0}
          hidden={hydrated && lens !== item.key}
          data-workshop-panel={item.key}
          data-revealed={revealed[item.key] ? 'true' : 'false'}
          data-animate={
            hydrated && lens === item.key && revealed[item.key] && !animated[item.key]
              ? 'true'
              : 'false'
          }
          className={styles.tabpanel}
        >
          {panels[item.key]}
        </section>
      ))}

      <noscript>
        <style>{`section[data-workshop-panel]{display:block !important}[role="tablist"]{display:none}`}</style>
      </noscript>

      <ProjectDrawer
        project={selectedProject}
        onClose={closeProject}
        onSelectProject={openProject}
      />
    </div>
  )
}
