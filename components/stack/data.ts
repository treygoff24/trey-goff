import type { TermLine } from '@/components/stack/Terminal'

export const CHAPTERS = [
  { id: 'ch1', n: '01', title: 'Why any of this works' },
  { id: 'ch2', n: '02', title: 'Day one' },
  { id: 'ch3', n: '03', title: 'Teaching it your world' },
  { id: 'ch4', n: '04', title: 'Giving it hands' },
  { id: 'ch5', n: '05', title: 'Multiplying it' },
  { id: 'ch6', n: '06', title: 'Trusting it at scale' },
  { id: 'ch7', n: '07', title: 'A week in the life' },
  { id: 'ch8', n: '08', title: 'Build your own' },
] as const

export const HERO_TERM: TermLine[] = [
  { t: 'cmd', v: 'claude "build the page that explains how you were built"' },
  { t: 'out', v: '', d: 300 },
  { t: 'out', c: 'dim', v: '● Reading AGENTS.md, app/globals.css, app/page.tsx …' },
  { t: 'out', c: 'dim', v: '● Drafting visual thesis → 8 chapters, one strong idea each' },
  { t: 'out', c: 'dim', v: '● Writing components/stack/ — rail, terminals, decision tree' },
  { t: 'out', c: 'dim', v: '● Screenshotting at 1440px and 390px, iterating on its own critique' },
  { t: 'out', v: '' },
  { t: 'out', c: 'ok', v: '✔ Done. This is the page. Scroll.' },
]

export const DAY_ONE_TERM: TermLine[] = [
  { t: 'cmd', v: 'npm install -g @anthropic-ai/claude-code' },
  { t: 'out', c: 'dim', v: 'added 1 package in 6s' },
  { t: 'out', v: '' },
  { t: 'cmd', v: 'cd ~/code/my-project && claude' },
  { t: 'out', c: 'box', v: '╭──────────────────────────────────────────────╮' },
  { t: 'out', c: 'box', v: '│  Welcome to Claude Code                      │' },
  { t: 'out', c: 'box', v: '│  cwd: ~/code/my-project                      │' },
  { t: 'out', c: 'box', v: '╰──────────────────────────────────────────────╯' },
  { t: 'out', v: '' },
  { t: 'cmd', p: '> ', v: 'what is this project, in three sentences?' },
  { t: 'out', c: 'dim', v: '● Reading package.json, README.md, src/index.ts …', d: 420 },
  { t: 'out', v: '' },
  { t: 'out', v: "It's a Next.js 15 app that renders a public status board" },
  { t: 'out', v: 'from a Postgres table. Deploys to Vercel on push to main.' },
  { t: 'out', v: 'Tests are Vitest; there are 34 of them and 3 are skipped.' },
  { t: 'out', v: '' },
  { t: 'cmd', p: '> ', v: '/init' },
  { t: 'out', c: 'ok', v: '✔ Wrote CLAUDE.md — project conventions, commands, structure.' },
]

export const SELF_BUILD_TERM: TermLine[] = [
  { t: 'cmd', v: 'papercuts add "agent misidentified which model it was running as"' },
  { t: 'out', c: 'dim', v: '✓ filed pc_4a21 · severity: minor · tag: identity' },
  { t: 'out', v: '' },
  { t: 'cmd', v: '# a few days later, an agent read the complaint pile and shipped:' },
  { t: 'out', c: 'dim', v: 'hooks/announce-model.mjs — session start: tells every agent' },
  { t: 'out', c: 'dim', v: 'which model it is actually running as. No more guessing.' },
  { t: 'out', v: '' },
  {
    t: 'out',
    c: 'ok',
    v: '✔ complaint → tool, in one loop. True story. That is the whole system.',
  },
]

export type CtxKey = 'bad' | 'good'
export const CTX: Record<
  CtxKey,
  { segs: [string, number, string][]; cap: { lead: string; body: string; tail?: string } }
> = {
  bad: {
    segs: [
      ['c-sys', 12, 'System + tools'],
      ['c-noise', 132, 'Whole-repo dump'],
      ['c-sprawl', 74, 'Chat sprawl'],
      ['c-tool', 62, 'Unread tool output'],
      ['c-task', 18, 'The actual task'],
      ['c-free', 22, 'Headroom'],
    ],
    cap: {
      lead: 'The default.',
      body: ' You opened a session, said "fix the login bug", and it went looking. Most of the window is now the search — files it read to rule out, output it never used, and a conversation that has drifted twice. The task itself is a sliver. This is what people mean when they say the model "got dumber halfway through."',
    },
  },
  good: {
    segs: [
      ['c-sys', 12, 'System + tools'],
      ['c-brief', 28, 'CLAUDE.md + one skill'],
      ['c-noise', 20, 'Files it had to rule out'],
      ['c-task', 54, 'The five files that matter'],
      ['c-verify', 44, 'Task, plan, and the test that proves it'],
      ['c-free', 162, 'Headroom'],
    ],
    cap: {
      lead: 'The same job, briefed.',
      body: ' A standing instruction file told it the conventions. A skill told it the procedure. You named the files. Now two-thirds of the window is headroom — room to be wrong twice, read the failing test, and still think clearly. ',
      tail: 'Everything in this manual is a way of buying that green space.',
    },
  },
}
export const CTX_CELL_COUNT = 320

export type ToolKey = 'rg' | 'gh' | 'ctx7' | 'exa' | 'browser' | 'mcp' | 'own'
export const TOOLS: Record<
  ToolKey,
  {
    title: string
    why: string
    linkText: string
    linkHref?: string
    lines: TermLine[]
  }
> = {
  rg: {
    title: 'ripgrep',
    why: 'Replaces find + grep. Respects .gitignore.',
    linkText: 'github.com/BurntSushi/ripgrep ↗',
    linkHref: 'https://github.com/BurntSushi/ripgrep',
    lines: [
      { t: 'cmd', v: 'rg -n "createSession\\(" --type ts' },
      {
        t: 'out',
        c: 'dim',
        v: 'lib/auth/session.ts:41:export function createSession(user: User) {',
      },
      { t: 'out', c: 'dim', v: 'app/api/login/route.ts:18:  const s = await createSession(user)' },
      { t: 'out', c: 'dim', v: 'test/session.test.ts:9:  const s = createSession(fixture)' },
      { t: 'out', v: '' },
      { t: 'out', c: 'ok', v: '3 matches · 1,204 files · 41ms' },
    ],
  },
  gh: {
    title: 'gh',
    why: 'The agent can read its own CI failure.',
    linkText: 'cli.github.com ↗',
    linkHref: 'https://cli.github.com',
    lines: [
      { t: 'cmd', v: 'gh run view --log-failed | tail -6' },
      { t: 'out', c: 'dim', v: '  ✓ install (14s)' },
      { t: 'out', c: 'dim', v: '  ✓ typecheck (22s)' },
      { t: 'out', c: 'bad', v: '  ✗ test — session.test.ts > expires after 24h' },
      { t: 'out', c: 'bad', v: '    expected 86400000, received 86400' },
      { t: 'out', v: '' },
      { t: 'out', c: 'ok', v: '✔ Found it: seconds, not milliseconds. Fixing.' },
    ],
  },
  ctx7: {
    title: 'ctx7',
    why: "Today's docs beat last year's memory.",
    linkText: 'context7.com ↗',
    linkHref: 'https://context7.com',
    lines: [
      { t: 'cmd', v: 'ctx7 docs /vercel/next.js "middleware vs proxy in v16"' },
      { t: 'out', c: 'dim', v: '● 42 snippets · source: official docs · updated 6d ago' },
      { t: 'out', v: '' },
      { t: 'out', c: 'warn', v: 'Note: middleware.ts was renamed. The v16 file is proxy.ts.' },
      { t: 'out', v: '' },
      { t: 'out', c: 'ok', v: '✔ Would have written the deprecated API from memory.' },
    ],
  },
  exa: {
    title: 'exa-agent',
    why: 'Live web, with URLs you can actually open.',
    linkText: 'exa.ai ↗',
    linkHref: 'https://exa.ai',
    lines: [
      { t: 'cmd', v: 'exa-agent answer "current pricing for the model we ship on"' },
      { t: 'out', c: 'dim', v: '● searching · 9 sources · 3 primary' },
      { t: 'out', v: '' },
      { t: 'out', v: 'Answer with citations [1][2] — vendor pricing page and' },
      { t: 'out', v: 'the changelog entry that changed it on the 14th.' },
      { t: 'out', v: '' },
      { t: 'out', c: 'warn', v: 'Always open the citation. ~1 in 6 quotes fails verification.' },
    ],
  },
  browser: {
    title: 'agent-browser',
    why: 'It can see whether the button is actually centered.',
    linkText: 'Bring your own; Playwright underneath',
    lines: [
      { t: 'cmd', v: 'agent-browser open http://localhost:3000/stack --session ch4' },
      { t: 'out', c: 'dim', v: '● viewport 1440×900 · 0 console errors' },
      { t: 'cmd', v: 'agent-browser screenshot --full-page' },
      { t: 'out', c: 'dim', v: '● saved .scratch/shot-1440.png' },
      { t: 'out', v: '' },
      { t: 'out', c: 'ok', v: '✔ Rail overlaps the figure below 1100px. Fixing.' },
    ],
  },
  mcp: {
    title: 'MCP servers',
    why: 'Great for non-CLI systems. Costs window all session.',
    linkText: 'modelcontextprotocol.io ↗',
    linkHref: 'https://modelcontextprotocol.io',
    lines: [
      { t: 'cmd', v: 'claude mcp list' },
      { t: 'out', c: 'dim', v: 'chrome-devtools   ✓ connected   38 tools' },
      { t: 'out', c: 'dim', v: 'google-drive      ✓ connected   11 tools' },
      { t: 'out', c: 'warn', v: 'linear            ✓ connected   64 tools   ← parked' },
      { t: 'out', v: '' },
      { t: 'out', c: 'warn', v: 'Every listed tool is context you pay for on every turn.' },
      { t: 'out', c: 'ok', v: '✔ Park what you use monthly. Keep what you use hourly.' },
    ],
  },
  own: {
    title: 'your own',
    why: 'A paragraph of spec becomes a tool by dinner.',
    linkText: 'See agent-build.md, below ↓',
    lines: [
      { t: 'cmd', p: '> ', v: 'build me a CLI called `ask` that pages my phone and blocks' },
      { t: 'out', c: 'dim', v: '● Writing ~/bin/ask · Telegram transport · exit 2/3/4' },
      { t: 'out', c: 'dim', v: '● Adding a note to CLAUDE.md: use only when truly blocked' },
      { t: 'out', v: '' },
      { t: 'cmd', v: 'ask "worktree or edit in place? (default: in place)"' },
      { t: 'out', c: 'dim', v: '● sent · waiting for reply …' },
      { t: 'out', c: 'ok', v: '✔ "in place, I want to watch it"' },
    ],
  },
}
export const TOOL_ORDER: { key: ToolKey; name: string; blurb: string; tag: string }[] = [
  { key: 'rg', name: 'ripgrep', blurb: 'Search a million lines in under a second.', tag: 'Search' },
  { key: 'gh', name: 'gh', blurb: 'GitHub from the terminal: PRs, issues, CI logs.', tag: 'Git' },
  {
    key: 'ctx7',
    name: 'ctx7',
    blurb: 'Current library docs, not training-data memory.',
    tag: 'Docs',
  },
  {
    key: 'exa',
    name: 'exa-agent',
    blurb: 'Live web research with citations you can check.',
    tag: 'Web',
  },
  {
    key: 'browser',
    name: 'agent-browser',
    blurb: 'A real browser it can click, type, and screenshot in.',
    tag: 'Browser',
  },
  {
    key: 'mcp',
    name: 'MCP servers',
    blurb: "The plug format for things that aren't CLIs.",
    tag: 'Protocol',
  },
  {
    key: 'own',
    name: '…your own',
    blurb: 'The 200-line CLI only you need. It builds it.',
    tag: 'Custom',
  },
]

// The real delegate roster: OpenAI, xAI (twice, two harnesses), Moonshot, Zhipu, Anthropic.
export const WORKERS = [
  { n: 'codex', job: 'audit the auth module' },
  { n: 'cursor', job: 'hunt N+1 queries' },
  { n: 'grok', job: 'sweep dead exports' },
  { n: 'kimi', job: 'red-team the copy' },
  { n: 'glm', job: 'check the migration' },
  { n: 'opus', job: 'review the diff cold' },
]
export const VERDICTS: [string, string, boolean][] = [
  ['codex', 'session fixture leaks between tests', false],
  ['cursor', 'clean — 2 queries, both indexed', true],
  ['grok', '11 dead exports, safe to drop', true],
  ['kimi', 'three sentences nobody would say', true],
  ['glm', 'migration is not reversible', false],
  ['opus', 'agrees with codex; has the repro', true],
]

export type TreeNode =
  | {
      kind: 'question'
      crumb?: string
      q: string
      sub: string
      opts: { k: string; t: string; s: string; go: string }[]
    }
  | {
      kind: 'leaf'
      crumb: string
      title: string
      quote: string
      steps: { lead: string; rest: string }[]
      ch: [string, string]
    }

export const TREE_ROOT: TreeNode = {
  kind: 'question',
  q: 'What are you actually sitting down to do?',
  sub: 'Four situations cover most of my week. Pick the one that sounds like today.',
  opts: [
    {
      k: 'A',
      t: 'Start something that does not exist yet',
      s: 'An idea, an empty folder, a weekend.',
      go: 'green',
    },
    {
      k: 'B',
      t: 'Add a feature to something real',
      s: 'Existing repo, existing users, existing tests.',
      go: 'feature',
    },
    {
      k: 'C',
      t: 'Rescue a pile of half-finished projects',
      s: 'Eleven repos. Three of them matter. You forget which.',
      go: 'pile',
    },
    {
      k: 'D',
      t: 'Chase one weird bug on my machine',
      s: 'Works everywhere else. Not here. Not today.',
      go: 'bug',
    },
  ],
}

export const TREE: Record<string, TreeNode> = {
  root: TREE_ROOT,
  green: {
    kind: 'question',
    crumb: 'Greenfield',
    q: 'How big is it, honestly?',
    sub: 'This is the fork that matters most, and the one people get wrong in the same direction every time.',
    opts: [
      {
        k: 'A',
        t: 'A weekend tool for me',
        s: 'One user. Might be dead in a month.',
        go: 'green-small',
      },
      {
        k: 'B',
        t: 'Something I intend to ship',
        s: 'Other people will depend on it.',
        go: 'green-big',
      },
    ],
  },
  'green-small': {
    kind: 'leaf',
    crumb: 'Small',
    title: 'One session, no ceremony',
    quote:
      'The mistake here is building the factory before the thing. For a weekend tool I want working software in an hour, and I am fine throwing away all of it.',
    steps: [
      {
        lead: 'Say what it does in three sentences',
        rest: ' and ask it to argue with you about the shape before writing anything.',
      },
      {
        lead: 'Skip the plan document.',
        rest: ' At this size the plan costs more than the rewrite would.',
      },
      {
        lead: 'One repo, one session, commit constantly.',
        rest: ' Every green state gets a commit — that is your undo.',
      },
      {
        lead: 'Ask it what it would do differently',
        rest: ' once it works. Take the one suggestion that is obviously right; ignore the rest.',
      },
      {
        lead: 'Write the CLAUDE.md last',
        rest: ', from what you actually did, not from what you intended.',
      },
    ],
    ch: ['#ch2', '02 · Day one'],
  },
  'green-big': {
    kind: 'leaf',
    crumb: 'Big',
    title: 'Plan, review the plan, then fan out',
    quote:
      'Anything I intend to ship gets a written plan before a line of code, and the plan gets reviewed by something that did not write it. An hour of planning routinely saves me a day of unwinding.',
    steps: [
      {
        lead: 'Interview first.',
        rest: ' Make it ask you everything whose answer changes the architecture, before it proposes one.',
      },
      {
        lead: 'Get a written plan',
        rest: ' — files, order, and the gate command that proves each step.',
      },
      {
        lead: 'Hand the plan to a fresh reviewer',
        rest: ' with no memory of writing it. Dependency order and file collisions are what it catches.',
      },
      {
        lead: 'Execute in waves',
        rest: ', each wave a small set of independent files, gate run at the coordinator between waves.',
      },
      {
        lead: 'Verify on disk after every fan-out.',
        rest: ' Long parallel runs land the big edits and skip the trailing polish.',
      },
      {
        lead: 'Fresh-eyes review before anything is pushed.',
        rest: ' Then, and only then, ask for the go-ahead.',
      },
    ],
    ch: ['#ch5', '05 · Multiplying it'],
  },
  feature: {
    kind: 'leaf',
    crumb: 'Feature branch',
    title: 'Branch, brief, gate, review',
    quote:
      'On an existing project my job is mostly to stop it from being clever. The repo already made its decisions; I want the feature to look like it was there all along.',
    steps: [
      {
        lead: 'Branch first.',
        rest: ' Nothing lands on main from a session that started with an idea.',
      },
      {
        lead: 'Point it at the closest existing thing.',
        rest: ' "Match the shape of the settings page" beats three paragraphs of description.',
      },
      {
        lead: 'Name the gate command up front',
        rest: ' so it is running your real check, not a check it invented.',
      },
      {
        lead: 'Make it show you the diff in pieces.',
        rest: ' One coherent commit per idea; a twelve-file commit is a review you will not do.',
      },
      {
        lead: 'Review with something that did not write it',
        rest: ', then run the gate yourself at the end anyway.',
      },
    ],
    ch: ['#ch6', '06 · Trusting it at scale'],
  },
  pile: {
    kind: 'leaf',
    crumb: 'The pile',
    title: 'Triage before you touch anything',
    quote:
      'Half-finished projects are not a coding problem, they are a memory problem. The question is never how to finish them. It is which two are worth finishing and what past-me was in the middle of.',
    steps: [
      {
        lead: 'Do not open an editor.',
        rest: ' Send an agent per repo to answer three questions: what is this, what state is it in, what was the last thing in progress.',
      },
      {
        lead: 'Get it back as one table',
        rest: ', not eleven summaries. You are making a keep-or-kill call, not reading code.',
      },
      {
        lead: 'Kill loudly.',
        rest: ' Archive the ones you will not finish. A dead repo you have not decided about is still costing you attention.',
      },
      {
        lead: 'For each survivor, have it write a resume note',
        rest: ' — current state, next action, known landmines — committed into the repo.',
      },
      {
        lead: 'Then pick exactly one',
        rest: ' and start a real session. The pile becomes a queue, and a queue is a solved problem.',
      },
    ],
    ch: ['#ch5', '05 · Multiplying it'],
  },
  bug: {
    kind: 'leaf',
    crumb: 'One weird bug',
    title: 'Reproduce, minimize, prove',
    quote:
      'The failure mode here is speculative fixing — three plausible changes, none verified, and now you have four problems. No repro, no fix. That rule has never once cost me time.',
    steps: [
      {
        lead: 'Get a reproduction first',
        rest: ', and forbid changes until there is one. A failing command is the whole ballgame.',
      },
      {
        lead: 'Minimize it.',
        rest: ' Strip the case down until it is small enough that the cause is nearly visible.',
      },
      {
        lead: 'One hypothesis at a time',
        rest: ', each with a check that would disprove it. Two changes at once means you learn nothing.',
      },
      {
        lead: 'When it is fixed, keep the repro as a test.',
        rest: ' Otherwise you will meet this bug again in March.',
      },
      {
        lead: 'If two attempts fail, stop and escalate',
        rest: ' — different model, fresh context, no memory of the two dead ends.',
      },
    ],
    ch: ['#ch1', '01 · Why any of this works'],
  },
}

export const START_TONIGHT = `I want to set you up properly rather than just asking you for things.

Interview me first. Ask me every question whose answer would change how
you work in this repo — how I want commits handled, what the gate command
is, what you should never touch, when to ask versus decide, and what my
last three frustrations with an AI assistant were. Do not start writing
until you have asked everything you want to ask.

Then write two files:

  1. ~/.claude/CLAUDE.md — my global working agreement, from my answers.
  2. ./CLAUDE.md — this project: stack, commands, conventions, landmines.

Keep both short. Every line should be a rule you would actually apply,
not a description of the codebase you can already read.

Then propose the first three skills worth writing for how I work, and stop.`
