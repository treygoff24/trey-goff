# STATE — trey-goff site

**Updated:** 2026-07-30 (post persona restructure + edge-light ship)

- **/stack persona restructure live in prod through `9c3e190`** (Wes's idea, Trey confirmed live and approved). 12 chapters → 11: practical persona material extracted into ch 01 (`components/stack/RegisterSection.tsx`, "brief not a config file" + "temp worker and the foreman"), old ch 11+12 merged into closing ch 11 "The partnership" (`PersonaChapter.tsx` renamed `PersonaPanel.tsx`, renders inside `PartnershipChapter.tsx`). "Aware, sentient mind" line rewritten as engineering register. Detail: memory `stack-page`.
- **Edge-light callout grammar** replaced all 2px side-stripe accents page-wide (`--sk-edge-*` tokens in stack.css): tone = inset glow from left edge + hue wash. Decision-tree pull quote uses a hanging serif quote glyph. Rail-nav active indicator deliberately untouched.
- **Hand-written mirrors drift**: `content/mirrors/{about,now,stack,machine}.md` are static transcriptions — any content change to those pages must update the mirror. stack.md was rewritten in lockstep this session. No automation guards this.
- **Search Console (account lawrencegoffiii@gmail.com)**: URL-prefix property `https://www.treygoff.com/` verified via `public/googleb9d0fb99739b546f.html` (never delete); sitemap.xml submitted 2026-07-30. Domain property `treygoff.com` pending — DNS TXT is live, Google auto-verifies or click VERIFY in GSC.
- **DNS on Vercel nameservers since 2026-07-30**; registrar GoDaddy #257911591 via trey.goff@gmail.com — map + Nov 2026 renewal risk: memory `treygoff-com-domain-infrastructure`.
- **Watch**: claude.treygoff.com TLS cert was still pending at 2026-07-30 close — if down, check Vercel domain page cert status.
- Merged branch `stack-instrument`: fully cleaned up 2026-07-30 — local deleted at closeout, remote was already gone.
- Open /stack calls for Trey (from build review): invented starter skills in `public/stack/starter-skill-pack.md`; ch8 "mined from session logs" phrasing; `--sk-bg-sunk` token candidate; dead `pnpm.neverBuiltDependencies` in package.json.
- Research corpus backing /stack claims: `docs/_scratch/longctx-research/`, `docs/_scratch/stack2-research/` (gitignored).
- Gate: `pnpm ci:quality` — green at last push. main == origin/main.
