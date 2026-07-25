'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { Source } from '@/lib/instruments/types'
import { safeHref } from '@/lib/instruments/href'
import { useAudit } from '@/components/instruments/AuditProvider'
import { attr, type InstrumentNodeProps } from '@/components/instruments/annotation-props'
import { INSTRUMENT_SENTINEL } from '@/components/instruments/sentinel'

/** Where a card is allowed to open: the end of whatever block of prose cites it. */
const BLOCK_SELECTOR = 'p, li, blockquote, figcaption, h1, h2, h3, h4, h5, h6'

/**
 * The block-level box a card is portalled into, appended to the end of the paragraph that
 * cites it and torn down with the card.
 *
 * Two problems, one answer. A card rendered where its marker sits is a block box in the middle
 * of a paragraph, so opening a note below the margin breakpoint cuts its own sentence in half
 * and leaves the remainder starting a fresh line with a bare full stop. And when the marked
 * span ends inside a link, that same position puts a button and a set of source links inside
 * an `<a>` — nested interactive content, where a click on either can navigate instead. Moving
 * the card to the end of the block fixes both, and moves nothing else: the card is portalled,
 * not copied, so there is still exactly one of it for Find and for a screen reader.
 */
function useCardSlot(marker: HTMLElement | null): HTMLElement | null {
  const [slot, setSlot] = useState<HTMLElement | null>(null)

  useLayoutEffect(() => {
    const block = marker?.closest(BLOCK_SELECTOR)
    if (!block) return

    const host = document.createElement('span')
    host.className = 'tg-annotation-slot'
    block.appendChild(host)
    setSlot(host)

    return () => {
      host.remove()
      setSlot(null)
    }
  }, [marker])

  return slot
}

interface AnnotationCardProps {
  id: string
  /** The colour this card is keyed to — a mark kind's token, or the piece accent. */
  tone: string
  kicker: string
  body: string
  sources?: Source[]
  marker: HTMLElement | null
  onClose: () => void
}

/**
 * One pinned card. It lives inside the annotated span rather than in a separate margin layer,
 * so there is exactly one copy of the text in the document: on a wide screen the packer gives
 * it a `top` and the stylesheet floats it into the margin, and below that width it stays where
 * it is and opens in place under the line. Nothing is duplicated and nothing is hidden from
 * Find or from a screen reader.
 */
export function AnnotationCard({
  id,
  tone,
  kicker,
  body,
  sources,
  marker,
  onClose,
}: AnnotationCardProps) {
  const { registerNote } = useAudit()
  const cardRef = useRef<HTMLSpanElement>(null)
  const slot = useCardSlot(marker)

  // A layout effect, not a passive one: the packer runs in a layout effect of its own, and a
  // card that registers after it has already run sits at whatever position the stylesheet gave
  // it until something else triggers a repack.
  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card || !marker) return
    registerNote(id, { marker, card })
    return () => registerNote(id, null)
  }, [id, marker, slot, registerNote])

  // A pinned card is a disclosure, and Escape closes a disclosure. The marker's own
  // `aria-expanded` already promises that; this keeps the promise for a reader who never
  // reaches the Dismiss button.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  // Which line is this about. The leader line answers it at a glance; lighting the marker
  // answers it exactly, which is what a card the packer has pushed a long way down needs.
  const anchor = useCallback(
    (lit: boolean) => {
      if (!marker) return
      if (lit) marker.dataset.anchored = 'true'
      else delete marker.dataset.anchored
    },
    [marker],
  )

  useEffect(() => () => anchor(false), [anchor])

  if (!slot) return null

  return createPortal(
    <span
      ref={cardRef}
      role="note"
      className="tg-annotation-card"
      data-instrument={INSTRUMENT_SENTINEL}
      onMouseEnter={() => anchor(true)}
      onMouseLeave={() => anchor(false)}
      onFocus={() => anchor(true)}
      onBlur={() => anchor(false)}
    >
      <span className="tg-annotation-kicker" style={{ color: tone }}>
        {kicker}
      </span>
      <span className="tg-annotation-body">{body}</span>
      {sources && sources.length > 0 && (
        <span className="tg-annotation-sources">
          {sources.map((source) => {
            const href = safeHref(source.url)
            return href === null ? (
              <span key={source.url}>{source.title}</span>
            ) : (
              <a key={source.url} href={href} rel="noreferrer noopener" target="_blank">
                {source.title}
              </a>
            )
          })}
        </span>
      )}
      <button type="button" className="tg-annotation-close" onClick={onClose}>
        Dismiss
        <span className="sr-only"> this note</span>
      </button>
    </span>,
    slot,
  )
}

/**
 * A margin note's marker: a real button, numbered in document order. Activating it pins the
 * note beside the line; several may be pinned at once, which is the whole point of the
 * packing pass in `AuditProvider`.
 */
export function NoteMarker(props: InstrumentNodeProps) {
  const { notes, open, toggleNote, closeNote } = useAudit()
  const id = attr(props, 'data-note-id') ?? ''
  const last = attr(props, 'data-annotation-last') === 'true'
  const markerRef = useRef<HTMLButtonElement>(null)
  const note = notes.get(id)
  const isOpen = open.has(id)

  const onClose = useCallback(() => {
    closeNote(id)
    markerRef.current?.focus()
  }, [closeNote, id])

  if (!note || !last) {
    return <span className="tg-note-span">{props.children as ReactNode}</span>
  }

  return (
    <span className="tg-note-span" data-instrument={INSTRUMENT_SENTINEL}>
      {props.children as ReactNode}
      <button
        ref={markerRef}
        type="button"
        id={`note-${id}`}
        className="tg-note-marker"
        aria-expanded={isOpen}
        aria-label={`Note ${note.index}${note.label ? `: ${note.label}` : ''}`}
        onClick={() => toggleNote(id)}
      >
        {note.index}
      </button>
      {isOpen && (
        <AnnotationCard
          id={id}
          tone="var(--instrument-accent)"
          kicker={note.label ?? `Note ${note.index}`}
          body={note.body}
          sources={note.sources}
          marker={markerRef.current}
          onClose={onClose}
        />
      )}
    </span>
  )
}

/**
 * The notes again, in order, at the end of the piece. A margin note that only exists when a
 * reader thinks to click it is not a citation; this list is where the piece keeps its word,
 * and every entry links back to the line that cited it.
 */
export default function NotesList() {
  const { notes, noteOrder } = useAudit()
  if (noteOrder.length === 0) return null

  return (
    <section
      className="instrument-block tg-notes-list"
      aria-labelledby="margin-notes-heading"
      data-instrument={INSTRUMENT_SENTINEL}
    >
      <h2 id="margin-notes-heading" className="tg-instrument-label">
        Notes
      </h2>
      <ol className="mt-4 space-y-4">
        {noteOrder.map((id) => {
          const note = notes.get(id)
          if (!note) return null
          return (
            <li key={id} id={`note-entry-${id}`} className="grid grid-cols-[2rem_1fr] gap-2">
              <a
                href={`#note-${id}`}
                className="font-mono text-xs"
                style={{ color: 'var(--instrument-accent)' }}
                aria-label={`Back to note ${note.index} in the text`}
              >
                {note.index}.
              </a>
              <div>
                {note.label && (
                  <p className="font-mono text-[11px] tracking-[0.14em] text-text-3 uppercase">
                    {note.label}
                  </p>
                )}
                <p className="text-sm leading-relaxed text-text-2">{note.body}</p>
                {note.sources && note.sources.length > 0 && (
                  <p className="mt-1 flex flex-wrap gap-x-4 text-sm">
                    {note.sources.map((source) => {
                      const href = safeHref(source.url)
                      return href === null ? (
                        <span key={source.url} className="text-text-3">
                          {source.title}
                        </span>
                      ) : (
                        <a
                          key={source.url}
                          href={href}
                          rel="noreferrer noopener"
                          target="_blank"
                          className="underline underline-offset-4"
                          style={{ color: 'var(--instrument-accent)' }}
                        >
                          {source.title}
                        </a>
                      )
                    })}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
