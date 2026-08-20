# Stranger VQA — Wave 2 preview, desktop 1440×900, 2026-08-20

Preview: https://trey-goff-a1jcw8zkq-trey-freelance.vercel.app (feature branch at 02ce610, Waves 1–2 merged). Same repo-blind Opus persona. Screenshots: `/tmp/trey-goff-review/stranger3-desktop/` (114, local).

Wave 2 gate: the top-10 contains none of the Wave 2 beads (phone nav, titles under header, chapter pill, homepage tags, chart labels, ch7 scoreboard). Passed. Most of the top 10 is Wave 3 work already in flight (projects/Próspera, library River, media, ledger, freshness, graph, stack mode-pill contrast).

## New since the Wave 1 preview

- **Garbled sentence on /jobsite** in a "Going deeper" callout: *"Going deeper: hard mode's chapters 6 and 10, and chapter 10 is where this stops being an analogy and starts looking like a small construction firm."* Chapter 10 twice, first clause has no verb (`jobsite-s12.png`).
- **/stack rail ghosts through the footer** at the bottom: the fixed left rail never stops while the footer is 72% opaque, so the rail's progress bar floats behind "Trey Goff / Designing systems…"; the footer is also pushed right to x=300 on /stack vs 168 elsewhere (`stack-blank-check.png`). Follow-up to W1-2.
- **Six different page gutters**: headline left edge 96px (/graph), 144 (/library, /projects), 208 (/about, /writing), 272 (/topics), 336 (/now, /resident, /colophon), 384 (/notes), 32 (ledger). Content slides sideways up to 288px between nav clicks. "The single most amateur tell."
- **Smooth scroll on rail jumps**: clicking chapter 11 on /stack is a 5+ second animated ride through 50,000px.
- **TOC clicks overshoot** on the memory essay (heading lands 372px below the reading-area top; no active item highlighted); the sidebar TOC is clipped flat at the window bottom with no scroll cue (`anchor-clearance.png`).
- **Topic pages use a different type system** (Hanken Grotesk 48px sans vs Spectral 64px serif elsewhere), generic rounded cards, "0" stat tiles (`x-topic-philosophy.png`).
- **/jobsite is a walled garden**: no header, one "← treygoff.com" link at the top, 29,000px long; two screens in there is no way out but browser-back. Both Wave 1 personas said the same. Consider a persistent small home affordance.
- **Claims Ledger fixed chrome**: header (97px) + sticky "THE LEDGER" bar stack to y=354 of 900 (39%); the bar is 95% opaque so text ghosts through (`e-ufo-4.png`). W3-7 territory.
- **/stack callouts overhang** the prose column (904px vs 704px; 28px left, 228px right) so the right margin wobbles while scrolling.
- Two amber elements break the palette: the /jobsite progress bar and the "WHY THO?" button on /stack (voice also out of register).
- Homepage voids: ~200px between "Governance experiments" and "Featured essays", ~200px before the footer.
- Library lens switcher straddles the panel's top border and cluster labels behind it ("LIVES", "HISTORY") are cut by the panel edge. W3-1.
- Unexplained signatures: the 404 fable signed "— F."; "AURORA" in the footer (W3-5 glosses Aurora).
- Still: no photo of Trey; "Online ●" unexplained (W3-5); Library "155 topics" vs Topics "168 threads".

## Top 10 by damage

| # | Issue | Page | Evidence |
|---|---|---|---|
| 1 | All four "Selected work" cards link to bare `/projects`; Próspera and governance aren't on that page | `/` → `/projects` | `home-03.png`, `pg-projects-1.png` — W3-4 |
| 2 | Active mode pill 1.27:1 contrast at 10.9px (`rgb(232,243,236)` on `rgb(151,232,187)`); same on "REVIEWER WITH A FLOOR" | `/stack` | `stack-01.png`, `stack-s18.png` — W3-9 |
| 3 | River view reads as broken: empty 600px panel, bars cut off, 5,882px strip in a 1,240px box with no scroll hint | `/library` | `pg-library-river2.png` — W3-1 |
| 4 | Six page gutters; content jumps sideways between pages | site-wide | measured across 11 pages — new |
| 5 | Featured card text clipped mid-glyph (102px clip vs 160px content, 22.86px line-height) | `/media` | `pg-media-1.png` — W3-3 |
| 6 | `/jobsite` has no site navigation; unreachable exit for 29,000px | `/jobsite` | `jobsite-s04.png` — new |
| 7 | Topic pages look unstyled (different type system, "0" tiles) | `/topics/philosophy` | `x-topic-philosophy.png` — new |
| 8 | Ledger: 354px of fixed chrome, ghosting sticky bar, section D missing | `/writing/ufo-claims-ledger` | `e-ufo-4.png` — W3-7 |
| 9 | Broken "Going deeper" sentence | `/jobsite` | `jobsite-s12.png` — new |
| 10 | `/now` five months old and orphaned; `/notes` two entries, two years old | `/now`, `/notes` | `pg-now-1.png` — W3-5 |

Below the cut: /stack rail ghosting through the footer; 5s smooth-scroll rail jumps; TOC overshoot with no active highlight; the graph hairball (W3-2); search not finding Próspera (W3-4).

## Loved

`/jobsite` ("would forward today, to four people" — the bench, rules vs machinery, the COPY BRIEF ending); the homepage headline; the 404 fable; `/resident`; the Library constellation and shelf; the Colophon.

## Jargon

ZEDE · SEZ · sitrep · repo · CLI · harness · subagent · context window (cold on /stack and /projects) · compaction · token / 200K tokens · diff · lint · commit · exit codes · schema · vector search · BM25 · embeddings · frontmatter / YAML · daemon · worktree · CLAUDE.md / AGENTS.md / STATE.md · MCP · Agent SDK · `claude -p` · Codex / Cursor / Grok / Kimi / GLM / DeepSeek · orchestrator · fan-out · scaffolding · guard hook · the gauntlet · occupancy · swarm · instrumented pieces · transmissions · dossiers · AURORA · F. · Online ● · LEFT LEDGER · Type A / Type B · unfalsifiable. Landed well on /jobsite: agent, model, skill, rules board, procedure cards, logbook, the bench, hooks, Claude Code.
