'use client'

import { useCallback, useRef, useState } from 'react'
import '@/components/stack/subagent-savings.css'
import { useOnceVisible, useReducedMotion, useTimeouts } from '@/components/stack/hooks'

type SavKey = 'solo' | 'fanout'
type Seg = [cls: string, count: number, label: string]

const MAIN_CELLS = 200
const SAT_CELLS = 60

const MAIN: Record<SavKey, { segs: Seg[]; used: string }> = {
  solo: {
    used: '172k used',
    segs: [
      ['s-sys', 8, 'System + tools'],
      ['s-noise', 62, 'Repo search'],
      ['s-sprawl', 48, 'Log sweep'],
      ['s-tool', 40, 'Docs it read to rule out'],
      ['s-task', 14, 'The actual fix'],
      ['s-free', 28, 'Headroom'],
    ],
  },
  fanout: {
    used: '52k used',
    segs: [
      ['s-sys', 8, 'System + tools'],
      ['s-brief', 10, 'The bug report'],
      ['s-verify', 12, 'Three conclusions, six lines each'],
      ['s-task', 22, 'The actual fix'],
      ['s-free', 148, 'Headroom'],
    ],
  },
}

const SATELLITES: { name: string; job: string; segs: Seg[] }[] = [
  {
    name: 'subagent · search',
    job: 'grepped 1,204 files',
    segs: [
      ['s-noise', 44, 'Repo search'],
      ['s-verify', 4, 'Conclusion'],
      ['s-free', 12, 'Headroom'],
    ],
  },
  {
    name: 'subagent · logs',
    job: 'swept 40k lines',
    segs: [
      ['s-sprawl', 40, 'Log sweep'],
      ['s-verify', 4, 'Conclusion'],
      ['s-free', 16, 'Headroom'],
    ],
  },
  {
    name: 'subagent · docs',
    job: 'read the SDK changelog',
    segs: [
      ['s-tool', 36, 'Docs it read to rule out'],
      ['s-verify', 4, 'Conclusion'],
      ['s-free', 20, 'Headroom'],
    ],
  },
]

const CAPS: Record<SavKey, { lead: string; body: string; tail?: string }> = {
  solo: {
    lead: 'One window doing all of it.',
    body: ' The fix is fourteen cells. Everything else is the looking — grepping the repo, sweeping logs, reading documentation it will never cite. You paid full price for every token of it, and all of it is still sitting in the window when the model finally writes the patch.',
  },
  fanout: {
    lead: 'Same bug. Same searching.',
    body: ' The repo search still happened. The log sweep still happened. Ten thousand tokens of it — in three windows you throw away when they are done. What comes back is six lines each. ',
    tail: 'The orchestrator writes the patch with three-quarters of its window still empty.',
  },
}

function cells(segs: Seg[], total: number): string[] {
  const out: string[] = []
  for (const [cls, count] of segs) {
    for (let i = 0; i < count; i += 1) out.push(cls)
  }
  while (out.length < total) out.push('s-free')
  return out.slice(0, total)
}

const LABELS: Record<SavKey, string> = {
  solo: 'One 200,000-token context window, more than four-fifths of it filled with repo search, log sweeping and documentation reading, leaving the actual fix a sliver and almost no headroom.',
  fanout:
    'The same 200,000-token window holding only the bug report, three short conclusions and the fix, three-quarters empty, while three small subagent windows beside it absorb the repo search, the log sweep and the documentation reading and pipe one thin conclusion each back up into it.',
}

export function SubagentSavings() {
  const reduced = useReducedMotion()
  const [mode, setMode] = useState<SavKey>('solo')
  const { schedule, clearAll } = useTimeouts()
  const nudged = useRef(false)

  const paint = useCallback(
    (key: SavKey) => {
      clearAll()
      setMode(key)
    },
    [clearAll],
  )

  const figRef = useOnceVisible<HTMLDivElement>(() => {
    if (reduced || nudged.current) return
    nudged.current = true
    schedule(() => paint('fanout'), 2600)
  }, 0.4)

  const main = MAIN[mode]
  const mainCells = cells(main.segs, MAIN_CELLS)
  const fanned = mode === 'fanout'

  return (
    <div className="sfig rv" ref={figRef}>
      <div className="sfig-head">
        <span className="t">
          Fixing one bug · <b>the same total work</b> · every cell ≈ 500 tokens
        </span>
        <div className="sfig-toggle" role="group" aria-label="Where the searching happens">
          <button type="button" aria-pressed={!fanned} onClick={() => paint('solo')}>
            One window
          </button>
          <button type="button" aria-pressed={fanned} onClick={() => paint('fanout')}>
            With subagents
          </button>
        </div>
      </div>

      <div className="sfig-stage" role="img" aria-label={LABELS[mode]}>
        <div className="sfig-win sfig-main">
          <div className="sfig-win-head">
            <span className="n">orchestrator</span>
            <span className="v">{main.used} / 200k</span>
          </div>
          <div className="sfig-cells" aria-hidden="true">
            {mainCells.map((cls, i) => (
              <i
                key={i}
                className={cls}
                style={reduced ? undefined : { transitionDelay: `${(i * 1.6).toFixed(1)}ms` }}
              />
            ))}
          </div>
        </div>

        <div className={`sfig-fan${fanned ? ' is-on' : ''}`} aria-hidden="true">
          <div className="sfig-pipes">
            {SATELLITES.map((s) => (
              <span key={s.name} className="sfig-pipe" />
            ))}
          </div>
          <div className="sfig-sats">
            {SATELLITES.map((s, si) => (
              <div className="sfig-win sfig-sat" key={s.name}>
                <div className="sfig-win-head">
                  <span className="n">{s.name}</span>
                  <span className="v">{s.job}</span>
                </div>
                <div className="sfig-cells">
                  {cells(s.segs, SAT_CELLS).map((cls, i) => (
                    <i
                      key={i}
                      className={fanned ? cls : 's-free'}
                      style={
                        reduced
                          ? undefined
                          : { transitionDelay: `${(260 + si * 90 + i * 3).toFixed(0)}ms` }
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sfig-legend">
        {main.segs.map(([cls, , label]) => (
          <span key={cls + label}>
            <i className={cls} />
            {label}
          </span>
        ))}
      </div>

      {/* Both captions occupy one grid cell, so the block always reserves the
          taller of the two and toggling never moves the page. */}
      <div className="sfig-caps">
        {(Object.keys(CAPS) as SavKey[]).map((key) => {
          const c = CAPS[key]
          const on = key === mode
          return (
            <p
              className={`sfig-cap${on ? ' is-on' : ''}`}
              key={key}
              aria-hidden={on ? undefined : true}
            >
              <b>{c.lead}</b>
              {c.body}
              {c.tail ? <b>{c.tail}</b> : null}
            </p>
          )
        })}
      </div>
    </div>
  )
}
