'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import '@/components/stack/worktrees.css'
import { Terminal, type TermLine } from '@/components/stack/Terminal'

/* Local copies of the small viewport/timer hooks the other figures use, so this
   section stays self-contained. */

function useReducedMotionLocal(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function useOnceVisibleLocal<T extends HTMLElement>(onVisible: () => void, threshold = 0.35) {
  const ref = useRef<T | null>(null)
  const fired = useRef(false)
  const cb = useRef(onVisible)
  cb.current = onVisible
  useEffect(() => {
    const el = ref.current
    if (!el || fired.current) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !fired.current) {
            fired.current = true
            cb.current()
            io.disconnect()
          }
        }
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return ref
}

function useTimeoutsLocal() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])
  const schedule = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms))
  }, [])
  useEffect(() => clearAll, [clearAll])
  return { schedule, clearAll }
}

/* ── Figure data ──────────────────────────────────────────── */

type Lane = {
  /** worktree directory, as it reads on disk */
  dir: string
  branch: string
  /** files this lane ends up dirtying; 0 means the lane earned nothing */
  files: number
}

const LANES: Lane[] = [
  { dir: 'wt-auth', branch: 'auth-wave', files: 7 },
  { dir: 'wt-api', branch: 'api-wave', files: 4 },
  { dir: 'wt-ui', branch: 'ui-wave', files: 11 },
  { dir: 'wt-docs', branch: 'docs-wave', files: 0 },
]

type LaneState = 'idle' | 'live' | 'merging' | 'merged' | 'dropped'
type WtLog = { mark: 'ok' | 'drop' | 'sum'; text: string }

const CAPTION = 'One repo, four working copies, four branches. Nobody waits.'
const FIG_LABEL =
  'One repository fanning out into four worktrees, each on its own branch, merging back through a single gate one at a time'

const FINAL_STATES: LaneState[] = LANES.map((l) => (l.files === 0 ? 'dropped' : 'merged'))
const FINAL_DIRTY: number[] = LANES.map((l) => l.files)
const REST_LOG: WtLog[] = [
  { mark: 'ok', text: 'auth-wave merged — gate green' },
  { mark: 'ok', text: 'api-wave merged — gate green' },
  { mark: 'ok', text: 'ui-wave merged — gate green' },
  { mark: 'drop', text: 'docs-wave changed nothing — worktree removed, never merged' },
  { mark: 'sum', text: '22 files written in parallel. One branch merged at a time.' },
]

const WT_TERM: TermLine[] = [
  { t: 'cmd', v: 'git worktree add ../trey-goff-wt-auth -b auth-wave' },
  { t: 'out', v: "Preparing worktree (new branch 'auth-wave')", c: 'dim' },
  { t: 'out', v: 'HEAD is now at 9e00afd', c: 'dim', d: 260 },
  { t: 'cmd', v: 'git worktree list' },
  { t: 'out', v: '~/Code/trey-goff            9e00afd [main]', c: 'ok' },
  { t: 'out', v: '~/Code/trey-goff-wt-auth    9e00afd [auth-wave]', c: 'ok' },
  { t: 'out', v: '~/Code/trey-goff-wt-api     9e00afd [api-wave]', c: 'ok' },
  { t: 'out', v: '~/Code/trey-goff-wt-ui      9e00afd [ui-wave]', c: 'ok' },
]

/* ── Figure geometry ──────────────────────────────────────────
   The same figure is drawn twice: a landscape fan for room-sized
   viewports and a stacked column for phones, where 720 units of
   width would push the gate off the screen and quietly delete the
   argument. Geometry lives in data so the two cannot drift. */

type Box = { x: number; y: number; w: number; h: number }

type Geom = {
  cls: string
  vb: string
  /** vertical centre of each worktree row */
  rows: number[]
  boxX: number
  boxW: number
  boxH: number
  textPad: number
  dirDy: number
  brDy: number
  cntDy: number
  repo: Box
  repoTx: number
  repoTy: [number, number]
  gate: Box
  gateTx: number
  gateTy: [number, number]
  out: (cy: number, i: number) => string
  back: (cy: number, i: number) => string
}

const WIDE: Geom = {
  cls: 'wt-wide',
  vb: '0 0 720 260',
  rows: [36, 94, 152, 210],
  boxX: 252,
  boxW: 208,
  boxH: 32,
  textPad: 12,
  dirDy: -2,
  brDy: 9,
  cntDy: 4,
  repo: { x: 16, y: 103, w: 96, h: 40 },
  repoTx: 64,
  repoTy: [122, 134],
  gate: { x: 594, y: 99, w: 108, h: 48 },
  gateTx: 648,
  gateTy: [119, 135],
  // Lanes overshoot into every node they touch; the nodes paint after them and
  // clip the overshoot, which is what keeps the joins from reading as gaps.
  out: (cy) => `M106,123 C 186,123 200,${cy} 258,${cy}`,
  back: (cy) => `M454,${cy} C 528,${cy} 552,123 600,123`,
}

const NARROW: Geom = {
  cls: 'wt-narrow',
  vb: '0 0 340 396',
  rows: [100, 158, 216, 274],
  boxX: 64,
  boxW: 212,
  boxH: 40,
  textPad: 12,
  dirDy: -5,
  brDy: 11,
  cntDy: 4,
  repo: { x: 110, y: 8, w: 120, h: 40 },
  repoTx: 170,
  repoTy: [25, 39],
  gate: { x: 100, y: 330, w: 140, h: 52 },
  gateTx: 170,
  gateTy: [352, 369],
  // Each lane gets its own rail x so the four sweeps stay legible as four in a
  // column this narrow; the longest trip takes the outermost rail.
  out: (cy, i) => `M170,42 C ${48 - i * 8},48 ${48 - i * 8},${cy} 70,${cy}`,
  back: (cy, i) => `M270,${cy} C ${316 - i * 8},${cy} ${316 - i * 8},330 170,336`,
}

type FigureProps = {
  geom: Geom
  states: LaneState[]
  dirty: number[]
  gateOn: boolean
}

function WorktreeFigure({ geom, states, dirty, gateOn }: FigureProps) {
  return (
    <svg className={geom.cls} viewBox={geom.vb} role="img" aria-label={FIG_LABEL}>
      <g>
        {LANES.map((lane, i) => {
          const cy = geom.rows[i] ?? 0
          const s = states[i] ?? 'idle'
          // A removed worktree loses its lane entirely — that is the point of removing it.
          const out = s !== 'idle' && s !== 'dropped'
          const back = s === 'merging' || s === 'merged'
          return (
            <g key={lane.dir}>
              <path d={geom.out(cy, i)} pathLength={300} className={out ? 'lane live' : 'lane'} />
              <path d={geom.back(cy, i)} pathLength={300} className={back ? 'lane back' : 'lane'} />
            </g>
          )
        })}
      </g>
      <g>
        <rect
          x={geom.repo.x}
          y={geom.repo.y}
          width={geom.repo.w}
          height={geom.repo.h}
          rx={5}
          className="node on"
        />
        <text x={geom.repoTx} y={geom.repoTy[0]} className="hub" textAnchor="middle">
          one repo
        </text>
        <text x={geom.repoTx} y={geom.repoTy[1]} textAnchor="middle">
          main
        </text>

        {LANES.map((lane, i) => {
          const cy = geom.rows[i] ?? 0
          const s = states[i] ?? 'idle'
          const n = dirty[i] ?? 0
          return (
            <g key={lane.dir} className={`wt-lane ${s}`}>
              <rect
                x={geom.boxX}
                y={cy - geom.boxH / 2}
                width={geom.boxW}
                height={geom.boxH}
                rx={4}
                className="node"
              />
              <text x={geom.boxX + geom.textPad} y={cy + geom.dirDy}>
                ../{lane.dir}
              </text>
              <text x={geom.boxX + geom.textPad} y={cy + geom.brDy} className="br">
                {lane.branch}
              </text>
              <text
                x={geom.boxX + geom.boxW - geom.textPad}
                y={cy + geom.cntDy}
                textAnchor="end"
                className="cnt"
              >
                {s === 'dropped'
                  ? 'removed'
                  : s === 'merged'
                    ? 'merged'
                    : `${n} file${n === 1 ? '' : 's'}`}
              </text>
            </g>
          )
        })}

        <rect
          x={geom.gate.x}
          y={geom.gate.y}
          width={geom.gate.w}
          height={geom.gate.h}
          rx={5}
          className={gateOn ? 'node gate on' : 'node gate'}
        />
        <text x={geom.gateTx} y={geom.gateTy[0]} className="hub" textAnchor="middle">
          the gate
        </text>
        <text x={geom.gateTx} y={geom.gateTy[1]} textAnchor="middle">
          one at a time
        </text>
      </g>
    </svg>
  )
}

/* ── Section ──────────────────────────────────────────────── */

export function WorktreesSection() {
  const reduced = useReducedMotionLocal()
  const { schedule, clearAll } = useTimeoutsLocal()
  const [states, setStates] = useState<LaneState[]>(() => LANES.map(() => 'idle'))
  const [dirty, setDirty] = useState<number[]>(() => LANES.map(() => 0))
  const [gateOn, setGateOn] = useState(false)
  const [logs, setLogs] = useState<WtLog[]>([])

  const setLane = (i: number, s: LaneState) =>
    setStates((prev) => prev.map((v, j) => (j === i ? s : v)))

  const run = useCallback(() => {
    clearAll()
    setStates(LANES.map(() => 'idle'))
    setDirty(LANES.map(() => 0))
    setGateOn(false)
    setLogs([])

    const step = reduced ? 1 : 230
    let t = 0

    LANES.forEach((_, i) => {
      schedule(() => setLane(i, 'live'), i * step)
    })
    t = LANES.length * step + 320

    // Each lane dirties files on its own clock — that is the whole point of the isolation.
    let longest = 0
    LANES.forEach((lane, i) => {
      for (let f = 1; f <= lane.files; f += 1) {
        const at = t + i * 70 + f * (reduced ? 1 : 120)
        longest = Math.max(longest, at)
        schedule(() => setDirty((prev) => prev.map((v, j) => (j === i ? f : v))), at)
      }
    })
    t = longest + 520

    // The gate is single-file by construction: one branch through it at a time.
    LANES.forEach((lane, i) => {
      if (lane.files === 0) return
      schedule(() => {
        setLane(i, 'merging')
        setGateOn(true)
      }, t)
      const done = t + step * 1.5
      schedule(() => {
        setLane(i, 'merged')
        setLogs((prev) => [...prev, { mark: 'ok', text: `${lane.branch} merged — gate green` }])
      }, done)
      t = done + step * 0.6
    })

    const empty = LANES.findIndex((l) => l.files === 0)
    if (empty >= 0) {
      schedule(() => {
        setLane(empty, 'dropped')
        setLogs((prev) => [
          ...prev,
          {
            mark: 'drop',
            text: `${LANES[empty]?.branch ?? ''} changed nothing — worktree removed, never merged`,
          },
        ])
      }, t)
      t += step
    }

    schedule(() => {
      setGateOn(false)
      setLogs((prev) => [
        ...prev,
        { mark: 'sum', text: '22 files written in parallel. One branch merged at a time.' },
      ])
    }, t + 260)
  }, [clearAll, reduced, schedule])

  const figRef = useOnceVisibleLocal<HTMLDivElement>(() => {
    if (!reduced) schedule(run, 420)
  }, 0.35)

  // Reduced motion gets the finished picture immediately, and a button if they want the run.
  useEffect(() => {
    if (!reduced) return
    clearAll()
    setStates(FINAL_STATES)
    setDirty(FINAL_DIRTY)
    setGateOn(false)
    setLogs(REST_LOG)
  }, [reduced, clearAll])

  return (
    <>
      <p className="section-label">Worktrees: how a swarm shares one repo</p>
      <div className="twoup">
        <div className="rv">
          <h3>Two agents, one working tree, one loser</h3>
          <p>
            A working tree holds exactly one branch and one set of uncommitted edits. Point three
            agents at it and they are not collaborating, they are overwriting: one renames a
            function the other is mid-way through calling, and a third decides it needs a clean
            baseline and stashes everybody. That last one is not hypothetical — it cost me three
            agents&apos; uncommitted work in a single afternoon.
          </p>
        </div>
        <div className="rv" data-d="1">
          <h3>Git already ships the fix</h3>
          <p>
            <span className="inline-code">git worktree</span> gives one repository N working copies,
            each checked out to its own branch, each with its own dirty files, all sharing one
            object store. It is cheap, it is native, and it needs no tooling on top.{' '}
            <b>
              Worktrees are the thing that makes an autonomous swarm possible at all — without them
              you have one agent and a queue.
            </b>
          </p>
        </div>
      </div>

      <div className="wt rv" ref={figRef}>
        <WorktreeFigure geom={WIDE} states={states} dirty={dirty} gateOn={gateOn} />
        <WorktreeFigure geom={NARROW} states={states} dirty={dirty} gateOn={gateOn} />
        <div className="wt-ctl">
          <button className="btn" type="button" onClick={run}>
            Run the swarm
          </button>
          <p className="wt-cap">{CAPTION}</p>
        </div>
        {/* The log fills in line by line, so its box has to already be the size
            of the finished log or replaying the run shoves the page down. A
            hidden copy of the settled text reserves exactly that height, which
            a fixed min-height cannot do once the lines wrap. */}
        <div className="wt-logwrap">
          <div className="wt-log" aria-live="polite">
            {logs.map((l, i) => (
              <div key={i}>
                {l.mark === 'ok' && <b>✔ </b>}
                {l.mark === 'drop' && <span className="x">− </span>}
                {l.mark === 'sum' && <b>= </b>}
                {l.text}
              </div>
            ))}
          </div>
          <div className="wt-log wt-log-reserve" aria-hidden="true">
            {REST_LOG.map((l, i) => (
              <div key={i}>
                {l.mark === 'ok' && <b>✔ </b>}
                {l.mark === 'drop' && <span className="x">− </span>}
                {l.mark === 'sum' && <b>= </b>}
                {l.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rv" style={{ marginTop: '1.6rem' }}>
        <Terminal title="Terminal — four lanes, one repo" lines={WT_TERM} />
      </div>

      <p className="section-label">Rules of the swarm</p>
      <div className="precepts rv">
        <div className="precept">
          <span className="idx">01</span>
          <p className="claim">Every parallel writer gets its own worktree.</p>
          <p className="payoff">
            One lane, one directory, one branch. If two agents are going to write at the same time
            and you cannot name the worktree each of them is in,{' '}
            <b>you do not have a swarm, you have a race.</b>
          </p>
        </div>
        <div className="precept">
          <span className="idx">02</span>
          <p className="claim">Writers never run tree-wide git commands.</p>
          <p className="payoff">
            No <span className="inline-code">stash</span>, no{' '}
            <span className="inline-code">checkout --</span>, no{' '}
            <span className="inline-code">restore</span>. Put it in the instruction file in those
            words. An agent reaching for a clean baseline should read a file at a commit —{' '}
            <span className="inline-code">git show HEAD:path</span> — not mutate the tree it is
            standing in.
          </p>
        </div>
        <div className="precept">
          <span className="idx">03</span>
          <p className="claim">The coordinator merges, and gates between merges.</p>
          <p className="payoff">
            Lanes write; one process merges. Run the gate after every single merge, not once at the
            end, because <b>the first red gate then names the branch that broke it</b> instead of
            handing you four suspects.
          </p>
        </div>
        <div className="precept">
          <span className="idx">04</span>
          <p className="claim">A worktree that changed nothing gets deleted.</p>
          <p className="payoff">
            An empty lane is a finding, not a failure — the task was already done, or it was never
            real work. Remove the worktree and say so.{' '}
            <b>Merging an empty branch just to close the loop is how phantom commits get born.</b>
          </p>
        </div>
      </div>
    </>
  )
}
