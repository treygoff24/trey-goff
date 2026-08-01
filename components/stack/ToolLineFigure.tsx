'use client'

import { useState } from 'react'
import '@/components/stack/tool-line.css'
import { Terminal, type TermLine } from '@/components/stack/Terminal'

/**
 * Ch.4 — the Important-tip callout, made countable.
 *
 * One line of prose in AGENTS.md is the whole intervention. Toggle it and the
 * same task replays: without it the agent solves the problem the long way and
 * hands back an unsourced paraphrase; with it the custom CLI is reached for on
 * move one. The transcript is the measurement — it is visibly half the length.
 */

const AGENTS_HEAD = [
  '## Tools on this machine',
  '',
  '- `rg` — ripgrep. Recurses by default; `-r` is replace, not recursive.',
  '- `gh` — GitHub CLI for repos, issues, PRs, releases.',
]

/** The one line the figure turns on and off. */
const TOOL_LINE =
  '- `receipts` — source-verified answers: every claim comes back with a URL, a quote, and a verdict.'

const AGENTS_TAIL = ['', 'Reach for these before writing a script that does the same job.']

const PROMPT: TermLine = {
  t: 'cmd',
  p: '> ',
  v: 'Does the PACT Act actually cover burn-pit exposure? I need to cite it.',
}

const WITHOUT: TermLine[] = [
  PROMPT,
  { t: 'out', c: 'dim', v: 'No tool listed for this. Starting with a web search.', d: 200 },
  { t: 'cmd', v: 'WebSearch "PACT Act burn pit exposure coverage"' },
  { t: 'out', v: '8 results. Top hit is a benefits-explainer blog.' },
  { t: 'out', c: 'warn', v: 'No statute text in any snippet. Writing a fetcher.', d: 220 },
  { t: 'cmd', v: 'python3 fetch_pact.py --url https://pact-act-guide.example/full-text' },
  { t: 'out', c: 'dim', v: 'urllib → 200 OK · 412 KB of HTML · stripping tags with a regex' },
  {
    t: 'out',
    c: 'bad',
    v: 'Assumes the mirror is authoritative. It is a summary, not the statute.',
  },
  { t: 'cmd', v: 'rg -n "burn pit" pact_text.txt' },
  { t: 'out', v: '3 hits, all inside an editor’s summary paragraph.' },
  { t: 'out', c: 'warn', v: 'Answer: “Yes — the PACT Act covers burn-pit exposure.”', d: 220 },
  { t: 'out', c: 'bad', v: 'No URL. No quote. No verdict. You go verify it yourself.' },
]

const WITH: TermLine[] = [
  PROMPT,
  { t: 'out', c: 'dim', v: 'AGENTS.md names a tool for exactly this.', d: 200 },
  { t: 'cmd', v: 'receipts ask "Does the PACT Act cover burn-pit exposure?" --json' },
  { t: 'out', c: 'ok', v: 'verdict: SUPPORTED' },
  { t: 'out', c: 'info', v: 'source: uscode.house.gov · 38 U.S.C. § 1119(c)' },
  { t: 'out', v: 'quote: “…toxic exposure risk activity… including exposure to burn pits.”' },
  { t: 'out', c: 'ok', v: 'Shipped with the citation attached. Nothing left to check.' },
]

/** A tool call is a shell line; the reader's own prompt carries a `>` override. */
function toolCalls(lines: TermLine[]) {
  return lines.filter((l) => l.t === 'cmd' && !l.p).length
}

const CAPS = {
  without: {
    lead: 'The tool is installed. The agent has no idea.',
    body: ' It searches, it writes a throwaway fetcher, it trusts a mirror because the mirror looked clean, and it hands back a sentence you now have to go verify. Every one of those moves is reasonable for an agent that does not know `receipts` exists.',
  },
  with: {
    lead: 'Same task, same machine, one line of prose different.',
    body: ' It reaches for the CLI on move one, and what comes back is already a citation. ',
    tail: 'One line of prose I never have to write again bought back half the transcript.',
  },
}

const NARRATIVE_WITHOUT =
  'Without the tool line in AGENTS.md, the transcript runs twelve lines and three tool calls: a web search, a hand-written Python fetcher pointed at an unofficial mirror, and a ripgrep over the scraped text, ending in an unsourced paraphrase with no URL, no quote and no verdict.'
const NARRATIVE_WITH =
  'With the tool line present, the same task runs seven lines and one tool call: the agent reads the line, runs receipts ask with a JSON flag, and gets back a supported verdict, the United States Code citation, and the verbatim quote.'

export function ToolLineFigure() {
  const [named, setNamed] = useState(false)
  const lines = named ? WITH : WITHOUT

  return (
    <div className="tlf rv">
      <div className="tlf-head">
        <span className="t">
          One task · one machine · <b>one line of prose</b>
        </span>
        <button
          className="tlf-switch"
          type="button"
          aria-pressed={named}
          onClick={() => setNamed((v) => !v)}
        >
          <span className="tlf-switch-track" aria-hidden="true">
            <span className="tlf-switch-knob" />
          </span>
          Name the tool in AGENTS.md
        </button>
      </div>

      <div className="tlf-grid">
        <figure className="tlf-file">
          <figcaption>AGENTS.md</figcaption>
          <pre className="tlf-code">
            {AGENTS_HEAD.map((l, i) => (
              <span className="tlf-line" key={`h${i}`}>
                <i aria-hidden="true">{i + 1}</i>
                {l || ' '}
              </span>
            ))}
            {named ? (
              <span className="tlf-line is-added">
                <i aria-hidden="true">{AGENTS_HEAD.length + 1}</i>
                {TOOL_LINE}
              </span>
            ) : (
              <span className="tlf-line is-slot">
                <i aria-hidden="true">{AGENTS_HEAD.length + 1}</i>
                <span className="tlf-slot" aria-hidden="true" />
                <span className="tlf-vh">
                  Line {AGENTS_HEAD.length + 1} is empty — the tool is not named.
                </span>
              </span>
            )}
            {AGENTS_TAIL.map((l, i) => (
              <span className="tlf-line" key={`t${i}`}>
                <i aria-hidden="true">{AGENTS_HEAD.length + 2 + i}</i>
                {l || ' '}
              </span>
            ))}
          </pre>
          <p className="tlf-note">
            {named
              ? 'Costs nothing until it is used. It is one line in a file the model already reads every session.'
              : 'The CLI is installed and on PATH. Nothing in the session mentions it, so it may as well not exist.'}
          </p>
        </figure>

        <div className="tlf-run">
          <div className="tlf-meter">
            <span>
              <b>{lines.length}</b> lines
            </span>
            <span>
              <b>{toolCalls(lines)}</b> tool calls
            </span>
            <span className={named ? 'ok' : 'bad'}>{named ? 'sourced' : '1 unsourced claim'}</span>
          </div>
          {/* Remounting on the toggle replays the transcript from the top, which is
              the comparison — the shorter run has to be watched, not just measured. */}
          <Terminal
            key={named ? 'with' : 'without'}
            title={named ? 'Session — receipts named in AGENTS.md' : 'Session — tool not named'}
            lines={lines}
          />
          <p className="tlf-vh">{named ? NARRATIVE_WITH : NARRATIVE_WITHOUT}</p>
        </div>
      </div>

      <div className="tlf-caps">
        {(['without', 'with'] as const).map((key) => {
          const c = CAPS[key]
          const on = key === (named ? 'with' : 'without')
          return (
            <p
              className={`tlf-cap${on ? ' is-on' : ''}`}
              key={key}
              aria-hidden={on ? undefined : true}
            >
              <b>{c.lead}</b>
              {c.body}
              {'tail' in c && c.tail ? <b>{c.tail}</b> : null}
            </p>
          )
        })}
      </div>
    </div>
  )
}
