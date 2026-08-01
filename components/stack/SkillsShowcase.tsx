'use client'

import { useCallback, useId, useState } from 'react'
import '@/components/stack/skills-showcase.css'

/* ── The always-on list ────────────────────────────────────────
   This is my real ~/.claude/skills.globals, group for group and in
   its real order — the skills that load at the top of every single
   session, before I have typed anything. Everything else on the
   machine stays dormant and discoverable.

   `take` is the de-personalized copy in public/stack/skills/.
   A skill with no `take` is a thin wrapper around infrastructure
   that only exists on my machine; it is shown because the pattern
   travels even when the file does not. */

type Lane = 'harness' | 'discipline' | 'research' | 'tools'

type Skill = {
  name: string
  /** one line: what it actually does */
  what: string
  /** one line: when it fires */
  when: string
  /** filename under /stack/skills/, or null for machine-local */
  take: string | null
  /** why there is no download, where there is none */
  local?: string
}

type Group = {
  id: Lane
  label: string
  blurb: string
  skills: Skill[]
}

const GROUPS: Group[] = [
  {
    id: 'harness',
    label: 'meta / harness',
    blurb: 'Skills about running the machine that runs the work.',
    skills: [
      {
        name: 'done',
        what: 'End-of-session closeout: walks the session and makes durable state — ledgers, memories, handoffs, repo state — catch up with what actually happened.',
        when: 'I say “done” or a substantive session is clearly ending.',
        take: 'done.md',
      },
      {
        name: 'delegate-agent',
        what: 'Hands a bounded task to another vendor’s harness through one CLI, with a read-only mode for review and an edit mode for work.',
        when: 'A second opinion is worth more than a second pass, or the work is mechanical enough to spend someone else’s tokens on.',
        take: 'delegate-agent.md',
      },
      {
        name: 'delegate-workflows',
        what: 'Multi-agent pipelines as real scripts under a detached supervisor — fan out, verify, synthesize, resume after a crash.',
        when: 'The orchestration itself is the hard part, not any single task in it.',
        take: 'delegate-workflows.md',
      },
      {
        name: 'resume-handoff',
        what: 'Picks work back up by verifying live state first, so stale memory never gets mistaken for current fact.',
        when: '“Where did we leave off?” — or any resume from a handoff, branch, or note.',
        take: 'resume-handoff.md',
      },
      {
        name: 'find-skills',
        what: 'Searches the dormant library before anyone concludes the capability does not exist.',
        when: 'I ask how to do something that smells like it is already solved.',
        take: 'find-skills.md',
      },
      {
        name: 'using-memorum',
        what: 'The operating loop for my memory daemon: search, record, supersede, forget, reveal.',
        when: 'Any durable fact needs writing down or looking up.',
        take: null,
        local:
          'Wraps a memory daemon that only runs here. The pattern — one file per fact, so a wrong one can be deleted rather than argued with — is the part worth stealing.',
      },
      {
        name: 'weekly-maintenance',
        what: 'The weekly ritual: scan the whole computer, decide everything in one console, execute, write the ledger.',
        when: 'Maintenance time, or a mid-week health question.',
        take: null,
        local:
          'Bound to this machine’s ledger, scanners, and backlog file. Portable idea, unportable file.',
      },
    ],
  },
  {
    id: 'discipline',
    label: 'build discipline',
    blurb: 'Skills that slow the agent down at exactly the right moments.',
    skills: [
      {
        name: 'brainstorming',
        what: 'Forces intent, requirements, and design to be explored before a single line gets written.',
        when: 'Any creative work — new feature, new component, new behavior.',
        take: 'brainstorming.md',
      },
      {
        name: 'grilling',
        what: 'Turns the agent adversarial and points it at my thinking instead of the code.',
        when: 'I want a plan or a decision stress-tested rather than agreed with.',
        take: 'grilling.md',
      },
      {
        name: 'foundry',
        what: 'The full cross-model build loop: waves of lanes building, reviewing, and fixing under a coordinator that verifies independently.',
        when: 'An idea or a prototype needs to become a shipped product.',
        take: 'foundry.md',
      },
      {
        name: 'plan-review-loop',
        what: 'Runs a plan through three decorrelated model families and folds the convergent findings into a revision.',
        when: 'A substantive plan is drafted and about to be executed.',
        take: 'plan-review-loop.md',
      },
      {
        name: 'code-review',
        what: 'Reviews a diff along two axes at once — does it follow this repo’s standards, and does it match what was asked for.',
        when: 'Before anything leaves the branch.',
        take: 'code-review.md',
      },
      {
        name: 'implement',
        what: 'The plain execution path: take an agreed plan and build it without re-litigating the plan.',
        when: 'The thinking is done and the typing is not.',
        take: 'implement.md',
      },
      {
        name: 'impeccable',
        what: 'Design direction with a quality floor — the skill that built the page you are reading.',
        when: 'Any frontend surface is being designed, critiqued, or polished.',
        take: 'impeccable.md',
      },
    ],
  },
  {
    id: 'research',
    label: 'research / communication',
    blurb: 'Skills for finding what is true and then saying it like a person.',
    skills: [
      {
        name: 'research',
        what: 'Investigates a question against high-trust primary sources and lands the findings as a file in the repo.',
        when: 'Reading legwork should happen in the background, not in my window.',
        take: 'research.md',
      },
      {
        name: 'exa-agent-cli',
        what: 'The default search lane — fastest and cheapest of the three, and dominant on people and organization diligence.',
        when: 'Almost any web lookup starts here.',
        take: 'exa-agent-cli.md',
      },
      {
        name: 'parallel-web-search',
        what: 'The everyday lookup path into the second search vendor.',
        when: 'A quick current-info question that does not need the full CLI.',
        take: 'parallel-web-search.md',
      },
      {
        name: 'parallel-cli',
        what: 'The authority lane: best citation quality, primary sources, exhaustive research, entity discovery, change monitoring.',
        when: 'Primary-source discipline beats speed, or a high-stakes claim needs a second independent lane.',
        take: 'parallel-cli.md',
      },
      {
        name: 'write-human',
        what: 'Anchors the register before generation, then a script enforces the mechanical rules after.',
        when: 'Loaded before writing any prose — email, memo, policy paper, this page.',
        take: 'write-human.md',
      },
      {
        name: 'fusion',
        what: 'Convenes a cross-vendor council to propose, critique, defend, and judge one high-stakes artifact, then maps where the models disagreed.',
        when: 'Something open-ended and expensive to get wrong is about to be committed to.',
        take: 'fusion.md',
      },
      {
        name: 'receipts',
        what: 'Every claim comes back with a source URL, a quote, and a verdict.',
        when: 'A fact is about to go into a document and has to be ground-truthed first.',
        take: 'receipts.md',
      },
    ],
  },
  {
    id: 'tools',
    label: 'custom CLIs / tools',
    blurb: 'One skill per tool the agent owns, so it never has to be reminded the tool exists.',
    skills: [
      {
        name: 'gog',
        what: 'Scoped, JSON-first Google Workspace automation.',
        when: 'Mail, calendar, drive, or docs need touching from a session.',
        take: null,
        local:
          'Runs on my own Workspace OAuth app and scope policy. Shown because “one skill per tool you own” is the transferable half.',
      },
      {
        name: 'gh-cli',
        what: 'Repos, issues, pull requests, actions, releases — GitHub as a command line rather than a browser.',
        when: 'Any GitHub operation at all.',
        take: 'gh-cli.md',
      },
      {
        name: 'agent-browser',
        what: 'A browser the agent can actually drive: navigate, fill, click, screenshot, extract, QA.',
        when: 'Anything that has to be seen rather than inferred.',
        take: 'agent-browser.md',
      },
      {
        name: 'elv',
        what: 'The entire ElevenLabs API as agent-callable operations — speech, transcription, sound effects, music, dubbing.',
        when: 'Any voice or audio work.',
        take: 'elv.md',
      },
      {
        name: 'x-watch',
        what: 'Read-only X lookup with a stable JSON contract instead of browser scraping.',
        when: 'The morning dashboard, or a timeline question mid-session.',
        take: null,
        local: 'Carries my own API credentials and rate-limit posture.',
      },
      {
        name: 'bridge-tool',
        what: 'Builds a throwaway single-file tool so I can express the thing in drags and clicks, then exports it back as data the model can read.',
        when: 'Intent resists text — placement, ordering, thresholds, palette, “I’ll know it when I see it.”',
        take: 'bridge-tool.md',
      },
      {
        name: 'probita',
        what: 'Source-grounded legal and policy research: citation verification, corpus search, adversarial brief review.',
        when: 'Legal or legislative work, where an unsourced claim is worse than no claim.',
        take: null,
        local:
          'Drives a private corpus and a local model harness. The tool is not mine to hand out.',
      },
      {
        name: 'fleet',
        what: 'Machine-wide agent occupancy — who is working where, what is claimed, and where two writers are about to collide.',
        when: 'Before editing a repo another agent might be holding.',
        take: null,
        local:
          'Reads process and claim state on this machine specifically. Every swarm eventually needs one of these; build yours.',
      },
      {
        name: 'radar-cli',
        what: 'Queries my production news monitor before anyone researches a covered topic from scratch.',
        when: 'Work touches one of its configured watch areas.',
        take: null,
        local: 'A client for a private monitoring system with its own database.',
      },
    ],
  },
]

const ALL = GROUPS.flatMap((g) => g.skills)
const TAKEABLE = ALL.filter((s) => s.take !== null).length
const LOCAL = ALL.length - TAKEABLE

function SkillTile({
  skill,
  lane,
  open,
  panelId,
  onToggle,
}: {
  skill: Skill
  lane: Lane
  open: boolean
  panelId: string
  onToggle: (name: string) => void
}) {
  const takeable = skill.take !== null
  return (
    <li className={`sx-item${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className={`sx-tile sx-lane-${lane}${takeable ? '' : ' is-local'}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onToggle(skill.name)}
      >
        <span className="sx-tile-name">{skill.name}</span>
        <span className="sx-tile-state">
          {takeable ? (
            <span className="sx-badge sx-badge-take">md ↓</span>
          ) : (
            <span className="sx-badge sx-badge-local">my machine</span>
          )}
          <span className="sx-chev" aria-hidden="true" />
        </span>
      </button>

      {/* No `role="region"` here: thirty named landmarks would drown the page's
          real ones, and aria-expanded + aria-controls already say what this is. */}
      <div className="sx-panel" id={panelId}>
        <div className="sx-panel-inner">
          <p className="sx-what">{skill.what}</p>
          <p className="sx-when">
            <span className="sx-when-k">fires when</span>
            {skill.when}
          </p>
          {skill.take ? (
            <a className="sx-take" href={`/stack/skills/${skill.take}`} download>
              <span className="sx-take-ext">MD</span>
              <span className="sx-take-nm">{skill.take}</span>
              <span className="sx-take-go">Download ↓</span>
            </a>
          ) : (
            <p className="sx-local">
              <span className="sx-local-k">no download</span>
              {skill.local}
            </p>
          )}
        </div>
      </div>
    </li>
  )
}

export function SkillsShowcase() {
  const uid = useId()
  const [open, setOpen] = useState<string | null>(null)
  const [takeOnly, setTakeOnly] = useState(false)

  const onToggle = useCallback((name: string) => {
    setOpen((cur) => (cur === name ? null : name))
  }, [])

  return (
    <figure className={`sx-shell rv${takeOnly ? ' is-filtered' : ''}`}>
      <div className="sx-bar">
        <div className="sx-bar-id">
          <span className="sx-bar-cmd">~/.claude/skills.globals</span>
          <span className="sx-bar-sub">
            the list every session reads before I have typed anything
          </span>
        </div>
        <div className="sx-bar-stats">
          <span className="sx-stat">
            <b>{ALL.length}</b> always-on
          </span>
          <span className="sx-stat sx-stat-take">
            <b>{TAKEABLE}</b> yours to take
          </span>
          <span className="sx-stat sx-stat-local">
            <b>{LOCAL}</b> mine only
          </span>
        </div>
      </div>

      <div className="sx-controls">
        <button
          type="button"
          className={`sx-filter${takeOnly ? ' is-on' : ''}`}
          aria-pressed={takeOnly}
          onClick={() => setTakeOnly((v) => !v)}
        >
          Hide the ones you can&apos;t download
        </button>
        <p className="sx-hint">
          Every name is a button — open one for what it does, when it fires, and the file.
        </p>
      </div>

      <div className="sx-board">
        {GROUPS.map((group) => {
          const shown = takeOnly ? group.skills.filter((s) => s.take !== null) : group.skills
          const takes = group.skills.filter((s) => s.take !== null).length
          return (
            <section key={group.id} className={`sx-group sx-lane-${group.id}`}>
              <header className="sx-group-head">
                <h4 className="sx-group-label">
                  {group.label}
                  {/* Counts what is on screen, so the badge never contradicts
                      the rows under it while the filter is on. */}
                  <span className="sx-group-count" aria-hidden="true">
                    {shown.length}
                  </span>
                  <span className="sx-sr">
                    — {group.skills.length} skills, {takes} downloadable
                    {takeOnly ? `, ${shown.length} shown` : ''}
                  </span>
                </h4>
                <p className="sx-group-blurb">{group.blurb}</p>
              </header>
              <ul className="sx-list">
                {shown.map((skill) => (
                  <SkillTile
                    key={skill.name}
                    skill={skill}
                    lane={group.id}
                    open={open === skill.name}
                    panelId={`${uid}-${skill.name}`}
                    onToggle={onToggle}
                  />
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      <figcaption className="sx-cap">
        <b>Thirty skills, loaded at every session start, and that is the whole tax. </b>
        The other three hundred sit dormant in the library where a search can find them — which is
        the actual discipline: a skill costs nothing until it is needed, and this list is the small
        set of things that are true in every session regardless of what I am doing. The downloads
        are the real files with my machine&apos;s paths, names, and private infrastructure taken
        out. Read one before you run it.
      </figcaption>
    </figure>
  )
}
