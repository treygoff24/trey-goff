# 05 — Classified (`/classified`)

Read `00-shared-contracts.md` first — its design-system, motion/a11y, copy-voice, and verification rules are binding here too. This feature is NOT part of the four-way lab evaluation; it ships for real. It has its own threat model section, which overrides anything softer.

## 1. What this is

A private reading room for writing Trey can't publish publicly, accessible only to friends holding a secret link — wrapped in a joke. Strangers who find `/classified` get a delightful bureaucratic-parody denial page ("you've stumbled into the records division without clearance"); friends who clicked Trey's key link once get the actual essays, rendered with the site's full editorial care. The gag is the cover: the page's public face reads as an easter egg, not as a door with something behind it.

## 2. Threat model (binding, overrides taste)

**Guarantees this build must deliver:** (1) content is never present in the public repo, any build artifact, client bundle, search index, RSS, sitemap, graph data, or OG image; (2) content renders only server-side, only after cookie validation, with `Cache-Control: no-store, private` and `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` (gag page gets the robots header too); (3) rotating one env var (`ANNEX_SECRET`) instantly invalidates every cookie everywhere; (4) with env vars absent (preview deployments, forks), the route degrades to the gag page with nothing behind it — Vercel env vars are production-scoped, documented for Trey.

**Explicit non-guarantee:** a trusted friend can screenshot anything. The system makes leaks a human choice, never an infrastructure accident.

## 3. Mechanism

Generalize the existing draft-preview pattern (`proxy.ts` + `lib/preview-auth.ts` — read both first; mirror their structure):

- `/classified?key=<ANNEX_SECRET>` → proxy validates (constant-time compare, reuse the helper), sets `annex_session` HttpOnly cookie (HMAC-derived token like `previewSessionToken`, `maxAge` 90 days, `secure`, `sameSite: 'lax'`), strips the query, redirects clean. Invalid/absent key → gag page, query silently stripped.
- All annex content routes check the cookie server-side; no cookie → redirect to `/classified` (gag).
- New `lib/annex-auth.ts` alongside `lib/preview-auth.ts` (same idioms, separate secret + cookie so preview and annex rotate independently). Add the annex bootstrap to `proxy.ts` parallel to `tryPreviewSecretBootstrap` — minimal diff, no restructuring.
- Check `lib/security/csp.ts` `isStrictCspPath` and follow whatever pattern the route needs for CSP correctness.

## 4. Content pipeline

- Source: private repo `treygoff24/annex-content` (exists, seeded with README + `entries/welcome.md` sample). Structure: `entries/*.md` with frontmatter `title`, `date`, `summary` (a ~15-line hand-rolled frontmatter parser is fine — no new deps; unit-test it).
- Server-side fetch via GitHub contents API using `ANNEX_GITHUB_TOKEN` + `ANNEX_CONTENT_REPO` env vars, in `lib/annex/content.ts`. In-memory cache with ~60s TTL so Trey's pushes go live fast without hammering the API. Every failure mode (no token, 404, rate-limit, network) degrades to a designed in-voice state — never a stack trace, never a broken page.
- Render through the existing `lib/markdown.ts` pipeline (sanitized HTML, site typography). Server components only; content strings must never reach a client component's props.
- CRITICAL: nothing here touches content-collections, the search index, feeds, or the graph — structurally excluded by never entering those pipelines. Do not "helpfully" integrate.

## 5. Experience

**The gag (public face).** Full parody of a government records portal, executed in the site's own tokens (mono labels, one green, ruled layout — the site's mono/eyebrow grammar is genuinely perfect for bureaucratic parody). A fictional agency — "OFFICE OF THE ARCHIVIST · RECORDS DIVISION" or the lane's better invention — NEVER real CIA/NSA/FBI names, seals, or insignia. Elements: a classification banner, a case-file header with absurd metadata (form numbers, a "declassification date" centuries out), redaction bars (`████`) over teasing nonsense, a DENIED stamp treatment, and one deadpan footer line in Trey's voice. Funny on first read, still charming on fifth. Reduced-motion safe (any stamp/redaction animation gets a static variant). This page is static-renderable (no secrets on it) but still carries the robots headers.

**Clearance granted (friends).** After the cookie: the same page resolves to a quiet reading room — one beat of continued bit ("CLEARANCE GRANTED · welcome back" in mono), then drops the joke entirely: an editorial index of entries (`EditorialIndexRow`), each opening to full essay typography (`Prose`-grade). The writing is the point; the gag ends at the door. Entry pages live under `/classified/[slug]`, same cookie check, same headers.

**States:** gag (no cookie); reading room (cookie, entries); empty reading room (cookie, no entries yet — "Nothing is currently declassified." in-voice); fetch-failure (cookie, GitHub unreachable — "The archive is temporarily sealed." + retry); env-absent (gag only, content paths 404).

## 6. File ownership

Creates: `app/classified/**` (page, `[slug]` page, layout with robots metadata), `components/classified/**`, `lib/annex/**` (content fetch, frontmatter parser), `lib/annex-auth.ts`, `e2e/classified.e2e.ts` (gag renders for strangers; cookie path shows reading room with fetch mocked; no-store + robots headers present), `test/annex.test.ts` (frontmatter parser, auth token derivation + constant-time compare, cookie→content gating, failure-mode degradation, and a source-level assertion that no annex module is imported by any client component or content-collections consumer).

Touches shared: `proxy.ts` ONLY (add the annex bootstrap — minimal parallel addition; existing preview flow byte-identical). `.env.example` already contains the annex vars (pre-landed — do not edit). No package.json changes, no new deps.

Never touches: anything owned by the Big Four lanes (see 00 matrix), content-collections, search/feed/graph/sitemap code.

## 7. Verification

`pnpm content:sync && pnpm lint && pnpm typecheck && pnpm test`; e2e if port 3101 free (Big Four lanes may hold it — skip honestly if so). All GitHub fetches mocked in tests — no live token exists in your environment; say plainly that the live fetch path is untested (the coordinator smoke-tests it with a real token at integration).

## 8. Out of scope

Per-friend tokens/attribution (v2 if a leak ever bites); an admin UI; moving Trey's existing draft files (he decides what migrates, when); any mention of this feature in nav, sitemap, or public pages.
