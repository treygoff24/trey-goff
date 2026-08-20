'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useOnceVisible, useReducedMotion, useTimeouts } from '@/components/stack/hooks'
import { CellGrid, Legend, fill, type Kind } from '@/components/jobsite/viz-shared'
import '@/components/jobsite/viz.css'

/* ── Beat 1 · the bench fills up ───────────────────────────────
   One bench, fifty-six spots, three moments of the same day. The
   middle of the piled-up bench dims because that is the measured
   behaviour of a context window, not a mood — the research behind
   it is hard mode's chapter 1. Analogy-first labels throughout. */

const COLS = 14
const SLOTS = 56

type StageKey = 'morning' | 'buried' | 'swept'

type Stage = {
  key: StageKey
  tab: string
  used: string
  runs: [Kind, number][]
  /** The pile only goes dim once there is a pile. */
  dims: boolean
  aria: string
  cap: { lead: string; body: string }
}

const STAGES: Stage[] = [
  {
    key: 'morning',
    tab: 'First thing',
    used: '5 of 56 spots',
    runs: [
      ['brief', 3],
      ['rules', 2],
    ],
    dims: false,
    aria: 'A bench of fifty-six spots with five taken: three for your brief and two for the site rules. Every block is bright.',
    cap: {
      lead: 'A clean bench.',
      body: ' Your brief and the site rules, and nothing else. Everything he knows this morning, he can see in front of him — so he finds all of it.',
    },
  },
  {
    key: 'buried',
    tab: 'By mid-afternoon',
    used: '48 of 56 spots',
    runs: [
      ['brief', 3],
      ['rules', 2],
      ['file', 12],
      ['talk', 17],
      ['dig', 14],
    ],
    dims: true,
    aria: 'The same bench with forty-eight of fifty-six spots taken: the brief, the rules, twelve blueprints he pulled, seventeen blocks of conversation and fourteen of paperwork he dug through. The blocks at the two ends stay bright and the long stretch in the middle is dim, showing what he has stopped finding.',
    cap: {
      lead: 'The bench is buried.',
      body: ' Blueprints he pulled, everything the two of you have said, paperwork he dug through. Now look at the middle: the newest blocks are bright, this morning’s brief is still bright, and the long stretch between them has gone dim. That is the stuff he stops finding — and the reason a good afternoon turns into "why did it get stupid?"',
    },
  },
  {
    key: 'swept',
    tab: 'After a sweep',
    used: '13 of 56 spots',
    runs: [
      ['brief', 3],
      ['rules', 2],
      ['note', 4],
      ['file', 4],
    ],
    dims: false,
    aria: 'The same bench swept back to thirteen of fifty-six spots: the brief, the rules, four written notes of what was decided, and the four blueprints for the job in front of him. Every block is bright again.',
    cap: {
      lead: 'Swept, and the good stuff kept.',
      body: ' Same conversation, after asking him to write down what was decided and clear the rest off the bench. The brief, the rules, four notes, and the blueprints for the job actually in front of him. Bright again, because nothing is piled on top of it.',
    },
  },
]

const LEGEND: Kind[] = ['brief', 'rules', 'file', 'talk', 'dig', 'note', 'free']

/** Bright at both ends, dim through the middle — the shape the benchmarks draw. */
function dimAt(index: number, filled: number) {
  if (index >= filled) return 1
  const t = filled <= 1 ? 0 : index / (filled - 1)
  return Number((1 - 0.68 * Math.pow(Math.sin(Math.PI * t), 1.35)).toFixed(3))
}

function stageCells(stage: Stage) {
  return fill(stage.runs, SLOTS)
}

function filledCount(stage: Stage) {
  return stage.runs.reduce((sum, [, count]) => sum + count, 0)
}

export function BenchViz() {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  const { schedule, clearAll } = useTimeouts()
  const played = useRef(false)

  const show = useCallback(
    (next: number) => {
      clearAll()
      setIndex(next)
    },
    [clearAll],
  )

  // One pass through the day on first sight, then it stays wherever the reader
  // leaves it. The whole lesson lands in about seven seconds of just looking.
  const figRef = useOnceVisible<HTMLDivElement>(() => {
    if (reduced || played.current) return
    played.current = true
    schedule(() => setIndex(1), 1900)
    schedule(() => setIndex(2), 5400)
  }, 0.4)

  useEffect(() => {
    if (reduced) clearAll()
  }, [reduced, clearAll])

  if (reduced) {
    return (
      <figure className="js-vfig" ref={figRef}>
        <p className="js-vhead-t">
          One bench, one day <em>the context window filling up</em>
        </p>
        <div className="js-vstatic">
          {STAGES.map((stage) => {
            const filled = filledCount(stage)
            return (
              <div className="js-vstatic-part" key={stage.key}>
                <p className="js-vcard-k">
                  {stage.tab} <span>{stage.used}</span>
                </p>
                <div role="img" aria-label={stage.aria}>
                  <CellGrid
                    cells={stageCells(stage)}
                    cols={COLS}
                    dim={stage.dims ? (i) => dimAt(i, filled) : undefined}
                  />
                </div>
                <p className="js-vcap-static">
                  <b>{stage.cap.lead}</b>
                  {stage.cap.body}
                </p>
              </div>
            )
          })}
        </div>
        <Legend kinds={LEGEND} />
      </figure>
    )
  }

  const stage = STAGES[index] ?? STAGES[0]!
  const filled = filledCount(stage)

  return (
    <figure className="js-vfig" ref={figRef}>
      <div className="js-vhead">
        <p className="js-vhead-t">
          One bench, one day <em>the context window filling up</em>
        </p>
        <div className="js-vtoggle" role="group" aria-label="When in the session">
          {STAGES.map((s, i) => (
            <button aria-pressed={i === index} key={s.key} onClick={() => show(i)} type="button">
              {s.tab}
            </button>
          ))}
        </div>
      </div>

      <div className="js-vbenchcard">
        <p className="js-vcard-k">
          The bench <span>{stage.used} taken</span>
        </p>
        <div role="img" aria-label={stage.aria}>
          <CellGrid
            cells={stageCells(stage)}
            cols={COLS}
            dim={stage.dims ? (i) => dimAt(i, filled) : undefined}
          />
        </div>
      </div>

      <Legend kinds={LEGEND} />

      {/* Every caption shares one grid cell, so the block reserves the tallest
          of the three and stepping through never moves the page. */}
      <div className="js-vcaps">
        {STAGES.map((s, i) => (
          <p
            aria-hidden={i === index ? undefined : true}
            className={`js-vcap${i === index ? ' is-on' : ''}`}
            key={s.key}
          >
            <b>{s.cap.lead}</b>
            {s.cap.body}
          </p>
        ))}
      </div>
    </figure>
  )
}
