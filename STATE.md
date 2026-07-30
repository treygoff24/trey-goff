# STATE — trey-goff site

**Updated:** 2026-07-30 (post agent-friendliness ship + domain rescue)

- **Agent-friendliness build live in prod through `de2e8eb`** (5 commits pushed + verification file). Markdown mirrors: every essay + /notes/about/now/stack/machine served at `<url>.md` AND via `Accept: text/markdown`; index at /sitemap.md; /llms.txt. Canonical domain fixed (www.treygoff.com everywhere). Architecture + footguns: memory `agent-friendly-site`.
- **Hand-written mirrors drift**: `content/mirrors/{about,now,stack,machine}.md` are static transcriptions — any content change to those pages must update the mirror. No automation guards this.
- **Search Console (account lawrencegoffiii@gmail.com)**: URL-prefix property `https://www.treygoff.com/` verified via `public/googleb9d0fb99739b546f.html` (never delete); sitemap.xml submitted 2026-07-30. Domain property `treygoff.com` pending — DNS TXT is live, Google auto-verifies or click VERIFY in GSC.
- **DNS migrated to Vercel nameservers 2026-07-30** (ns1/ns2.vercel-dns.com), zombie Wix DNS evicted. Registrar: GoDaddy customer #257911591 via trey.goff@gmail.com — full map + Nov 2026 renewal risk: memory `treygoff-com-domain-infrastructure`.
- **Watch**: claude.treygoff.com resolves but TLS cert wasn't issued yet at close (curl 000) — Vercel mints async; if still down next session check Vercel domain page cert status.
- Merged branch `stack-instrument` still exists locally + on origin — delete when Trey confirms /stack deploy is healthy.
- Open /stack calls for Trey (from build review): invented starter skills in `public/stack/starter-skill-pack.md`; ch8 "mined from session logs" phrasing; `--sk-bg-sunk` token candidate; dead `pnpm.neverBuiltDependencies` in package.json.
- Research corpus backing /stack claims: `docs/_scratch/longctx-research/`, `docs/_scratch/stack2-research/` (gitignored).
- Gate: `pnpm ci:quality` — green at last push. main == origin/main.
