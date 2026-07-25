'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { useLedger } from '@/components/instruments/LedgerProvider'
import { closeDossier, focusClaim, useLedgerStore } from '@/components/instruments/ledger-store'
import { INSTRUMENT_SENTINEL } from '@/components/instruments/sentinel'

export interface DossierPanel {
  slug: string
  title: string
  content: ReactNode
}

/**
 * The findings open beside the claim rather than instead of it: a native `<dialog>`, so the
 * browser handles the focus trap, Escape, and returning focus to whatever opened it. Claim
 * ids inside the text are buttons that close the panel and take the reader to the row.
 */
export default function DossierDialog({ dossiers }: { dossiers: DossierPanel[] }) {
  const { model } = useLedger()
  const open = useLedgerStore((state) => state.dossier)
  const ref = useRef<HTMLDialogElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      if (bodyRef.current) bodyRef.current.scrollTop = 0
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

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

  const panel = dossiers.find((entry) => entry.slug === open)

  return (
    <dialog
      ref={ref}
      data-instrument={INSTRUMENT_SENTINEL}
      aria-label={panel ? `Finding: ${panel.title}` : 'Finding'}
      onClose={closeDossier}
      onCancel={closeDossier}
      className="tg-dossier instrument-scope ml-auto h-dvh max-h-none w-full max-w-[min(46rem,100vw)] border-l border-border-2 bg-bg-1 p-0 text-text-1"
    >
      {panel && (
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-border-1 px-6 py-4">
            <div>
              <p className="tg-instrument-label">Finding</p>
              <h2 className="mt-1 font-newsreader text-xl leading-snug font-medium text-text-1">
                {panel.title}
              </h2>
            </div>
            <button type="button" className="tg-action-secondary shrink-0" onClick={closeDossier}>
              Close
            </button>
          </div>
          <div ref={bodyRef} className="prose tg-scroll max-w-none overflow-y-auto px-6 py-6">
            {panel.content}
          </div>
        </div>
      )}
    </dialog>
  )
}
