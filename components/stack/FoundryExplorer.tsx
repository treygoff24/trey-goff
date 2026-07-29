'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import '@/components/stack/foundry-explorer.css'
import { useReducedMotion } from '@/components/stack/hooks'

/* ── The topology ─────────────────────────────────────────────
   Every number below is the fan-out the skill and the ship-it
   spine actually prescribe. `agents` lives on leaves only, so the
   dispatched total is the sum of the tree and cannot drift from
   what the map draws. */

type Family = 'anthropic' | 'openai' | 'xai' | 'human'

type Kind = 'phase' | 'workflow' | 'fanout' | 'gate' | 'loop'

type FNode = {
  id: string
  label: string
  kind: Kind
  /** agent runs dispatched in the reference configuration; leaves only */
  agents: number
  fanout: string
  gate: string
  families: Family[]
  what: string
  /** the hard stop, where the node is a loop */
  cap?: string
  optional?: boolean
  children?: FNode[]
}

const FAMILY_LABEL: Record<Family, string> = {
  anthropic: 'anthropic',
  openai: 'openai',
  xai: 'xai',
  human: 'me',
}

const WAVE_REPEAT = 3

const PHASES: FNode[] = [
  {
    id: 'frame',
    label: 'frame',
    kind: 'phase',
    agents: 0,
    fanout: 'coordinator only — no children',
    gate: 'repo, license and task chain committed',
    families: ['human'],
    what: 'Name the product, pick the repo and the license, agree the secrets, the spend ceiling and which metered gates I have pre-approved. Scaffold it, then write a dependency-ordered task chain and seed BUILD-STATE.md — the scratch ledger every later stage reads and updates.',
  },
  {
    id: 'design',
    label: 'design',
    kind: 'phase',
    agents: 0,
    fanout: 'coordinator only — no children',
    gate: 'a complete design doc, committed',
    families: ['human'],
    what: 'One document: evidence, contract, state, costs, dependencies, tests, non-goals, and the wave plan. Nothing gets built off a design that is missing its non-goals — that omission is how a build quietly triples in scope on wave two.',
  },
  {
    id: 'design-review',
    label: 'design review',
    kind: 'phase',
    agents: 1,
    fanout: '1 cross-family reviewer, read-only',
    gate: 'every finding accepted or rejected in writing',
    families: ['openai'],
    what: 'Codex reads the design in safe mode, isolated and read-only. I disposition every finding in writing, amend the design, commit. A second Anthropic-family reviewer is additive but does not satisfy decorrelation — two reads from one pretraining run are one read.',
  },
  {
    id: 'waves',
    label: 'waves',
    kind: 'phase',
    agents: 0,
    fanout: '2–4 waves, sequential',
    gate: 'every wave gated, swept, read, reviewed, fixed, re-reviewed, committed',
    families: ['anthropic', 'openai', 'xai'],
    what: 'Foundation, then core engine, then surface. Each wave is the same three-part machine and the coordinator stays outside all of it — I merge and I gate, I do not write inside a lane. The subtree below runs once per wave.',
    children: [
      {
        id: 'wave-execute',
        label: 'wave-execute',
        kind: 'workflow',
        agents: 0,
        fanout: 'one lane per owned task',
        gate: 'a valid report and a commit from every lane',
        families: ['anthropic', 'openai'],
        what: 'A nested workflow, not a prompt. It opens N isolated worktrees and puts one task agent in each, so no two lanes can touch the same working copy. A lane is either a native Claude worker or a thin Claude supervisor driving an external model.',
        children: [
          {
            id: 'lanes',
            label: 'task agents · isolated worktrees',
            kind: 'fanout',
            agents: 4,
            fanout: 'N parallel lanes (4 shown)',
            gate: 'coordinator merges, one branch at a time',
            families: ['anthropic', 'openai'],
            what: 'The only nodes in the whole system that write product code. Each one owns its files, its worktree and its branch, and each one has to come back with a report I can check against the diff.',
          },
        ],
      },
      {
        id: 'wave-gate',
        label: 'coordinator verification',
        kind: 'gate',
        agents: 0,
        fanout: 'coordinator only — no children',
        gate: 'canonical gate passes, five-run test sweep is clean, riskiest files read',
        families: ['human'],
        what: 'I run the gate command myself and sweep the tests five times to catch the flake that passes once. Then I read the one or two riskiest files by hand. This node is the reason the rest of the graph is trustworthy: it is the one place a human looks at the actual code.',
      },
      {
        id: 'wave-review',
        label: 'wave-review',
        kind: 'workflow',
        agents: 0,
        fanout: '3 lenses, then verifiers, then a capped fix loop',
        gate: 'no accepted findings left standing',
        families: ['anthropic', 'openai', 'xai'],
        what: 'The adversarial half of a wave, and a nested workflow in its own right. Three lenses attack the merged wave, every finding gets independently tested before anyone is allowed to fix it, and the repair loop is capped.',
        children: [
          {
            id: 'lenses',
            label: 'adversarial lenses',
            kind: 'fanout',
            agents: 3,
            fanout: '3 parallel reviewers, one per family',
            gate: 'coordinator accepts or rejects each finding',
            families: ['anthropic', 'openai', 'xai'],
            what: 'One Opus lens, one Claude driver into Codex safe mode, one Claude driver into Cursor safe mode. Three labs, three sets of blind spots. The disagreement between them is the product — a finding all three miss is a finding no amount of re-reading by one of them would have caught.',
          },
          {
            id: 'verifiers',
            label: 'per-finding verifiers',
            kind: 'fanout',
            agents: 3,
            fanout: 'up to one verifier per finding, parallel',
            gate: 'only reproduced findings enter the fix list',
            families: ['anthropic'],
            what: 'Each verifier tries to reproduce one finding. It is explicitly forbidden from repairing anything — a verifier that fixes what it found has destroyed the evidence and graded its own paper. Findings that do not reproduce are dropped, in writing.',
          },
          {
            id: 'fix-loop',
            label: 'fix and re-review',
            kind: 'loop',
            agents: 2,
            fanout: '1 fixer, then 1 re-verifier, per round',
            gate: 'no accepted findings, or the cap',
            families: ['anthropic'],
            cap: 'max 3 rounds · halt on no progress',
            what: 'The fixer repairs only accepted findings; a scoped re-verifier confirms each repair. Three rounds is the hard ceiling, and a round that makes no progress stops the loop early rather than spending the third one. Uncapped repair loops are how a build burns a night on a finding that was never real.',
          },
        ],
      },
    ],
  },
  {
    id: 'spec-audit',
    label: 'spec-audit',
    kind: 'phase',
    agents: 0,
    fanout: 'S section auditors, then a capped repair',
    gate: 'every spec section accounted for',
    families: ['anthropic'],
    what: 'The waves built what the task chain said. This asks the different question: does the finished thing match the spec it was supposed to implement? Section by section, against the document, not against the diff.',
    children: [
      {
        id: 'auditors',
        label: 'section auditors',
        kind: 'fanout',
        agents: 1,
        fanout: 'S auditors (default 1)',
        gate: 'a written verdict per section',
        families: ['anthropic'],
        what: 'One agent per spec section, each holding only its own section and the code that claims to implement it. Small windows beat one big one here for the same reason they do everywhere: an agent with fifty sections gets bored at section thirty-six.',
      },
      {
        id: 'spec-fix',
        label: 'fix and re-audit',
        kind: 'loop',
        agents: 2,
        fanout: '1 fixer, 1 re-auditor',
        gate: 'the re-audit comes back clean',
        families: ['anthropic'],
        cap: 'capped, like every loop here',
        what: 'Same shape as the wave fix loop, pointed at spec drift rather than defects. Every iterative structure in this system carries a round cap, a no-progress halt and a share of the per-build spend ceiling.',
      },
    ],
  },
  {
    id: 'post-audit-review',
    label: 'wave-review, again',
    kind: 'workflow',
    agents: 8,
    fanout: 'the same three-lens topology, whole-surface',
    gate: 'no accepted findings left standing',
    families: ['anthropic', 'openai', 'xai'],
    what: 'The identical nested workflow from inside the waves, re-entered once at the top level and pointed at the assembled product. Three lenses, per-finding verifiers, a capped fix loop. The point of workflows being callable is exactly this: the review machine is one thing, reused, not three prompts that have drifted apart.',
  },
  {
    id: 'desloppify',
    label: 'desloppify-loop',
    kind: 'phase',
    agents: 0,
    fanout: '8 axes sequentially, per round',
    gate: 'a round that produces no changes',
    families: ['anthropic'],
    cap: 'max 5 rounds',
    what: 'The cleanup pass. It runs until a full round changes nothing, which is a much better stopping rule than a fixed number of passes — you find out how much slop there was rather than deciding in advance.',
    children: [
      {
        id: 'axes',
        label: 'cleanup axes',
        kind: 'fanout',
        agents: 8,
        fanout: '8 axes, sequential',
        gate: 'each axis is behavior-preserving',
        families: ['anthropic'],
        what: 'Duplicated logic, drifted types, dead code, dependency cycles, weak types, defensive error-hiding, legacy fallback paths, and AI comment slop. Sequential rather than parallel because they edit the same files and would collide.',
      },
      {
        id: 'gate-commit',
        label: 'gate and commit agent',
        kind: 'fanout',
        agents: 1,
        fanout: '1 per round',
        gate: 'the gate passes before the round is committed',
        families: ['anthropic'],
        what: 'Runs the project gate and commits the round, so a round that breaks the build never lands. The coordinator still merges and gates on top of it.',
      },
    ],
  },
  {
    id: 'perf',
    label: 'performance hardening',
    kind: 'loop',
    agents: 2,
    fanout: '1 auditor + 1 fixer per round',
    gate: 'the written loss function stops improving',
    families: ['anthropic'],
    cap: 'max 4 rounds',
    what: 'An optimization loop is only allowed to run if I have written down what it is optimizing first. Without a loss function an agent will happily spend four rounds making something faster that nobody was waiting on.',
  },
  {
    id: 'security',
    label: 'security hardening',
    kind: 'loop',
    agents: 2,
    fanout: '1 auditor + 1 fixer per round',
    gate: 'no accepted findings',
    families: ['anthropic'],
    cap: 'max 4 rounds',
    optional: true,
    what: 'Same shape as performance, different lens. Optional because not every build has an attack surface worth four rounds — and a security pass on a local CLI toy is theater.',
  },
  {
    id: 'journey',
    label: 'journey-smoke',
    kind: 'phase',
    agents: 5,
    fanout: 'J parallel journey agents + 1 fixer',
    gate: 'every journey completes end to end',
    families: ['anthropic'],
    cap: 'max 6 rounds',
    optional: true,
    what: 'One agent per real user journey, each walking the product the way a person would rather than the way the tests do. This is the stage that catches the thing where every unit test passes and the actual first-run experience is broken.',
  },
  {
    id: 'acceptance',
    label: 'live acceptance',
    kind: 'gate',
    agents: 0,
    fanout: 'coordinator, with fix lanes only when needed',
    gate: 'zero unexplained failures; every waiver has a reason',
    families: ['human'],
    what: 'In order, and the order matters: dry-run arithmetic, then a deliberately tiny budget to prove the kill path works, then a resume to prove the run survives dying, then one full real run, then known-answer tasks where I already know what it should say. Measured time, cost and counts get written down.',
  },
  {
    id: 'elegance',
    label: 'elegance-audit',
    kind: 'workflow',
    agents: 4,
    fanout: '3 parallel judges + 1 synthesizer',
    gate: 'read-only — it may not mutate anything',
    families: ['anthropic', 'openai', 'xai'],
    what: 'The last word, and it has no hands. Three judges read the finished product independently and a synthesizer reconciles them into one report. It cannot change a line — a judge that can edit will fix its own complaint and report a clean bill of health.',
  },
  {
    id: 'ship',
    label: 'ship',
    kind: 'phase',
    agents: 0,
    fanout: 'coordinator only — no children',
    gate: 'both repos committed and clean',
    families: ['human'],
    what: 'Update the project journal and promote what the build taught me: session logs become memory, memory becomes a skill, a skill becomes policy. Remote setup, CI and publishing stay my decision and never the machine’s.',
  },
]

/* ── Derived structure ────────────────────────────────────── */

type Flat = { node: FNode; depth: number; path: string[]; inWave: boolean }

function flatten(nodes: FNode[], depth: number, path: string[], inWave: boolean): Flat[] {
  const out: Flat[] = []
  for (const node of nodes) {
    const nextPath = [...path, node.label]
    const wave = inWave || node.id === 'waves'
    out.push({ node, depth, path, inWave: wave && node.id !== 'waves' })
    if (node.children) out.push(...flatten(node.children, depth + 1, nextPath, wave))
  }
  return out
}

const FLAT = flatten(PHASES, 0, [], false)
const BY_ID = new Map(FLAT.map((f) => [f.node.id, f]))

const TOTAL_AGENTS = FLAT.reduce((sum, f) => sum + f.node.agents * (f.inWave ? WAVE_REPEAT : 1), 0)
const MAX_DEPTH = FLAT.reduce((m, f) => Math.max(m, f.depth), 0)
/** running total of agent runs after each stage, for the dispatch readout */
const CUMULATIVE = FLAT.reduce<number[]>((acc, f) => {
  const prev = acc.length > 0 ? (acc[acc.length - 1] ?? 0) : 0
  acc.push(prev + f.node.agents * (f.inWave ? WAVE_REPEAT : 1))
  return acc
}, [])

const STEP_MS = 260

const STAGE_COUNT = FLAT.length
const LOOP_COUNT = FLAT.filter((f) => f.node.cap).length

const READOUT: { k: string; v: string; note: string }[] = [
  { k: 'agents dispatched', v: String(TOTAL_AGENTS), note: 'one reference build, waves ×3' },
  { k: 'model families', v: '3', note: 'anthropic · openai · xai' },
  { k: 'nesting tiers', v: String(MAX_DEPTH + 1), note: 'workflows inside workflows' },
  { k: 'stages', v: String(STAGE_COUNT), note: 'each with a written exit condition' },
  { k: 'unbounded loops', v: '0', note: `${LOOP_COUNT} loops, every one capped` },
]

/* ── The intro ────────────────────────────────────────────── */

export function NestedWorkflowsIntro() {
  return (
    <>
      <p className="section-label">And then one step further than that</p>
      <p className="lede rv">
        Everything above is one workflow calling agents. What I actually run is workflows calling
        workflows calling agents — and the stages inside one graph do not all belong to the same
        company.
      </p>

      <div className="twoup">
        <div className="rv">
          <h3>Decorrelation as an architectural primitive</h3>
          <p>
            In a native workflow every stage is a Claude. Fresh windows, different models, different
            subagent types — but one pretraining run underneath all of it. In mine, every{' '}
            <span className="inline-code">agent()</span> call takes an engine, so a single graph can
            author on Codex, review on Cursor and Kimi, judge on Claude, and fall back to a fourth
            harness when one is down.{' '}
            <b>
              That is not a convenience feature. It is the difference between checking work three
              times and having it checked by three different minds.
            </b>
          </p>
          <p>
            The routing is per stage, not per run, which means decorrelation stops being a habit I
            have to remember and becomes a property of the graph. If the author lane and the review
            lane resolve to the same family, that is a bug in the workflow, visible in the script,
            fixable in one line.
          </p>
        </div>
        <div className="rv" data-d="1">
          <h3>Workflows inside workflows, three levels down</h3>
          <p>
            The native tool is explicit about its limit: nesting is one level, and a{' '}
            <span className="inline-code">workflow()</span> call inside a child throws. Mine allows
            three edges below the root, and the child runs <em>inside the same supervisor</em> —
            same run id, same append-only journal, same budget, same gate state.
          </p>
          <p>
            That inheritance is what makes composition worth anything.{' '}
            <b>
              A gate anywhere in the tree drains the entire tree and pauses the whole run until I
              approve it,{' '}
            </b>
            from my phone, tomorrow. Kill it mid-flight and resume replays every finished agent from
            the journal by structural key rather than paying for it twice. Native workflows have
            neither primitive: no gate in the DSL, no durable journal in the contract.
          </p>
        </div>
      </div>

      <div className="fx-contrast rv">
        <div className="fx-contrast-row fx-contrast-head" aria-hidden="true">
          <span />
          <span>native Workflow</span>
          <span>what I run</span>
        </div>
        <div className="fx-contrast-row">
          <span className="fx-c-k">nesting</span>
          <span>one level — a child may not call a workflow</span>
          <span className="fx-c-mine">three edges below root, inline in one supervisor</span>
        </div>
        <div className="fx-contrast-row">
          <span className="fx-c-k">routing</span>
          <span>subagents; model and agent type may vary</span>
          <span className="fx-c-mine">per-stage codex · cursor · grok · droid · kimi · claude</span>
        </div>
        <div className="fx-contrast-row">
          <span className="fx-c-k">durable state</span>
          <span>not in the local contract</span>
          <span className="fx-c-mine">pinned script and args, append-only journal, replay</span>
        </div>
        <div className="fx-contrast-row">
          <span className="fx-c-k">human gate</span>
          <span>no gate primitive</span>
          <span className="fx-c-mine">tree-wide pause, resumable approval</span>
        </div>
      </div>

      <p className="section-label">The full grandeur</p>
      <p className="lede rv">
        So here is the whole thing. This is what happens when I point{' '}
        <span className="inline-code">/foundry</span> at an idea and go to bed: a build system deep
        enough that no single window ever holds it, drawn honestly, every fan-out and every cap the
        real one has.
      </p>
    </>
  )
}

/* ── The explorer ─────────────────────────────────────────── */

const KIND_TAG: Record<Kind, string> = {
  phase: 'phase',
  workflow: 'nested workflow',
  fanout: 'agent fan-out',
  gate: 'coordinator gate',
  loop: 'capped loop',
}

function NodeButton({
  entry,
  selected,
  live,
  done,
  onSelect,
}: {
  entry: Flat
  selected: boolean
  live: boolean
  done: boolean
  onSelect: (id: string) => void
}) {
  const { node, depth } = entry
  const cls = [
    'fx-node',
    `fx-k-${node.kind}`,
    `fx-d-${depth}`,
    selected ? 'is-sel' : '',
    live ? 'is-live' : '',
    done ? 'is-done' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={cls}
      data-fx-node={node.id}
      aria-pressed={selected}
      onClick={() => onSelect(node.id)}
    >
      <span className="fx-node-rail" aria-hidden="true" />
      <span className="fx-node-main">
        <span className="fx-node-label">{node.label}</span>
        <span className="fx-node-meta">{node.fanout}</span>
      </span>
      <span className="fx-node-tail">
        {node.cap ? <span className="fx-cap">↻ capped</span> : null}
        {node.optional ? <span className="fx-opt">optional</span> : null}
        {node.agents > 0 ? (
          <span className="fx-count">
            {node.agents}
            <i> {node.agents === 1 ? 'run' : 'runs'}</i>
          </span>
        ) : null}
        <span className="fx-fams" aria-hidden="true">
          {node.families.map((f) => (
            <i key={f} className={`fx-fam fx-fam-${f}`} />
          ))}
        </span>
      </span>
    </button>
  )
}

function Branch({
  nodes,
  depth,
  selected,
  liveId,
  doneIds,
  onSelect,
}: {
  nodes: FNode[]
  depth: number
  selected: string | null
  liveId: string | null
  doneIds: Set<string>
  onSelect: (id: string) => void
}) {
  return (
    <ul className={`fx-branch fx-branch-${depth}`}>
      {nodes.map((node) => {
        const entry = BY_ID.get(node.id)
        if (!entry) return null
        return (
          <li key={node.id} className="fx-item">
            <NodeButton
              entry={entry}
              selected={selected === node.id}
              live={liveId === node.id}
              done={doneIds.has(node.id)}
              onSelect={onSelect}
            />
            {node.children ? (
              <div className="fx-nest">
                <span className="fx-nest-tag" aria-hidden="true">
                  depth {depth + 1}
                </span>
                <Branch
                  nodes={node.children}
                  depth={depth + 1}
                  selected={selected}
                  liveId={liveId}
                  doneIds={doneIds}
                  onSelect={onSelect}
                />
              </div>
            ) : null}
            {node.id === 'waves' ? (
              <p className="fx-repeat">
                the three nodes above run once per wave — foundation, core engine, surface
              </p>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

function DetailCard({ entry, onDismiss }: { entry: Flat | null; onDismiss: () => void }) {
  if (!entry) {
    return (
      <div className="fx-detail fx-detail-rest">
        <p className="fx-rest-k">nothing selected</p>
        <p className="fx-rest-p">
          Pick any node in the map to see what it does, how wide it fans out, what it has to satisfy
          before the build moves on, and which model families it routes to.
        </p>
        <p className="fx-rest-p">
          Every node is a button. Arrow keys walk the tree; Escape closes a card.
        </p>
      </div>
    )
  }

  const { node, path, inWave } = entry
  const runs = node.agents * (inWave ? WAVE_REPEAT : 1)

  return (
    <div className="fx-detail" role="region" aria-live="polite" aria-label="Selected node detail">
      <div className="fx-d-head">
        <span className="fx-d-kind">{KIND_TAG[node.kind]}</span>
        <button type="button" className="fx-d-close" onClick={onDismiss}>
          close<span className="fx-sr"> node detail</span>
        </button>
      </div>
      <h4 className="fx-d-title">{node.label}</h4>
      <p className="fx-d-path">{['foundry', ...path].join(' › ')}</p>
      <p className="fx-d-what">{node.what}</p>

      <dl className="fx-d-facts">
        <div>
          <dt>fan-out</dt>
          <dd>{node.fanout}</dd>
        </div>
        <div>
          <dt>gate</dt>
          <dd>{node.gate}</dd>
        </div>
        {node.cap ? (
          <div>
            <dt>hard stop</dt>
            <dd className="fx-d-cap">{node.cap}</dd>
          </div>
        ) : null}
        {runs > 0 ? (
          <div>
            <dt>agent runs</dt>
            <dd>
              {runs}
              {inWave ? ` — ${node.agents} per wave, ${WAVE_REPEAT} waves` : ''}
            </dd>
          </div>
        ) : null}
        <div>
          <dt>routes to</dt>
          <dd className="fx-d-fams">
            {node.families.map((f) => (
              <span key={f} className={`fx-d-fam fx-fam-${f}`}>
                {FAMILY_LABEL[f]}
              </span>
            ))}
          </dd>
        </div>
      </dl>
    </div>
  )
}

export function FoundryExplorer() {
  const reduced = useReducedMotion()
  const [selected, setSelected] = useState<string | null>('waves')
  /* One cursor, one timer, advanced by an effect. A fan of 24 queued
     timeouts is what this used to be, and a dropped tail timeout left the
     sweep stuck mid-run with no way back to rest. */
  const [step, setStep] = useState<number | null>(null)
  const mapRef = useRef<HTMLDivElement | null>(null)
  const detailRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (step === null) return
    const t = setTimeout(() => setStep(step + 1 > FLAT.length ? null : step + 1), STEP_MS)
    return () => clearTimeout(t)
  }, [step])

  const running = step !== null
  const liveId = step !== null && step < FLAT.length ? (FLAT[step]?.node.id ?? null) : null
  const dispatched =
    step === null ? TOTAL_AGENTS : (CUMULATIVE[Math.min(step, FLAT.length - 1)] ?? 0)

  const doneIds = useMemo(() => {
    if (step === null) return new Set(FLAT.map((f) => f.node.id))
    return new Set(FLAT.slice(0, step).map((f) => f.node.id))
  }, [step])

  const onSelect = useCallback((id: string) => {
    setSelected(id)
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches) {
      detailRef.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [])

  const dismiss = useCallback(() => {
    const id = selected
    setSelected(null)
    if (id) {
      const el = mapRef.current?.querySelector<HTMLButtonElement>(`[data-fx-node="${id}"]`)
      el?.focus()
    }
  }, [selected])

  const run = useCallback(() => setStep(0), [])

  /* Scoped to the figure rather than the window: Escape belongs to whoever
     holds focus, and a global listener would close this card from anywhere
     on the page. */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Escape') {
        if (selected) {
          e.stopPropagation()
          dismiss()
        }
        return
      }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      const root = mapRef.current
      if (!root) return
      const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-fx-node]'))
      const here = buttons.indexOf(document.activeElement as HTMLButtonElement)
      if (here < 0) return
      const next = buttons[here + (e.key === 'ArrowDown' ? 1 : -1)]
      if (!next) return
      e.preventDefault()
      next.focus()
    },
    [selected, dismiss],
  )

  const entry = selected ? (BY_ID.get(selected) ?? null) : null

  return (
    <figure className={`fx-shell rv${running ? ' is-running' : ''}`} onKeyDown={onKeyDown}>
      <div className="fx-bar">
        <div className="fx-bar-id">
          <span className="fx-bar-cmd">/foundry</span>
          <span className="fx-bar-sub">build topology · one idea to a shipped product</span>
        </div>
        {reduced ? (
          <span className="fx-bar-static">at rest — every stage shown complete</span>
        ) : (
          <button type="button" className="fx-run" onClick={run} disabled={running}>
            {running ? 'dispatching…' : 'run the build'}
          </button>
        )}
      </div>

      <div className="fx-readout">
        {READOUT.map((r) => (
          <div key={r.k} className="fx-stat">
            <span className="fx-stat-v">{r.k === 'agents dispatched' ? dispatched : r.v}</span>
            <span className="fx-stat-k">{r.k}</span>
            <span className="fx-stat-n">{r.note}</span>
          </div>
        ))}
      </div>

      <div className="fx-body">
        <div
          className="fx-map"
          ref={mapRef}
          role="group"
          aria-label="Foundry build topology — every stage is a button that opens its detail"
        >
          <Branch
            nodes={PHASES}
            depth={0}
            selected={selected}
            liveId={liveId}
            doneIds={doneIds}
            onSelect={onSelect}
          />
        </div>

        <div className="fx-side" ref={detailRef}>
          <DetailCard entry={entry} onDismiss={dismiss} />
          <ul className="fx-legend">
            <li>
              <i className="fx-fam fx-fam-anthropic" aria-hidden="true" /> anthropic
            </li>
            <li>
              <i className="fx-fam fx-fam-openai" aria-hidden="true" /> openai
            </li>
            <li>
              <i className="fx-fam fx-fam-xai" aria-hidden="true" /> xai
            </li>
            <li>
              <i className="fx-fam fx-fam-human" aria-hidden="true" /> coordinator
            </li>
          </ul>
        </div>
      </div>

      <figcaption className="fx-cap-text">
        <b>Seventy agent runs, three labs, and not one unbounded loop. </b>
        The counts are the fan-outs the system actually prescribes, summed — indented nodes are
        workflows running inside workflows, and everything under <b>waves </b>runs three times. Two
        rules hold everywhere in this picture: the coordinator owns every gate and never writes
        inside a lane, and no reviewer is allowed to fix what it found. One honest footnote —{' '}
        <span className="inline-code">/foundry</span> is the playbook I follow and{' '}
        <span className="inline-code">ship-it</span> is the executable spine that runs most of it.
        Two systems that agree, not one binary.
      </figcaption>
    </figure>
  )
}
