'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  MARK_KINDS,
  type Chart,
  type ForecastCard,
  type MarginNote,
  type Mark,
  type MarkKind,
  type Stat,
} from '@/lib/instruments/types'
import { INSTRUMENT_SENTINEL } from '@/components/instruments/sentinel'

/** Everything an audited piece ships alongside its prose, as authored. */
export interface PieceInstruments {
  marks: Mark[]
  notes: MarginNote[]
  /** Note ids in document order, decided by the anchoring pass, not by the authoring file. */
  noteOrder: string[]
  stats: Stat[]
  forecasts: ForecastCard[]
  charts: Chart[]
}

export interface NumberedNote extends MarginNote {
  index: number
}

interface NoteSlot {
  marker: HTMLElement
  card: HTMLElement
}

interface AuditContextValue {
  marks: Mark[]
  notes: Map<string, NumberedNote>
  noteOrder: string[]
  stats: Map<string, Stat>
  forecasts: Map<string, ForecastCard>
  charts: Map<string, Chart>
  open: ReadonlySet<string>
  toggleNote: (id: string) => void
  closeNote: (id: string) => void
  registerNote: (id: string, slot: NoteSlot | null) => void
  /** Mark kinds currently raised above the others. Empty means every kind reads the same. */
  lit: ReadonlySet<MarkKind>
  toggleKind: (kind: MarkKind) => void
  setAllKinds: (on: boolean) => void
  /** True once the viewport is wide enough for a margin column; below it notes open in place. */
  margin: boolean
}

const AuditContext = createContext<AuditContextValue | null>(null)

export function useAudit(): AuditContextValue {
  const value = useContext(AuditContext)
  if (!value) throw new Error('audit instruments must render inside <AuditProvider>')
  return value
}

/** The width at which the margin column appears — opus-5's 72rem, in its own terms. */
const MARGIN_QUERY = '(min-width: 72rem)'
/** Vertical breathing room between two notes the packer has had to push apart. */
const NOTE_GAP = 12

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/**
 * Interval packing over the open notes.
 *
 * Each note wants to sit level with the line that cites it. Several notes citing lines a few
 * pixels apart want the same strip of margin, so the pass walks them in document order and
 * pushes each one down to clear the previous note's box. That is the whole reason more than
 * one note can be pinned at a time — the static reference could only ever show one, because
 * without this pass the second note paints on top of the first.
 *
 * Runs in a layout effect so the reader never sees the unpacked positions.
 */
function useNotePacking(open: ReadonlySet<string>, margin: boolean) {
  const slots = useRef(new Map<string, NoteSlot>())

  const registerNote = useCallback((id: string, slot: NoteSlot | null) => {
    if (slot) slots.current.set(id, slot)
    else slots.current.delete(id)
  }, [])

  const pack = useCallback(() => {
    const opened = [...slots.current.entries()].filter(([id]) => open.has(id))

    if (!margin) {
      for (const [, slot] of opened) {
        slot.card.style.top = ''
        slot.card.style.insetInlineStart = ''
      }
      return
    }

    // Where the margin begins: the right edge of the prose as it is actually set, not a `65ch`
    // guess. `ch` is measured against the flow's own font, and the reading column is set in the
    // serif — so the two disagree by enough to drop every note on top of the text.
    const measured = document.querySelector('.instrument-flow > p')
    const start =
      measured === null ? null : `${Math.round(measured.getBoundingClientRect().width + 32)}px`

    // Document order, measured rather than declared: mark notes and margin notes share the
    // margin and the anchoring pass numbers only the latter.
    const placed = opened
      .map(([, slot]) => ({ slot, top: slot.marker.getBoundingClientRect().top }))
      .sort((a, b) => a.top - b.top)

    let cursor = -Infinity
    for (const { slot, top: markerTop } of placed) {
      const layer = slot.card.offsetParent
      if (!(layer instanceof HTMLElement)) continue

      const desired = markerTop - layer.getBoundingClientRect().top
      if (start !== null) slot.card.style.insetInlineStart = start
      const top = Math.max(desired, cursor + NOTE_GAP)
      slot.card.style.top = `${Math.round(top)}px`
      cursor = top + slot.card.offsetHeight
    }
  }, [open, margin])

  useLayoutEffect(() => {
    pack()
    const layer = document.getElementById('essay-content')
    if (!layer) return
    const observer = new ResizeObserver(() => pack())
    observer.observe(layer)
    return () => observer.disconnect()
  }, [pack])

  return registerNote
}

interface AuditProviderProps extends PieceInstruments {
  children: ReactNode
}

/**
 * Holds the piece's annotation data and the set of notes currently pinned. It is deliberately
 * separate from the ledger provider: an audited essay has no claims, and a claims ledger has
 * no margin notes, but a piece may one day carry both.
 */
export default function AuditProvider({
  marks,
  notes,
  noteOrder,
  stats,
  forecasts,
  charts,
  children,
}: AuditProviderProps) {
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set())
  const [lit, setLit] = useState<ReadonlySet<MarkKind>>(() => new Set())
  const margin = useMediaQuery(MARGIN_QUERY)
  const registerNote = useNotePacking(open, margin)

  const toggleNote = useCallback((id: string) => {
    setOpen((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }, [])

  const closeNote = useCallback((id: string) => {
    setOpen((current) => {
      if (!current.has(id)) return current
      const next = new Set(current)
      next.delete(id)
      return next
    })
  }, [])

  const toggleKind = useCallback((kind: MarkKind) => {
    setLit((current) => {
      const next = new Set(current)
      if (!next.delete(kind)) next.add(kind)
      return next
    })
  }, [])

  const setAllKinds = useCallback((on: boolean) => {
    setLit(on ? new Set(MARK_KINDS) : new Set())
  }, [])

  const value = useMemo<AuditContextValue>(() => {
    const numbered = new Map<string, NumberedNote>()
    for (const note of notes) {
      const index = noteOrder.indexOf(note.id)
      if (index !== -1) numbered.set(note.id, { ...note, index: index + 1 })
    }

    return {
      marks,
      notes: numbered,
      noteOrder,
      stats: new Map(stats.map((stat) => [stat.id, stat])),
      forecasts: new Map(forecasts.map((card) => [card.id, card])),
      charts: new Map(charts.map((chart) => [chart.id, chart])),
      open,
      toggleNote,
      closeNote,
      registerNote,
      lit,
      toggleKind,
      setAllKinds,
      margin,
    }
  }, [
    marks,
    notes,
    noteOrder,
    stats,
    forecasts,
    charts,
    open,
    toggleNote,
    closeNote,
    registerNote,
    lit,
    toggleKind,
    setAllKinds,
    margin,
  ])

  return (
    <AuditContext.Provider value={value}>
      <div data-instrument={INSTRUMENT_SENTINEL}>{children}</div>
    </AuditContext.Provider>
  )
}
