'use client'

import { useCallback, useEffect, useState } from 'react'
import '@/components/stack/collision-figure.css'
import { useOnceVisible, useReducedMotion, useTimeouts } from '@/components/stack/hooks'

/* ── Ch.7 · precept 01 · what occupancy actually buys ──────────
   Three lanes reach for one file under three different regimes.
   The WorktreesSection figure next door shows worktrees working;
   this one shows the accident they make impossible, which is a
   different argument and needs its own picture.

   Every mode runs the same scripted phases — no randomness, no
   clocks read during render — so the server, the browser, and a
   reduced-motion reader all draw the identical frame. */

type ModeKey = 'none' | 'claims' | 'worktrees'
type Mark = 'go' | 'ok' | 'warn' | 'bad' | 'sum'
type LogLine = { mark: Mark; text: string }

const MODES: { key: ModeKey; label: string; hint: string }[] = [
  { key: 'none', label: 'No occupancy check', hint: 'three writers, one tree' },
  { key: 'claims', label: 'Claims + exit codes', hint: 'detection' },
  { key: 'worktrees', label: 'A worktree each', hint: 'prevention' },
]

const AGENTS = ['agent A', 'agent B', 'agent C']
const WT_DIRS = ['../wt-a', '../wt-b', '../wt-c']
const FILE = 'components/auth.ts'
const BLOCKS_PER_AGENT = 6

/** Log lines land one per phase; index 0 is phase 1. */
const SCRIPT: Record<ModeKey, LogLine[]> = {
  none: [
    { mark: 'go', text: 'Three lanes reach for components/auth.ts. Nobody asked first.' },
    {
      mark: 'bad',
      text: 'agent C — 6 uncommitted edits overwritten mid-write. No conflict, no error, no trace.',
    },
    { mark: 'sum', text: 'You find it at 2am, in a diff nobody remembers writing.' },
  ],
  claims: [
    { mark: 'ok', text: 'agent A claims the repo. 4h TTL, written where the others can read it.' },
    { mark: 'warn', text: 'fleet repo . → exit 3. agent B and agent C stop, correctly.' },
    { mark: 'sum', text: 'Nothing lost. Two lanes sat idle 41 minutes waiting for the claim.' },
  ],
  worktrees: [
    { mark: 'go', text: 'One repo, three working copies. Each lane checks out its own.' },
    { mark: 'ok', text: 'All three write at full speed. No claim to take, no queue to join.' },
    { mark: 'ok', text: 'Three branches merge back through one gate, one at a time.' },
    { mark: 'sum', text: '0 minutes waiting. 0 edits lost. The collision was never possible.' },
  ],
}

const FINAL_PHASE: Record<ModeKey, number> = {
  none: SCRIPT.none.length,
  claims: SCRIPT.claims.length,
  worktrees: SCRIPT.worktrees.length,
}

const FIG_LABEL: Record<ModeKey, string> = {
  none: 'Three agents writing to one file at once; the third agent’s six uncommitted edits are overwritten and disappear.',
  claims:
    'One agent holds a claim on the repository; the other two are turned away by exit code 3 and sit idle.',
  worktrees:
    'Each of the three agents holds its own worktree copy of the file and writes at full speed; the three branches converge on a single merge gate.',
}

const CHIP: Record<ModeKey, { at: number; tone: string; text: string } | null> = {
  none: { at: 2, tone: 'bad', text: '6 edits lost · 0 warnings' },
  claims: { at: 3, tone: 'warn', text: 'wall clock: +41 min idle' },
  worktrees: { at: 4, tone: 'ok', text: 'wall clock: +0 min idle' },
}

/* ── Geometry ─────────────────────────────────────────────────
   Drawn twice: a landscape stage for room-sized viewports and a
   tighter one for phones, where scaling a 660-unit stage down to
   340px puts the labels under 6px. Both live in data so they
   cannot drift apart. */

type Box = { x: number; y: number; w: number; h: number }

type Geom = {
  cls: string
  /** Frame without the merge gate; the stacked variant is much shorter without it. */
  vb: string
  /** Frame with the merge gate — prevention mode only. */
  vbGate: string
  rows: [number, number, number]
  agentX: number
  agentW: number
  boxH: number
  pad: number
  blockW: number
  blockPitch: number
  fileX: number
  /* x of the single-copy caption; the narrow box has no room for the usual inset. */
  centerTx: number
  fileW: number
  centerY: number
  singleY: number
  singleH: number
  copyH: number
  badge: Box
  badgeTx: number
  badgeTy: number
  /** Worktree path shown on a copy box — abbreviated where the box is narrow. */
  copyLabel: (i: number) => string
  gate: Box
  gateTx: number
  gateTy: [number, number]
  /** Where a turned-away lane is stopped, per lane index. */
  stopY: (i: number) => number
  stopX: number
  outLive: (row: number) => string
  outBlocked: (row: number, i: number) => string
  outStraight: (row: number) => string
  back: (row: number) => string
}

const WIDE: Geom = {
  cls: 'cf-wide',
  vb: '0 0 660 250',
  vbGate: '0 0 660 250',
  rows: [42, 125, 208],
  agentX: 10,
  agentW: 112,
  boxH: 52,
  pad: 10,
  blockW: 10,
  blockPitch: 13,
  fileX: 270,
  centerTx: 280,
  fileW: 200,
  centerY: 125,
  singleY: 97,
  singleH: 56,
  copyH: 46,
  badge: { x: 276, y: 78, w: 148, h: 20 },
  badgeTx: 285,
  badgeTy: 92,
  copyLabel: (i) => `${WT_DIRS[i]}/${FILE}`,
  gate: { x: 548, y: 99, w: 104, h: 52 },
  gateTx: 600,
  gateTy: [119, 135],
  stopY: (i) => (i === 1 ? 112 : 138),
  stopX: 240,
  outLive: (row) => `M122,${row} C 190,${row} 210,125 266,125`,
  outBlocked: (row, i) =>
    `M122,${row} C 190,${row} 200,${i === 1 ? 112 : 138} 240,${i === 1 ? 112 : 138}`,
  outStraight: (row) => `M122,${row} L 266,${row}`,
  back: (row) => `M470,${row} C 500,${row} 520,125 544,125`,
}

const NARROW: Geom = {
  cls: 'cf-narrow',
  vb: '0 0 360 276',
  vbGate: '0 0 360 392',
  rows: [46, 140, 234],
  agentX: 4,
  agentW: 112,
  boxH: 52,
  pad: 8,
  blockW: 9,
  blockPitch: 11,
  fileX: 148,
  centerTx: 150,
  fileW: 204,
  centerY: 140,
  singleY: 112,
  singleH: 56,
  copyH: 48,
  badge: { x: 152, y: 92, w: 154, h: 20 },
  badgeTx: 161,
  badgeTy: 106,
  /* The full worktree path runs 26 characters; at this width the middle segment
     is the one a reader can infer, so it is the one that goes. */
  copyLabel: (i) => `${WT_DIRS[i]}/…/auth.ts`,
  gate: { x: 106, y: 330, w: 148, h: 46 },
  gateTx: 180,
  gateTy: [348, 362],
  stopY: (i) => (i === 1 ? 126 : 154),
  stopX: 130,
  outLive: (row) => `M116,${row} C 130,${row} 134,140 144,140`,
  outBlocked: (row, i) =>
    `M116,${row} C 124,${row} 126,${i === 1 ? 126 : 154} 130,${i === 1 ? 126 : 154}`,
  outStraight: (row) => `M116,${row} L 144,${row}`,
  back: (row) => `M352,${row} C 356,${row} 340,300 186,328`,
}

type LaneState = 'idle' | 'live' | 'lost' | 'blocked'

function laneState(mode: ModeKey, phase: number, i: number): LaneState {
  if (mode === 'none') {
    if (phase >= 2 && i === 2) return 'lost'
    return phase >= 1 ? 'live' : 'idle'
  }
  if (mode === 'claims') {
    if (i === 0) return phase >= 1 ? 'live' : 'idle'
    return phase >= 2 ? 'blocked' : 'idle'
  }
  return phase >= 2 ? 'live' : 'idle'
}

function laneWord(s: LaneState): string {
  if (s === 'lost') return 'edits gone'
  if (s === 'blocked') return 'waiting · exit 3'
  if (s === 'live') return 'writing'
  return 'ready'
}

function Stage({ geom, mode, phase }: { geom: Geom; mode: ModeKey; phase: number }) {
  const split = mode === 'worktrees' && phase >= 1
  const clash = mode === 'none' && phase >= 2
  const claimed = mode === 'claims' && phase >= 1
  const gateOn = mode === 'worktrees' && phase >= 3

  return (
    <svg
      className={geom.cls}
      viewBox={mode === 'worktrees' ? geom.vbGate : geom.vb}
      role="img"
      aria-label={FIG_LABEL[mode]}
    >
      <g>
        {geom.rows.map((row, i) => {
          const s = laneState(mode, phase, i)
          if (s === 'idle') {
            return <path key={`l${i}`} d={geom.outLive(row)} className="cf-lane" />
          }
          if (s === 'blocked') {
            const y = geom.stopY(i)
            return (
              <g key={`l${i}`}>
                <path d={geom.outBlocked(row, i)} className="cf-lane stopped" />
                <line
                  x1={geom.stopX + 4}
                  y1={y - 9}
                  x2={geom.stopX + 4}
                  y2={y + 9}
                  className="cf-stopbar"
                />
              </g>
            )
          }
          const d = split ? geom.outStraight(row) : geom.outLive(row)
          return (
            <path
              key={`l${i}`}
              d={d}
              pathLength={300}
              className={s === 'lost' ? 'cf-lane live lost' : 'cf-lane live'}
            />
          )
        })}
        {gateOn &&
          geom.rows.map((row, i) => (
            <path key={`b${i}`} d={geom.back(row)} pathLength={300} className="cf-lane back" />
          ))}
      </g>

      <g>
        {AGENTS.map((name, i) => {
          const row = geom.rows[i] ?? 0
          const s = laneState(mode, phase, i)
          const gone = mode === 'none' && phase >= 2 && i === 2
          return (
            <g key={name} className={`cf-agent ${s}`}>
              <rect
                x={geom.agentX}
                y={row - geom.boxH / 2}
                width={geom.agentW}
                height={geom.boxH}
                rx={5}
                className="cf-node"
              />
              <text x={geom.agentX + geom.pad} y={row - 10}>
                {name}
              </text>
              {Array.from({ length: BLOCKS_PER_AGENT }, (_, j) => (
                <rect
                  key={j}
                  x={geom.agentX + geom.pad + j * geom.blockPitch}
                  y={row - 1}
                  width={geom.blockW}
                  height={8}
                  rx={1.5}
                  className={gone ? 'cf-blk gone' : 'cf-blk'}
                  style={gone ? { transitionDelay: `${j * 55}ms` } : undefined}
                />
              ))}
              <text x={geom.agentX + geom.pad} y={row + 21} className="cf-st">
                {laneWord(s)}
              </text>
            </g>
          )
        })}

        {split ? (
          geom.rows.map((row, i) => (
            <g key={`c${i}`} className="cf-copy">
              <rect
                x={geom.fileX}
                y={row - geom.copyH / 2}
                width={geom.fileW}
                height={geom.copyH}
                rx={4}
                className="cf-node on"
              />
              <text x={geom.fileX + geom.pad + 2} y={row - 3}>
                {geom.copyLabel(i)}
              </text>
              <text x={geom.fileX + geom.pad + 2} y={row + 12} className="cf-st">
                writable · nobody else here
              </text>
            </g>
          ))
        ) : (
          <g className={clash ? 'cf-file clash' : 'cf-file'}>
            <rect
              x={geom.fileX}
              y={geom.singleY}
              width={geom.fileW}
              height={geom.singleH}
              rx={4}
              className="cf-node on"
            />
            <text x={geom.fileX + geom.pad + 2} y={geom.centerY - 4} className="cf-hub">
              {FILE}
            </text>
            <text x={geom.centerTx} y={geom.centerY + 13} className="cf-st">
              {clash ? 'last writer won — silently' : 'one working tree, one copy'}
            </text>
            {claimed && (
              <>
                <rect
                  x={geom.badge.x}
                  y={geom.badge.y}
                  width={geom.badge.w}
                  height={geom.badge.h}
                  rx={10}
                  className="cf-badge"
                />
                <text x={geom.badgeTx} y={geom.badgeTy} className="cf-badge-t">
                  claimed · agent A · 4h
                </text>
              </>
            )}
          </g>
        )}

        {mode === 'worktrees' && (
          <>
            <rect
              x={geom.gate.x}
              y={geom.gate.y}
              width={geom.gate.w}
              height={geom.gate.h}
              rx={5}
              className={gateOn ? 'cf-node cf-gate on' : 'cf-node cf-gate'}
            />
            <text x={geom.gateTx} y={geom.gateTy[0]} className="cf-hub" textAnchor="middle">
              one gate
            </text>
            <text x={geom.gateTx} y={geom.gateTy[1]} className="cf-st" textAnchor="middle">
              one at a time
            </text>
          </>
        )}
      </g>
    </svg>
  )
}

export function CollisionFigure() {
  const reduced = useReducedMotion()
  const { schedule, clearAll } = useTimeouts()
  const [mode, setMode] = useState<ModeKey>('none')
  const [phase, setPhase] = useState(0)
  const [running, setRunning] = useState(false)
  const [userRun, setUserRun] = useState(false)

  const play = useCallback(
    (key: ModeKey) => {
      clearAll()
      const last = FINAL_PHASE[key]
      if (reduced) {
        // Reduced motion gets the finished argument, not a frozen first frame.
        setPhase(last)
        setRunning(false)
        return
      }
      setPhase(0)
      setRunning(true)
      for (let p = 1; p <= last; p += 1) {
        schedule(() => setPhase(p), p * 780)
      }
      schedule(() => setRunning(false), last * 780 + 40)
    },
    [clearAll, reduced, schedule],
  )

  const pick = (key: ModeKey) => {
    setMode(key)
    play(key)
  }

  const figRef = useOnceVisible<HTMLDivElement>(() => {
    if (!reduced) schedule(() => play('none'), 420)
  }, 0.35)

  useEffect(() => {
    if (!reduced) return
    clearAll()
    setRunning(false)
    setPhase(FINAL_PHASE[mode])
  }, [reduced, mode, clearAll])

  const lines = SCRIPT[mode].slice(0, phase)
  const chip = CHIP[mode]

  return (
    <div
      className="cf rv"
      ref={figRef}
      onPointerDown={() => setUserRun(true)}
      onFocusCapture={() => setUserRun(true)}
    >
      <div className="cf-head">
        <div className="toggle" role="group" aria-label="Collision handling">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              aria-pressed={mode === m.key}
              onClick={() => {
                pick(m.key)
              }}
            >
              {m.label}
              <span className="cf-hint">{m.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <Stage geom={WIDE} mode={mode} phase={phase} />
      <Stage geom={NARROW} mode={mode} phase={phase} />

      <div className="cf-ctl">
        <button
          className="btn"
          type="button"
          onClick={() => {
            play(mode)
          }}
          disabled={running}
        >
          {running ? 'Running…' : 'Run it'}
        </button>
        {chip && phase >= chip.at && <span className={`cf-chip ${chip.tone}`}>{chip.text}</span>}
      </div>

      {/* Both log copies share one grid cell: the hidden longest script sets the
          height so replaying or switching modes never shoves the page down. */}
      <div className="cf-logwrap">
        <div className="cf-log" aria-live={userRun ? 'polite' : 'off'}>
          {lines.map((l, i) => (
            <div key={i} className={`cf-line ${l.mark}`}>
              <span aria-hidden="true" className="cf-mk">
                {l.mark === 'go' && '→'}
                {l.mark === 'ok' && '✔'}
                {l.mark === 'warn' && '⊘'}
                {l.mark === 'bad' && '✗'}
                {l.mark === 'sum' && '='}
              </span>
              {l.text}
            </div>
          ))}
        </div>
        <div className="cf-log cf-log-reserve" aria-hidden="true">
          {SCRIPT.worktrees.map((l, i) => (
            <div key={i} className="cf-line">
              <span className="cf-mk">=</span>
              {l.text}
            </div>
          ))}
        </div>
      </div>

      <p className="cf-cap">
        <b>Detection means somebody waits.</b> Prevention means nobody had to.
      </p>
    </div>
  )
}
