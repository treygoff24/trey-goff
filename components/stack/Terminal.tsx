'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useOnceVisible, useReducedMotion, useTimeouts } from '@/components/stack/hooks'

export type TermLine = {
  /** 'cmd' lines type character-by-character behind a prompt; 'out' lines print whole. */
  t: 'cmd' | 'out'
  v: string
  /** color class for out lines: dim | ok | warn | bad | info | vio | box */
  c?: string
  /** prompt override for cmd lines (default "$ ") */
  p?: string
  /** delay in ms before the next line (out lines only) */
  d?: number
}

type Rendered = { line: TermLine; text: string }

function Line({ line, text, caret }: Rendered & { caret?: boolean }) {
  const caretEl = caret ? <span className="caret" /> : null
  if (line.t === 'cmd') {
    return (
      <span className="l cmd">
        <span className="p">{line.p ?? '$ '}</span>
        {text}
        {caretEl}
      </span>
    )
  }
  return (
    <span className={`l ${line.c ?? ''}`}>
      {text || (caret ? '' : ' ')}
      {caretEl}
    </span>
  )
}

export function Terminal({
  title,
  lines,
  autoplay = false,
}: {
  title: string
  lines: TermLine[]
  autoplay?: boolean
}) {
  const reduced = useReducedMotion()
  const { schedule, clearAll } = useTimeouts()
  const [rendered, setRendered] = useState<Rendered[]>([])
  const [caret, setCaret] = useState(false)
  const playedRef = useRef(false)

  const play = useCallback(() => {
    playedRef.current = true
    clearAll()
    if (reduced) {
      setRendered(lines.map((line) => ({ line, text: line.v })))
      setCaret(false)
      return
    }
    setRendered([])
    setCaret(true)
    let i = 0

    const nextLine = () => {
      const line = lines[i]
      if (!line) return
      i += 1
      if (line.t === 'cmd') {
        setRendered((r) => [...r, { line, text: '' }])
        let ci = 0
        const type = () => {
          if (ci >= line.v.length) {
            schedule(nextLine, 380)
            return
          }
          ci += 1
          const text = line.v.slice(0, ci)
          setRendered((r) => [...r.slice(0, -1), { line, text }])
          schedule(type, 16 + Math.random() * 26)
        }
        type()
      } else {
        setRendered((r) => [...r, { line, text: line.v }])
        schedule(nextLine, line.d ?? 130)
      }
    }
    nextLine()
  }, [clearAll, lines, reduced, schedule])

  // Autoplay terminals (the hero) start on mount; the rest wait for intersection.
  useEffect(() => {
    if (autoplay && !playedRef.current) play()
  }, [autoplay, play])

  // If the OS reduced-motion preference flips mid-playback, stop typing and
  // settle to the complete transcript immediately.
  useEffect(() => {
    if (reduced && playedRef.current) play()
  }, [reduced, play])

  const visRef = useOnceVisible<HTMLDivElement>(() => {
    if (!playedRef.current) play()
  })

  return (
    <div className="term" ref={visRef}>
      <div className="term-bar">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
        <span className="term-title">{title}</span>
        <button className="term-replay" type="button" onClick={play}>
          Replay
        </button>
      </div>
      <pre className="term-body" aria-live="off">
        {rendered.map((r, idx) => (
          // ponytail: index keys are fine — the list is append-only within a play
          <Line
            key={idx}
            line={r.line}
            text={r.text}
            caret={caret && idx === rendered.length - 1}
          />
        ))}
        {caret && rendered.length === 0 ? <span className="caret" /> : null}
      </pre>
    </div>
  )
}
