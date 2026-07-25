'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Confidence, Stat as StatData } from '@/lib/instruments/types'
import { useAudit } from '@/components/instruments/AuditProvider'
import { nodeId, type InstrumentNodeProps } from '@/components/instruments/annotation-props'
import { INSTRUMENT_SENTINEL } from '@/components/instruments/sentinel'

const CONFIDENCE_COPY: Record<Confidence, string> = {
  firm: 'Firm — the figure is stated directly by the source.',
  estimated: 'Estimated — derived or interpolated, not read off a source.',
  contested: 'Contested — sources disagree and the disagreement is described below.',
}

/**
 * A figure that carries its own provenance. The number reads as part of the sentence; the
 * dialog behind it holds the derivation, the confidence, and the sources — which is the
 * difference between a stat a reader can check and one they have to take on trust.
 *
 * The panel is a native `<dialog>`, portalled to the body because a stat is inline inside a
 * paragraph and a dialog is not phrasing content.
 */
function StatDialog({ stat, onClose }: { stat: StatData; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  // The backdrop is listened to on the live node rather than through an `onClick` prop: a
  // click handler on the dialog element itself reads as a click handler on non-interactive
  // markup, and the browser already gives us Escape and the focus trap for free.
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()

    const onClick = (event: globalThis.MouseEvent) => {
      if (event.target === dialog) onClose()
    }
    dialog.addEventListener('click', onClick)
    return () => dialog.removeEventListener('click', onClick)
  }, [onClose])

  return (
    <dialog
      ref={ref}
      className="tg-stat-dialog instrument-scope"
      aria-labelledby={`stat-dialog-${stat.id}`}
      onClose={onClose}
      onCancel={onClose}
      data-instrument={INSTRUMENT_SENTINEL}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border-1 px-6 py-4">
        <div>
          <p className="tg-instrument-label">Sources and details</p>
          <h2
            id={`stat-dialog-${stat.id}`}
            className="mt-1 font-newsreader text-xl leading-snug font-medium text-text-1"
          >
            {stat.value} — {stat.label}
          </h2>
        </div>
        <button type="button" className="tg-action-secondary shrink-0" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="tg-scroll space-y-5 overflow-y-auto px-6 py-5">
        {stat.detail && (
          <div>
            <p className="tg-instrument-label">Derivation</p>
            <p className="mt-1 text-sm leading-relaxed text-text-2">{stat.detail}</p>
          </div>
        )}

        <div>
          <p className="tg-instrument-label">Confidence</p>
          <p className="mt-1 text-sm leading-relaxed text-text-2">
            {CONFIDENCE_COPY[stat.confidence]}
          </p>
        </div>

        <div>
          <p className="tg-instrument-label">Sources</p>
          <ul className="mt-2 space-y-3">
            {stat.sources.map((source) => (
              <li key={source.url} className="border-l border-border-2 pl-3">
                <a
                  href={source.url}
                  rel="noreferrer noopener"
                  target="_blank"
                  className="text-sm underline underline-offset-4"
                  style={{ color: 'var(--instrument-accent)' }}
                >
                  {source.title}
                </a>
                {source.quote && (
                  <p className="mt-1 text-sm leading-relaxed text-text-3 italic">
                    “{source.quote}”
                  </p>
                )}
                {source.retrieved && (
                  <p className="mt-1 font-mono text-[11px] text-text-3">
                    retrieved {source.retrieved}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </dialog>
  )
}

export default function Stat(props: InstrumentNodeProps) {
  const { stats } = useAudit()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const id = nodeId(props) ?? ''
  const stat = stats.get(id)

  useEffect(() => setMounted(true), [])

  if (!stat) return null

  return (
    <span className="tg-stat" data-instrument={INSTRUMENT_SENTINEL}>
      <button
        type="button"
        className="tg-stat-button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <span className="tg-stat-value">{stat.value}</span>
        <span className="tg-stat-label">{stat.label}</span>
        <span className="sr-only"> — open sources and details</span>
      </button>
      {open &&
        mounted &&
        createPortal(<StatDialog stat={stat} onClose={() => setOpen(false)} />, document.body)}
    </span>
  )
}
