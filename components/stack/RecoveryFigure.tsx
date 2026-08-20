'use client'

import { useCallback, useEffect, useState } from 'react'
import '@/components/stack/recovery-figure.css'
import { useOnceVisible, useReducedMotion, useTimeouts } from '@/components/stack/hooks'

/**
 * Ch.2 — what a written rule actually buys you.
 *
 * Both lanes run the same session and hit the same documented footgun at beat 1,
 * with byte-identical output. The rule does not stop that. What differs is
 * everything after: one lane grows a misdiagnosis tree, the other names the error
 * in a single beat. The figure is scored on one shared beat clock so the reader
 * can watch the right lane sit finished while the left one is still branching.
 */

type Kind = 'trunk' | 'branch' | 'named' | 'fix'

type Step = {
  /** Position on the shared clock. Both lanes are scored against the same beats. */
  beat: number
  kind: Kind
  /** Elapsed wall time at this beat, as the reader would see it in a session. */
  at: string
  cmd?: string
  head: string
  out?: string
  tone?: 'bad' | 'warn' | 'ok' | 'dim'
}

type Lane = {
  id: 'without' | 'with'
  rule: string
  title: string
  steps: Step[]
}

/* The trap. Identical in both lanes — same command, same fabricated output. */
const TRAP: Omit<Step, 'beat'> = {
  kind: 'trunk',
  at: '0:00',
  cmd: 'rg -rn "TODO" src/',
  head: 'The footgun fires',
  out: '41 lines back. Every match printed as: n',
  tone: 'bad',
}

export const LANES: Lane[] = [
  {
    id: 'without',
    rule: 'No rule in CLAUDE.md',
    title: 'The recovery tree',
    steps: [
      { ...TRAP, beat: 1 },
      {
        beat: 2,
        kind: 'branch',
        at: '0:48',
        cmd: "rg -rn 'TODO' src/",
        head: 'Hypothesis — the pattern got mangled by the shell',
        out: 'Same 41 lines. Same n.',
        tone: 'warn',
      },
      {
        beat: 3,
        kind: 'branch',
        at: '2:15',
        cmd: 'cat src/queue.ts',
        head: 'Hypothesis — the files are generated, so the text is not really there',
        out: 'The TODO is right there on line 88.',
        tone: 'warn',
      },
      {
        beat: 4,
        kind: 'branch',
        at: '4:02',
        cmd: 'rg --version',
        head: 'Hypothesis — the installed ripgrep is stale',
        out: '14.1.1. Current. Reads the changelog anyway.',
        tone: 'warn',
      },
      {
        beat: 5,
        kind: 'branch',
        at: '7:30',
        cmd: 'rg --help | less',
        head: 'Hypothesis — read the flags from the top',
        out: '-r, --replace. There it is, on the fourth try.',
        tone: 'warn',
      },
      {
        beat: 6,
        kind: 'fix',
        at: '9:12',
        cmd: 'rg -n TODO src/',
        head: 'Back on the road',
        out: '41 real matches, with real line numbers.',
        tone: 'ok',
      },
    ],
  },
  {
    id: 'with',
    rule: 'Rule in CLAUDE.md',
    title: 'The same footgun, named',
    steps: [
      { ...TRAP, beat: 1 },
      {
        beat: 2,
        kind: 'named',
        at: '0:11',
        head: 'Names it from the standing brief',
        out: '“rg -r is replace, not recursive — ripgrep already recurses. Output that looks like a result and is entirely fabricated.”',
        tone: 'dim',
      },
      {
        beat: 3,
        kind: 'fix',
        at: '0:39',
        cmd: 'rg -n TODO src/',
        head: 'Back on the road',
        out: '41 real matches, with real line numbers.',
        tone: 'ok',
      },
    ],
  },
]

export const MAX_BEAT = 6
/** Beat n lands at this offset once playback starts. */
const BEAT_MS = 1150

const TALLY_LABEL: Record<Lane['id'], string> = {
  without: 'Four dead ends before the flag gets read.',
  with: 'One beat between the error and the name for it.',
}

export function tally(lane: Lane, beat: number) {
  const seen = lane.steps.filter((s) => s.beat <= beat)
  const commands = seen.filter((s) => s.cmd).length
  const dead = seen.filter((s) => s.kind === 'branch').length
  const at = seen[seen.length - 1]?.at ?? '0:00'
  const done = seen.some((s) => s.kind === 'fix')
  return { commands, dead, at, done }
}

/* Screen readers get the whole argument at once, independent of the beat clock. */
const NARRATIVE =
  'Two runs of the same session, side by side. Both run rg dash r dash n and both get the same fabricated output, because a written rule does not prevent the mistake. Without the rule, the agent branches through four wrong hypotheses — a mangled pattern, generated files, a stale ripgrep, and finally the help text — spending six commands and nine minutes before it runs the correct command. With the rule, it names the error on the next beat, quoting the line from CLAUDE.md, and runs the correct command thirty-nine seconds in, on two commands and no dead ends.'

export function RecoveryFigure() {
  const reduced = useReducedMotion()
  const { schedule, clearAll } = useTimeouts()
  const [beat, setBeat] = useState(MAX_BEAT)
  /* Unarmed is the finished, fully argued state — what the server renders, what a
     reader with JS off keeps, and where reduced motion stays. Playback arms it. */
  const [armed, setArmed] = useState(false)

  const play = useCallback(() => {
    clearAll()
    if (reduced) {
      setArmed(false)
      setBeat(MAX_BEAT)
      return
    }
    setArmed(true)
    setBeat(0)
    for (let b = 1; b <= MAX_BEAT; b += 1) {
      schedule(() => setBeat(b), b * BEAT_MS)
    }
  }, [clearAll, reduced, schedule])

  const goto = useCallback(
    (b: number) => {
      clearAll()
      setArmed(true)
      setBeat(b)
    },
    [clearAll],
  )

  /* Arm after mount so the animated state starts dim before its first reveal. */
  useEffect(() => {
    if (reduced) return
    setArmed(true)
    setBeat(0)
  }, [reduced])

  const figRef = useOnceVisible<HTMLDivElement>(() => {
    if (reduced) return
    schedule(play, 420)
  }, 0.3)

  // Settle to the finished, fully argued state if the preference flips mid-run.
  useEffect(() => {
    if (reduced) {
      clearAll()
      setArmed(false)
      setBeat(MAX_BEAT)
    }
  }, [reduced, clearAll])

  const activeBeat = armed ? beat : MAX_BEAT

  return (
    <div className={`rcv rv${armed ? ' is-armed' : ''}`} ref={figRef}>
      <div className="rcv-head">
        <span className="t">
          Same agent · same footgun · <b>rg -r is replace, not recursive</b>
        </span>
        <div className="rcv-controls">
          <div className="rcv-scrub" role="group" aria-label="Jump to a beat">
            {Array.from({ length: MAX_BEAT }, (_, i) => i + 1).map((b) => (
              <button
                key={b}
                type="button"
                className={activeBeat >= b ? 'is-lit' : ''}
                aria-pressed={armed && activeBeat === b}
                aria-label={`Beat ${b} of ${MAX_BEAT}`}
                onClick={() => goto(b)}
              >
                {b}
              </button>
            ))}
          </div>
          <button className="rcv-replay" type="button" onClick={play}>
            Replay
          </button>
        </div>
      </div>

      <p className="rcv-vh">{NARRATIVE}</p>

      <div className="rcv-lanes">
        {LANES.map((lane) => {
          const t = tally(lane, activeBeat)
          return (
            <section className={`rcv-lane rcv-${lane.id}`} key={lane.id} aria-hidden="true">
              <header className="rcv-lane-head">
                <span className="rule">{lane.rule}</span>
                <span className="ttl">{lane.title}</span>
              </header>

              <ol className="rcv-steps">
                {lane.steps.map((s) => (
                  <li
                    key={s.beat}
                    className={`rcv-step k-${s.kind}${activeBeat >= s.beat ? ' is-on' : ''}`}
                  >
                    <span className="rcv-clock">{s.at}</span>
                    <span className="rcv-body">
                      <span className="rcv-headline">{s.head}</span>
                      {s.cmd ? (
                        <span className="rcv-cmd">
                          <span className="p">$ </span>
                          {s.cmd}
                        </span>
                      ) : null}
                      {s.out ? <span className={`rcv-out ${s.tone ?? ''}`}>{s.out}</span> : null}
                    </span>
                  </li>
                ))}
              </ol>

              <div className={`rcv-tally${t.done ? ' is-done' : ''}`}>
                <span>
                  <b>{t.commands}</b> commands
                </span>
                <span>
                  <b>{t.dead}</b> dead ends
                </span>
                <span>
                  <b>{t.at}</b> elapsed
                </span>
              </div>
              <p className="rcv-tally-note">{TALLY_LABEL[lane.id]}</p>
            </section>
          )
        })}
      </div>

      <p className="rcv-cap">
        <b>Written memory doesn&apos;t prevent the mistake.</b> The trap fired identically on both
        sides — same flag, same fabricated output, same wasted first minute. What the rule bought
        was the second beat: the error gets a <em>name</em> instead of a hypothesis.{' '}
        <b>It collapses the recovery tree — which is most of what memory is for, for humans too.</b>
      </p>
      <p className="rcv-cap rcv-cap-field">
        Field note, one evening on my machine: two agents who had just co-written a warning about
        this exact rake each stepped on it within the hour — one mid-review of the very system the
        rule protects, one thirty seconds after shipping the warning to the public README. Both
        recovered in a single beat, because the pattern had a name. Science fiction promised an AGI
        that never errs; what we got can coin Greek and fumble a shell ampersand in the same hour.
        The rule file exists for the second part.
      </p>
    </div>
  )
}
