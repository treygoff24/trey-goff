# STATE — trey-goff site

**Updated:** 2026-07-28 (late night, post-polish)

- **/stack ("The Setup") live in prod through `b7346c5`** — 12-chapter AI field manual co-authored with Claude. Ship merge `eb327ca`, then four polish pushes: voice edit pass (`c4caa28`, cut the repeated X-is-not-Y template, restored contractions), gold glow on Why-tho triggers (`74b6da6`), Why-panel sticky-bar flush fix (`b7346c5` — sticky top:0 resolves against the scrollport's *padding* edge; scroller must have no padding-top).
- Surfaced site-wide: top nav + footer "The Setup", homepage hero action "How I work with AI →" + Ways-in row.
- Merged branch `stack-instrument` still exists locally + on origin — delete when Trey confirms deploy is healthy.
- Open calls flagged for Trey (from the /stack build review):
  - `public/stack/starter-skill-pack.md` lists six invented starter skills, not his real six.
  - ch8 lede "mined from my session logs" is slightly generous phrasing.
  - ~6 sites use raw `rgba(3,14,9,…)` recessed shade → candidate `--sk-bg-sunk` token (see `components/stack/*.css`).
  - `package.json` still carries dead `pnpm.neverBuiltDependencies` (superseded by `pnpm-workspace.yaml`); pnpm warns every run.
  - "full grandeur" never appears in shipped copy (voice-editor flag) — fine unless Trey wants the phrase itself on the page.
- Research corpus backing /stack claims: `docs/_scratch/longctx-research/`, `docs/_scratch/stack2-research/` (gitignored — ground truth for cited figures).
- Gate: `pnpm ci:quality` — green at last push. main == origin/main.
