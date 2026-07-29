# STATE — trey-goff site

**Updated:** 2026-07-28

- **/stack ("The Setup") SHIPPED to production** — 12-chapter AI field manual co-authored with Claude, merged `stack-instrument` → `main`, pushed `eb327ca`. Surfaced in top nav + footer ("The Setup") and homepage (hero action "How I work with AI →" + Ways-in row).
- Merged branch `stack-instrument` still exists locally + on origin — delete when Trey confirms deploy is healthy.
- Open calls flagged for Trey (from the /stack build review):
  - `public/stack/starter-skill-pack.md` lists six invented starter skills, not his real six.
  - ch8 lede "mined from my session logs" is slightly generous phrasing.
  - ~6 sites use raw `rgba(3,14,9,…)` recessed shade → candidate `--sk-bg-sunk` token (see `components/stack/*.css`).
  - `package.json` still carries dead `pnpm.neverBuiltDependencies` (superseded by `pnpm-workspace.yaml`); pnpm warns every run.
- Research corpus backing /stack claims: `docs/_scratch/longctx-research/`, `docs/_scratch/stack2-research/` (gitignored — ground truth for cited figures).
- Gate: `pnpm ci:quality` — green at ship.
