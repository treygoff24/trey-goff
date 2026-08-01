'use client'

import { useId, useMemo, useState } from 'react'

import { useReducedMotion, useTimeouts } from '@/components/stack/hooks'
import '@/components/stack/tools-showcase.css'

/* ── The armory ──────────────────────────────────────────────
   Every command-line tool this machine's agents actually reach
   for, sorted by where it came from. Three provenances, five
   jobs, one green. Data is static: SSR renders the full ledger,
   filtering is pure client state.
   ──────────────────────────────────────────────────────────── */

type Origin = 'mine' | 'unreleased' | 'ecosystem'
type Job = 'research' | 'orchestration' | 'code' | 'media' | 'machine'

type Tool = {
  name: string
  origin: Origin
  job: Job
  /** One honest line on the role it plays in this stack. */
  role: string
  /** Verified install one-liner. Absent means nothing to install. */
  install?: string
  href?: string
  /** Shown instead of an install line for tools that live on one machine. */
  note?: string
}

const ORIGINS: { key: Origin; label: string; gloss: string }[] = [
  { key: 'mine', label: 'Mine, open source', gloss: 'Built here, released. Take them.' },
  { key: 'unreleased', label: 'Built here', gloss: 'Written for this machine. Not released.' },
  { key: 'ecosystem', label: 'Ecosystem', gloss: "Other people's work, load-bearing here." },
]

const JOBS: { key: Job; label: string }[] = [
  { key: 'research', label: 'Research' },
  { key: 'orchestration', label: 'Orchestration' },
  { key: 'code', label: 'Code & repo' },
  { key: 'media', label: 'Media & assets' },
  { key: 'machine', label: 'Machine' },
]

const TOOLBOX: Tool[] = [
  {
    name: 'post',
    origin: 'mine',
    job: 'orchestration',
    role: 'A mailbox so the agents on one machine can write each other — direct mail, channels, a doorbell. Built by Claude instances for their own use.',
    install: 'git clone https://github.com/treygoff24/post',
    href: 'https://github.com/treygoff24/post',
  },
  {
    name: 'delegate',
    origin: 'mine',
    job: 'orchestration',
    role: 'Hands a bounded task to Codex, Cursor, Grok, Kimi, or a dozen other harnesses without leaving the session. Read-only and edit-capable modes.',
    install: 'uv tool install delegate-agent-cli',
    href: 'https://github.com/treygoff24/delegate-agent',
  },
  {
    name: 'papercuts',
    origin: 'mine',
    job: 'orchestration',
    role: 'The complaint box. An agent hits friction mid-task, files it, and keeps going; I clear the backlog once a week and the environment improves on its own.',
    install: 'cargo install papercuts',
    href: 'https://github.com/treygoff24/papercuts',
  },
  {
    name: 'receipts',
    origin: 'mine',
    job: 'research',
    role: 'Every answer arrives with a source URL, a verbatim quote, and a verdict — the gate a claim passes before it ships in a document.',
    install: 'brew install treygoff24/tap/receipts',
    href: 'https://github.com/treygoff24/receipts',
  },
  {
    name: 'exa-agent',
    origin: 'mine',
    job: 'research',
    role: 'The full Exa API as 68 agent-callable operations. The default web-research lane here: fastest and cheapest of the three I benchmarked.',
    install: 'brew install treygoff24/tap/exa-agent',
    href: 'https://github.com/treygoff24/exa-agent-cli',
  },
  {
    name: 'scout',
    origin: 'mine',
    job: 'code',
    role: 'Orientation in an unfamiliar directory, fast and hallucination-firewalled — what an agent runs before it believes anything about a codebase.',
    install: 'brew install treygoff24/tap/scout',
    href: 'https://github.com/treygoff24/scout',
  },
  {
    name: 'lens',
    origin: 'mine',
    job: 'media',
    role: 'Natural-language search over an image library. Caption once with a vision model, then query the whole index in a single call. No vector database.',
    install: 'brew install treygoff24/tap/lens',
    href: 'https://github.com/treygoff24/lens',
  },
  {
    name: 'elv',
    origin: 'mine',
    job: 'media',
    role: 'The entire ElevenLabs API — speech, transcription, dubbing, voice cloning — as one JSON envelope per command.',
    install: 'git clone https://github.com/treygoff24/elv.git',
    href: 'https://github.com/treygoff24/elv',
  },

  {
    name: 'ask',
    origin: 'unreleased',
    job: 'orchestration',
    role: 'Pages my phone and blocks until I reply. An agent working while I am out gets one judgment call from me instead of stalling until I am back at the desk.',
    note: 'One paragraph of spec, written in an afternoon. Blueprint below.',
  },
  {
    name: 'fleet',
    origin: 'unreleased',
    job: 'orchestration',
    role: 'Machine-wide swarm occupancy: which agent holds which repository, and where two writers are about to collide. Exit codes are the whole API.',
    note: 'Runs against local process and claim state. Nothing to install elsewhere yet.',
  },
  {
    name: 'radar',
    origin: 'unreleased',
    job: 'research',
    role: 'A production news monitor for the policy world I work in. Agents query what it has already seen before they go searching the open web.',
    note: 'Read-only client over a private production system.',
  },
  {
    name: 'law',
    origin: 'unreleased',
    job: 'research',
    role: 'Source-grounded legal research: citation extraction and verification, corpus search, docket lookup, adversarial review of a draft brief.',
    note: 'In private use while the corpus handling settles.',
  },
  {
    name: 'claude-skill',
    origin: 'unreleased',
    job: 'machine',
    role: 'Search, activate, and promote skills across a library of roughly three hundred — without loading a single one into the context window to find it.',
    note: 'Wraps a local skill library layout. Not portable yet.',
  },
  {
    name: 'memoryd',
    origin: 'unreleased',
    job: 'machine',
    role: 'A daemon-backed memory layer shared across Claude Code, Codex, and Cursor, so what one harness learns the next one already knows.',
    note: 'Design and hardening in progress.',
  },
  {
    name: 'morning',
    origin: 'unreleased',
    job: 'machine',
    role: 'Post-overnight triage: a restart verdict, a census of every agent process still alive, and orphaned dev servers cleaned up before I sit down.',
    note: 'Tuned to this machine. Agents run it report-only.',
  },

  {
    name: 'ripgrep',
    origin: 'ecosystem',
    job: 'code',
    role: 'Every code search an agent runs on this repository. Respects .gitignore, returns in milliseconds, and makes reading a codebase cheap.',
    install: 'brew install ripgrep',
    href: 'https://github.com/BurntSushi/ripgrep',
  },
  {
    name: 'fd',
    origin: 'ecosystem',
    job: 'code',
    role: 'File-finding with the same ergonomics — the half of find an agent actually needs, without the argument grammar.',
    install: 'brew install fd',
    href: 'https://github.com/sharkdp/fd',
  },
  {
    name: 'gh',
    origin: 'ecosystem',
    job: 'code',
    role: 'Lets the agent read its own failing CI log, open the pull request, and check the review — instead of asking me to paste it.',
    install: 'brew install gh',
    href: 'https://github.com/cli/cli',
  },
  {
    name: 'jq',
    origin: 'ecosystem',
    job: 'code',
    role: 'The universal adapter between one tool’s JSON envelope and the next tool’s arguments. Half of what makes agent-first CLIs composable.',
    install: 'brew install jq',
    href: 'https://github.com/jqlang/jq',
  },
  {
    name: 'oxlint · oxfmt',
    origin: 'ecosystem',
    job: 'code',
    role: 'The lint and format gate on this site, from the Oxc project. Fast enough that an agent runs the whole repo after a single edit.',
    install: 'pnpm add -D oxlint oxfmt',
    href: 'https://github.com/oxc-project/oxc',
  },
  {
    name: 'Playwright',
    origin: 'ecosystem',
    job: 'code',
    role: 'The end-to-end suite behind pnpm test:e2e. How a change to this page gets proven in a real browser rather than asserted in a summary.',
    install: 'pnpm add -D @playwright/test',
    href: 'https://github.com/microsoft/playwright',
  },
  {
    name: 'agent-browser',
    origin: 'ecosystem',
    job: 'machine',
    role: 'Drives a real browser from the command line, so an agent can see whether the layout it just wrote actually holds at 390 pixels wide.',
    install: 'npm i -g agent-browser',
    href: 'https://github.com/vercel-labs/agent-browser',
  },
  {
    name: 'pnpm',
    origin: 'ecosystem',
    job: 'machine',
    role: 'The pinned package manager. Every verification gate on this site starts with it, which is why the version is written down and not inferred.',
    install: 'brew install pnpm',
    href: 'https://github.com/pnpm/pnpm',
  },
  {
    name: 'tsx',
    origin: 'ecosystem',
    job: 'machine',
    role: 'Runs this repository’s TypeScript build scripts directly — content sync, search index, asset compression — with no compile step in the way.',
    install: 'pnpm add -D tsx',
    href: 'https://github.com/privatenumber/tsx',
  },
  {
    name: 'sharp',
    origin: 'ecosystem',
    job: 'media',
    role: 'Pulls the dominant colour out of every book cover in the Library during prebuild, which is where that page gets its palette.',
    install: 'pnpm add -D sharp',
    href: 'https://github.com/lovell/sharp',
  },
  {
    name: 'glTF-Transform',
    origin: 'ecosystem',
    job: 'media',
    role: 'Compresses the 3D assets this site ships. The optimise step in the Blender-to-glTF pipeline, run from a script rather than by hand.',
    install: 'pnpm add -D @gltf-transform/cli',
    href: 'https://github.com/donmccurdy/glTF-Transform',
  },
]

/* Provenance marks: drawn, one stroke weight, no glyph fonts. */
function Mark({ origin }: { origin: Origin }) {
  const common = { width: 13, height: 13, viewBox: '0 0 13 13', 'aria-hidden': true } as const
  if (origin === 'mine') {
    return (
      <svg {...common} className="arm-mark">
        <path d="M6.5 1 12 6.5 6.5 12 1 6.5Z" fill="currentColor" />
      </svg>
    )
  }
  if (origin === 'unreleased') {
    return (
      <svg {...common} className="arm-mark">
        <path
          d="M6.5 1.6 11.4 6.5 6.5 11.4 1.6 6.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
        />
      </svg>
    )
  }
  return (
    <svg {...common} className="arm-mark">
      <path d="M1.5 6.5H11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function CopyLine({ text }: { text: string }) {
  const [state, setState] = useState<'idle' | 'ok' | 'fail'>('idle')
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
    setState(ok ? 'ok' : 'fail')
    schedule(() => setState('idle'), 2400)
  }

  return (
    <div className="arm-install">
      <code>{text}</code>
      <button type="button" className="arm-copy" onClick={copy}>
        {state === 'idle' ? 'Copy' : state === 'ok' ? 'Copied' : 'Select it manually'}
      </button>
      <span className="sr-only" role="status">
        {state === 'ok'
          ? `Copied: ${text}`
          : state === 'fail'
            ? 'Copy failed. Select the command manually.'
            : ''}
      </span>
    </div>
  )
}

export function ToolsShowcase() {
  const reduced = useReducedMotion()
  const uid = useId()
  const [origin, setOrigin] = useState<Origin | 'all'>('all')
  const [job, setJob] = useState<Job | 'all'>('all')
  const [open, setOpen] = useState<string | null>(null)

  const shown = useMemo(
    () =>
      TOOLBOX.filter(
        (t) => (origin === 'all' || t.origin === origin) && (job === 'all' || t.job === job),
      ),
    [origin, job],
  )

  const countFor = (o: Origin | 'all', j: Job | 'all') =>
    TOOLBOX.filter((t) => (o === 'all' || t.origin === o) && (j === 'all' || t.job === j)).length

  const tally = ORIGINS.map((o) => ({
    ...o,
    n: shown.filter((t) => t.origin === o.key).length,
  }))

  return (
    <div className="armory rv">
      <div className="arm-filters">
        <div className="arm-group" role="group" aria-label="Filter by origin">
          <span className="arm-group-label">Origin</span>
          <button
            type="button"
            className="arm-chip"
            aria-pressed={origin === 'all'}
            onClick={() => setOrigin('all')}
          >
            Everything <span className="arm-n">{countFor('all', job)}</span>
          </button>
          {ORIGINS.map((o) => {
            const n = countFor(o.key, job)
            return (
              <button
                key={o.key}
                type="button"
                className="arm-chip"
                data-origin={o.key}
                aria-pressed={origin === o.key}
                disabled={n === 0}
                onClick={() => setOrigin(o.key)}
              >
                <Mark origin={o.key} />
                {o.label} <span className="arm-n">{n}</span>
              </button>
            )
          })}
        </div>

        <div className="arm-group" role="group" aria-label="Filter by what it does">
          <span className="arm-group-label">Job</span>
          <button
            type="button"
            className="arm-chip"
            aria-pressed={job === 'all'}
            onClick={() => setJob('all')}
          >
            Any <span className="arm-n">{countFor(origin, 'all')}</span>
          </button>
          {JOBS.map((j) => {
            const n = countFor(origin, j.key)
            return (
              <button
                key={j.key}
                type="button"
                className="arm-chip"
                aria-pressed={job === j.key}
                disabled={n === 0}
                onClick={() => setJob(j.key)}
              >
                {j.label} <span className="arm-n">{n}</span>
              </button>
            )
          })}
        </div>
      </div>

      <p className="arm-tally" role="status">
        {shown.length === 0 ? (
          'Nothing in the rack matches both filters. Widen one.'
        ) : (
          <>
            <span className="arm-tally-n">{shown.length}</span> showing —{' '}
            {tally
              .filter((t) => t.n > 0)
              .map((t) => `${t.n} ${t.label.toLowerCase()}`)
              .join(' · ')}
          </>
        )}
      </p>

      <ul className="arm-list">
        {shown.map((t, i) => {
          const id = `${uid}-${t.name.replace(/[^a-z0-9]/gi, '')}`
          const isOpen = open === t.name
          return (
            <li
              key={t.name}
              className="arm-row"
              data-origin={t.origin}
              data-open={isOpen || undefined}
              style={reduced ? undefined : ({ '--i': i } as React.CSSProperties)}
            >
              <button
                type="button"
                className="arm-head"
                aria-expanded={isOpen}
                aria-controls={id}
                onClick={() => setOpen(isOpen ? null : t.name)}
              >
                <span className="arm-gutter">
                  <Mark origin={t.origin} />
                </span>
                <span className="arm-name">{t.name}</span>
                <span className="arm-role">{t.role}</span>
                <span className="arm-job">{JOBS.find((j) => j.key === t.job)?.label}</span>
              </button>
              <div className="arm-panel" id={id} hidden={!isOpen}>
                {t.install ? <CopyLine text={t.install} /> : <p className="arm-note">{t.note}</p>}
                {t.href ? (
                  <a className="arm-link" href={t.href} target="_blank" rel="noopener noreferrer">
                    {t.href.replace('https://github.com/', '')} on GitHub ↗
                  </a>
                ) : (
                  <span className="arm-link arm-link-none">Not published</span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
