'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CTX,
  CTX_CELL_COUNT,
  type CtxKey,
  TOOL_ORDER,
  TOOLS,
  type ToolKey,
  TREE,
  TREE_ROOT,
  VERDICTS,
  WORKERS,
} from '@/components/stack/data'
import { useOnceVisible, useReducedMotion, useTimeouts } from '@/components/stack/hooks'
import { Terminal } from '@/components/stack/Terminal'

/* ── Ch.1 · context window figure ─────────────────────────── */

function ctxClasses(key: CtxKey): string[] {
  const classes: string[] = []
  for (const [cls, count] of CTX[key].segs) {
    for (let i = 0; i < count; i += 1) classes.push(cls)
  }
  while (classes.length < CTX_CELL_COUNT) classes.push('c-free')
  return classes
}

export function ContextFigure() {
  const reduced = useReducedMotion()
  const [mode, setMode] = useState<CtxKey>('bad')
  const [cells, setCells] = useState<string[]>(() => ctxClasses('bad'))
  const { schedule, clearAll } = useTimeouts()
  const nudged = useRef(false)

  const paint = useCallback(
    (key: CtxKey) => {
      setMode(key)
      clearAll()
      // One state update; the left→right sweep comes from per-cell
      // transition-delay in the render, not from 320 timers.
      setCells(ctxClasses(key))
    },
    [clearAll],
  )

  // Nudge to the curated state once the figure has been seen, so the point lands.
  const figRef = useOnceVisible<HTMLDivElement>(() => {
    if (reduced || nudged.current) return
    nudged.current = true
    schedule(() => paint('good'), 2600)
  }, 0.5)

  const spec = CTX[mode]
  return (
    <div className="ctxfig rv" ref={figRef}>
      <div className="ctxfig-head">
        <span className="t">
          One context window · <b>200,000 tokens</b> · every cell ≈ 500 tokens
        </span>
        <div className="toggle" role="group" aria-label="Context packing strategy">
          <button type="button" aria-pressed={mode === 'bad'} onClick={() => paint('bad')}>
            Untended
          </button>
          <button type="button" aria-pressed={mode === 'good'} onClick={() => paint('good')}>
            Curated
          </button>
        </div>
      </div>
      <div className="cells" aria-hidden="true">
        {cells.map((cls, i) => (
          <i
            key={i}
            className={cls}
            style={reduced ? undefined : { transitionDelay: `${(i * 1.6).toFixed(1)}ms` }}
          />
        ))}
      </div>
      <div className="legend">
        {spec.segs.map(([cls, , label]) => (
          <span key={cls + label}>
            <i className={cls} />
            {label}
          </span>
        ))}
      </div>
      <p className="ctxfig-cap">
        <b>{spec.cap.lead}</b>
        {spec.cap.body}
        {spec.cap.tail ? <b>{spec.cap.tail}</b> : null}
      </p>
    </div>
  )
}

/* ── Ch.3 · skill anatomy ─────────────────────────────────── */

const ANNO: { seg: string; h: string; body: string }[] = [
  {
    seg: 'fm',
    h: 'Frontmatter — the trigger',
    body: "The description is the entire routing decision. It's what the agent reads to decide whether to load this skill at all, so write it as a list of moments, not a summary of contents.",
  },
  {
    seg: 'when',
    h: 'Preconditions',
    body: "State the world the procedure assumes, and what to do when it doesn't hold. Half of a good skill is knowing when to refuse.",
  },
  {
    seg: 'steps',
    h: 'The procedure',
    body: 'Exact commands, in order, with the judgment calls named. "Patch unless told otherwise" removes a question it would otherwise ask you at 11pm.',
  },
  {
    seg: 'fail',
    h: 'The failure branch',
    body: 'The most valuable paragraph in any skill. Without it, a blocked agent invents a way around your gate — and the invention is always worse than stopping.',
  },
]

export function SkillAnatomy() {
  const [seg, setSeg] = useState('fm')
  const on = (s: string) => (seg === s ? 'seg on' : 'seg')
  return (
    <div className="anatomy rv">
      <div className="anatomy-file">
        <div className="fname">~/.claude/skills/ship-a-release/SKILL.md</div>
        <pre>
          <span className={on('fm')} onMouseEnter={() => setSeg('fm')}>
            <span className="c">---</span>
            {'\n'}
            <span className="k">name</span>: ship-a-release{'\n'}
            <span className="k">description</span>:{' '}
            <span className="s">
              Cut and publish a release. Use when{'\n'} the user says &quot;ship it&quot;, &quot;cut
              a release&quot;, or asks{'\n'} to tag a version.
            </span>
            {'\n'}
            <span className="c">---</span>
          </span>
          {'\n\n'}
          <span className={on('when')} onMouseEnter={() => setSeg('when')}>
            # Ship a release{'\n\n'}Run this only from a clean tree on{' '}
            <span className="s">main</span>.{'\n'}If the tree is dirty, stop and say so.
          </span>
          {'\n\n'}
          <span className={on('steps')} onMouseEnter={() => setSeg('steps')}>
            ## Steps{'\n\n'}1. `pnpm ci:quality` — must pass, no exceptions.{'\n'}2. Bump the
            version. Patch unless told otherwise.{'\n'}3. `git tag v$VERSION` and write the
            changelog{'\n'}
            {'   '}from the commits since the last tag.{'\n'}4. Stop. Ask before pushing the tag.
          </span>
          {'\n\n'}
          <span className={on('fail')} onMouseEnter={() => setSeg('fail')}>
            ## When it goes wrong{'\n\n'}If the gate fails, do not &quot;fix&quot; it by skipping
            it.
            {'\n'}Report the failure and wait.
          </span>
        </pre>
      </div>
      <div className="anno">
        {ANNO.map((a) => (
          <button
            key={a.seg}
            type="button"
            aria-pressed={seg === a.seg}
            onClick={() => setSeg(a.seg)}
            onMouseEnter={() => setSeg(a.seg)}
          >
            <span className="h">{a.h}</span>
            {a.body}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Ch.4 · the rack ──────────────────────────────────────── */

export function ToolRack() {
  const [tool, setTool] = useState<ToolKey>('rg')
  const t = TOOLS[tool]
  return (
    <div className="rack rv">
      <div className="rack-list" role="group" aria-label="Tools">
        {TOOL_ORDER.map((item) => (
          <button
            key={item.key}
            className="rack-item"
            type="button"
            aria-pressed={tool === item.key}
            onClick={() => setTool(item.key)}
          >
            <span className="nm">
              {item.name}
              <span className="bl">{item.blurb}</span>
            </span>
            <span className="tag">{item.tag}</span>
          </button>
        ))}
      </div>
      <div className="rack-panel">
        {/* key remounts the terminal so each tool types fresh */}
        <Terminal key={tool} title={t.title} lines={t.lines} />
        <div className="rack-meta">
          <span>{t.why}</span>
          <span>
            {t.linkHref ? (
              <a href={t.linkHref} target="_blank" rel="noopener noreferrer">
                {t.linkText}
              </a>
            ) : (
              t.linkText
            )}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── Ch.5 · fan-out ───────────────────────────────────────── */

type FanLog = { mark: 'go' | 'ok' | 'bad' | 'sum'; text: string }

export function FanOut() {
  const reduced = useReducedMotion()
  const { schedule, clearAll } = useTimeouts()
  const [liveOut, setLiveOut] = useState<boolean[]>(() => WORKERS.map(() => false))
  const [liveBack, setLiveBack] = useState<boolean[]>(() => WORKERS.map(() => false))
  const [outOn, setOutOn] = useState(false)
  const [logs, setLogs] = useState<FanLog[]>([])

  const run = useCallback(() => {
    clearAll()
    setLiveOut(WORKERS.map(() => false))
    setLiveBack(WORKERS.map(() => false))
    setOutOn(false)
    setLogs([{ mark: 'go', text: 'One brief, six windows. Yours stays empty.' }])
    const step = reduced ? 1 : 260
    WORKERS.forEach((_, i) => {
      schedule(() => {
        setLiveOut((prev) => prev.map((v, j) => (j === i ? true : v)))
      }, i * step)
    })
    const base = WORKERS.length * step + 500
    VERDICTS.forEach(([who, verdict, ok], i) => {
      schedule(
        () => {
          setLiveBack((prev) => prev.map((v, j) => (j === i ? true : v)))
          setLogs((prev) => [...prev, { mark: ok ? 'ok' : 'bad', text: `${who} — ${verdict}` }])
        },
        base + i * step * 0.8,
      )
    })
    schedule(
      () => {
        setOutOn(true)
        setLogs((prev) => [
          ...prev,
          { mark: 'sum', text: '6 windows spent. ~340 lines read. You read 6.' },
        ])
      },
      base + VERDICTS.length * step * 0.8 + 400,
    )
  }, [clearAll, reduced, schedule])

  const fanRef = useOnceVisible<HTMLDivElement>(() => {
    if (!reduced) schedule(run, 500)
  }, 0.4)

  useEffect(() => {
    if (reduced) {
      setLogs([{ mark: 'go', text: 'One brief, six windows. Press Dispatch to run it.' }])
    }
  }, [reduced])

  const HUB = { x: 96, y: 130 }
  const OUT = { x: 638, y: 130 }
  return (
    <div className="fan rv" ref={fanRef}>
      <svg
        viewBox="0 0 720 260"
        role="img"
        aria-label="One prompt fanning out to six agents and converging into one verdict"
      >
        <g>
          {WORKERS.map((w, i) => {
            const y = 26 + i * 41.5
            return (
              <g key={w.n}>
                <path
                  d={`M${HUB.x},${HUB.y} C 200,${HUB.y} 230,${y} 296,${y}`}
                  className={liveOut[i] ? 'lane live' : 'lane'}
                />
                <path
                  d={`M476,${y} C 540,${y} 566,${OUT.y} ${OUT.x},${OUT.y}`}
                  className={liveBack[i] ? 'lane back' : 'lane'}
                />
              </g>
            )
          })}
        </g>
        <g>
          {WORKERS.map((w, i) => {
            const y = 26 + i * 41.5
            return (
              <g key={w.n}>
                <rect
                  x={296}
                  y={y - 12}
                  width={180}
                  height={24}
                  rx={4}
                  className={liveOut[i] ? 'node on' : 'node'}
                />
                <text x={307} y={y + 4} className={liveOut[i] ? 'on' : undefined}>
                  {w.n} · {w.job}
                </text>
              </g>
            )
          })}
          <rect x={14} y={HUB.y - 17} width={82} height={34} rx={5} className="node on" />
          <text x={27} y={HUB.y + 4} className="hub">
            you
          </text>
          <rect
            x={610}
            y={OUT.y - 17}
            width={96}
            height={34}
            rx={5}
            className={outOn ? 'node on' : 'node'}
          />
          <text x={622} y={OUT.y + 4} className="hub">
            one answer
          </text>
        </g>
      </svg>
      <div className="fan-ctl">
        <button className="btn" type="button" onClick={run}>
          Dispatch
        </button>
        <div className="fan-log" aria-live="polite">
          {logs.map((l, i) => (
            <div key={i}>
              {l.mark === 'go' && <b>→ </b>}
              {l.mark === 'ok' && <b>✔ </b>}
              {l.mark === 'bad' && <span className="x">✗ </span>}
              {l.mark === 'sum' && <b>= </b>}
              {l.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Ch.6 · the gauntlet ──────────────────────────────────── */

const GATE_DEFS = [
  { t: 'occupancy', pass: 'clear' },
  { t: 'lint + types', pass: 'pass' },
  { t: 'tests', pass: 'pass' },
  { t: 'fresh-eyes review', pass: 'pass' },
  { t: 'human go-ahead', pass: 'held' },
]
type GateState = 'idle' | 'running' | 'pass' | 'fail'

export function Gauntlet() {
  const reduced = useReducedMotion()
  const { schedule, clearAll } = useTimeouts()
  const [states, setStates] = useState<GateState[]>(() => GATE_DEFS.map(() => 'idle'))
  const [running, setRunning] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [log, setLog] = useState<React.ReactNode>(
    'Five checks stand between a generated diff and your main branch. Watch what happens the first time.',
  )
  const [btnLabel, setBtnLabel] = useState('Send a change through')

  const run = useCallback(() => {
    clearAll()
    const thisAttempt = attempt + 1
    setAttempt(thisAttempt)
    setStates(GATE_DEFS.map(() => 'idle'))
    setRunning(true)
    setLog(
      <>
        <b>Attempt {thisAttempt}.</b> Sending a generated diff toward main…
      </>,
    )
    const step = reduced ? 1 : 620
    const failAt = thisAttempt === 1 ? 3 : -1

    const advance = (i: number) => {
      if (i >= GATE_DEFS.length) {
        setRunning(false)
        setBtnLabel('Send another change')
        return
      }
      setStates((prev) => prev.map((s, j) => (j === i ? 'running' : s)))
      schedule(() => {
        if (i === failAt) {
          setStates((prev) => prev.map((s, j) => (j === i ? 'fail' : s)))
          setLog(
            <>
              <span className="x">✗ Gate 04 — fresh-eyes review.</span> A second model, reading the
              diff with no memory of writing it:{' '}
              <b>&quot;the retry loop swallows the error it retries on.&quot;</b>
              <br />
              Nothing reached main. That is the gate doing its entire job — and it is the one an
              agent grading its own work never fails.
            </>,
          )
          setRunning(false)
          setBtnLabel('Fix and re-run')
          return
        }
        setStates((prev) => prev.map((s, j) => (j === i ? 'pass' : s)))
        if (i === 0) {
          setLog(
            <>
              <span className="g">✔ Gate 01.</span> No one else is in this repo. Claimed for 4h.
            </>,
          )
        } else if (i === 1) {
          setLog(
            <>
              <span className="g">✔ Gate 02.</span> oxlint + tsc clean.
            </>,
          )
        } else if (i === 2) {
          setLog(
            <>
              <span className="g">✔ Gate 03.</span> 34 passed, 0 failed.
            </>,
          )
        } else if (i === 3) {
          setLog(
            <>
              <span className="g">✔ Gate 04.</span> Fresh reviewer signs off on the fix.
            </>,
          )
        } else if (i === 4) {
          setLog(
            <>
              <span className="g">✔ Four gates green.</span> Commit landed locally. The push is
              waiting on you — <b>and it will keep waiting.</b> Yesterday&apos;s &quot;ship it&quot;
              does not authorize today&apos;s push.
            </>,
          )
        }
        advance(i + 1)
      }, step)
    }
    advance(0)
  }, [attempt, clearAll, reduced, schedule])

  const stateLabel = (s: GateState, i: number): string => {
    if (s === 'idle') return 'idle'
    if (s === 'running') return 'running'
    if (s === 'fail') return 'blocked'
    return GATE_DEFS[i]?.pass ?? 'pass'
  }

  return (
    <div className="gauntlet rv">
      <div className="gates">
        {GATE_DEFS.map((g, i) => (
          <div
            key={g.t}
            className={`gate${states[i] === 'running' ? ' active' : ''}${states[i] === 'pass' ? ' pass' : ''}${states[i] === 'fail' ? ' fail' : ''}`}
          >
            <span className="g-n">Gate 0{i + 1}</span>
            <span className="g-t">{g.t}</span>
            <span className="g-s">{stateLabel(states[i] ?? 'idle', i)}</span>
          </div>
        ))}
      </div>
      <div className="gauntlet-out">
        <button className="btn" type="button" onClick={run} disabled={running}>
          {btnLabel}
        </button>
        <div className="gauntlet-log" aria-live="polite">
          {log}
        </div>
      </div>
    </div>
  )
}

/* ── Ch.7 · decision tree ─────────────────────────────────── */

export function DecisionTree() {
  const [path, setPath] = useState<string[]>([])
  const bodyRef = useRef<HTMLDivElement | null>(null)

  const go = (key: string, focus: boolean) => {
    setPath(key === 'root' ? [] : (prev) => [...prev, key])
    if (focus) {
      // Focus the new heading after render so keyboard/SR users land in the right place.
      requestAnimationFrame(() => {
        const h = bodyRef.current?.querySelector<HTMLElement>('.tree-q')
        if (h) {
          h.setAttribute('tabindex', '-1')
          h.focus({ preventScroll: true })
        }
      })
    }
  }

  const nodeKey = path[path.length - 1] ?? 'root'
  const node = TREE[nodeKey] ?? TREE_ROOT

  return (
    <div className="tree rv">
      <div className="tree-crumbs">
        <span className="cb">Chapter 07</span>
        {path.map((p) => {
          const n = TREE[p]
          const crumb = n && 'crumb' in n ? n.crumb : undefined
          if (!crumb) return null
          return (
            <span key={p}>
              <span className="sep">/ </span>
              <span>{crumb}</span>
            </span>
          )
        })}
      </div>
      <div ref={bodyRef}>
        {node.kind === 'question' ? (
          <>
            <h3 className="tree-q">{node.q}</h3>
            <p className="tree-sub">{node.sub}</p>
            <div className="tree-opts">
              {node.opts.map((o) => (
                <button
                  key={o.go}
                  className="tree-opt"
                  type="button"
                  onClick={() => go(o.go, true)}
                >
                  <span className="k">{o.k}</span>
                  <span className="t">
                    {o.t}
                    <small>{o.s}</small>
                  </span>
                  <span className="arw">→</span>
                </button>
              ))}
            </div>
            {path.length > 0 && (
              <div className="tree-reset-row">
                <button className="btn ghost" type="button" onClick={() => go('root', true)}>
                  ← Start over
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <h3 className="tree-q">{node.title}</h3>
            <div className="leaf-grid">
              <div>
                <blockquote className="leaf-quote">
                  “{node.quote}”<cite>Trey — draft voice, pending dictation</cite>
                </blockquote>
                <div className="leaf-actions">
                  <button className="btn" type="button" onClick={() => go('root', true)}>
                    Try another situation
                  </button>
                  <a className="btn ghost" href={node.ch[0]}>
                    Re-read {node.ch[1]}
                  </a>
                </div>
              </div>
              <ol className="leaf-steps">
                {node.steps.map((s: { lead: string; rest: string }) => (
                  <li key={s.lead}>
                    <b>{s.lead}</b>
                    {s.rest}
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Ch.8 · copy the prompt ───────────────────────────────── */

export function CopyPromptBlock({ text }: { text: string }) {
  const [label, setLabel] = useState('Copy')
  const { schedule, clearAll } = useTimeouts()
  const copy = async () => {
    let ok = true
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        // Insecure origins (e.g. LAN dev URLs) have no async clipboard.
        const ta = document.createElement('textarea')
        ta.value = text
        document.body.appendChild(ta)
        ta.select()
        ok = document.execCommand('copy')
        ta.remove()
      }
    } catch {
      ok = false
    }
    clearAll()
    setLabel(ok ? 'Copied ✓' : 'Copy failed — select it manually')
    schedule(() => setLabel('Copy'), 2400)
  }
  return (
    <div className="prompt-block rv">
      <div className="ph">
        <span>start-tonight.md</span>
        <button className="copy-btn" type="button" onClick={copy}>
          {label}
        </button>
      </div>
      <pre>{text}</pre>
    </div>
  )
}
