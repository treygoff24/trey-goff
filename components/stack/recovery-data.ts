export type Kind = 'trunk' | 'branch' | 'named' | 'fix'

export type Step = {
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

export type Lane = {
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
export const BEAT_MS = 1150

export const TALLY_LABEL: Record<Lane['id'], string> = {
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
