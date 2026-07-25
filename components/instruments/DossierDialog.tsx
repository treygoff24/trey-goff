'use client'

import { useEffect, useRef, useState, type ReactElement } from 'react'
import type { Root } from 'hast'
import { hastToReact } from '@/lib/instruments/hast-to-react'
import { useLedger } from '@/components/instruments/LedgerProvider'
import { closeDossier, focusClaim, useLedgerStore } from '@/components/instruments/ledger-store'
import { INSTRUMENT_SENTINEL } from '@/components/instruments/sentinel'

interface DossierPanel {
  title: string
  content: ReactElement
}

interface DossierResponse {
  title: string
  hast: Root
}

/**
 * The findings open beside the claim rather than instead of it: a native `<dialog>`, so the
 * browser handles the focus trap, Escape, and returning focus to whatever opened it. Claim
 * ids inside the text are buttons that close the panel and take the reader to the row.
 *
 * The bodies are fetched when a dossier is first opened, not shipped with the page. They are
 * supplementary by construction — every claim states its verdict and reasoning in its own row
 * — and rendering all of them into the article cost every reader eighty kilobytes of findings
 * most of them never open. What arrives is the sanitized tree, compiled to React here; no
 * markup is ever assembled from a string.
 */
export default function DossierDialog({ slug }: { slug: string }) {
  const { model } = useLedger()
  const open = useLedgerStore((state) => state.dossier)
  const ref = useRef<HTMLDialogElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const cache = useRef(new Map<string, DossierPanel>())
  const [panel, setPanel] = useState<DossierPanel | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      if (bodyRef.current) bodyRef.current.scrollTop = 0
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (!open) return
    setFailed(false)

    const cached = cache.current.get(open)
    if (cached) {
      setPanel(cached)
      return
    }

    let cancelled = false
    setPanel(null)
    void fetch(`/api/instruments/${encodeURIComponent(slug)}/${encodeURIComponent(open)}`)
      .then((response) => {
        if (!response.ok) throw new Error(`dossier ${open} returned ${response.status}`)
        return response.json() as Promise<DossierResponse>
      })
      .then((data) => {
        if (cancelled) return
        const loaded = { title: data.title, content: hastToReact(data.hast) }
        cache.current.set(open, loaded)
        setPanel(loaded)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [open, slug])

  // Claim references and the backdrop are both handled by delegation on the live nodes: the
  // references are real buttons the browser already activates from the keyboard, and the
  // dialog handles Escape itself.
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    const onClick = (event: globalThis.MouseEvent) => {
      if (event.target === dialog) {
        closeDossier()
        return
      }
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-claim-ref]')
      const id = target?.dataset.claimRef
      if (id) focusClaim(id, model.byId.get(id))
    }

    dialog.addEventListener('click', onClick)
    return () => dialog.removeEventListener('click', onClick)
  }, [model.byId])

  const title = panel?.title ?? (open ? open.replace(/-/g, ' ') : '')

  return (
    <dialog
      ref={ref}
      data-instrument={INSTRUMENT_SENTINEL}
      aria-label={title ? `Finding: ${title}` : 'Finding'}
      onClose={closeDossier}
      onCancel={closeDossier}
      className="tg-dossier instrument-scope ml-auto h-dvh max-h-none w-full max-w-[min(46rem,100vw)] border-l border-border-2 bg-bg-1 p-0 text-text-1"
    >
      {open && (
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-border-1 px-6 py-4">
            <div>
              <p className="tg-instrument-label">Finding</p>
              <h2 className="mt-1 font-newsreader text-xl leading-snug font-medium text-text-1">
                {title}
              </h2>
            </div>
            <button type="button" className="tg-action-secondary shrink-0" onClick={closeDossier}>
              Close
            </button>
          </div>
          <div
            ref={bodyRef}
            className="prose tg-scroll max-w-none overflow-y-auto px-6 py-6"
            aria-busy={panel === null && !failed}
          >
            {panel?.content ?? (
              <p className="text-sm text-text-2" role="status">
                {failed ? 'That finding could not be loaded.' : 'Loading the finding…'}
              </p>
            )}
          </div>
        </div>
      )}
    </dialog>
  )
}
