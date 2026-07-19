# 02 — The Edition (`/edition`)

Read `00-shared-contracts.md` first. It is binding.

## 1. What this is

The site inverted: instead of Trey presenting himself, the site asks the visitor one question — *"What brought you here?"* — and composes a bespoke edition of itself in front of them. A journalist writing about Próspera gets the policy work, the press-ready bio, the right three essays. An engineer gets the tooling, the colophon, the Workshop. The composition streams in as real site components with real links — generative UI grounded entirely in existing content. The wow is watching a personal site *typeset itself for you*.

## 2. Primary user action

Answer one question (chip-tap or free text) and watch a personally-composed front page assemble, then follow one of its links deeper.

## 3. Design direction

- **Color strategy: Restrained** — this is an editorial surface; the site's existing register carries it. The spectacle is *typographic choreography*, not new visual vocabulary.
- **Scene sentence:** a night visitor tells the doorkeeper of a private study why they've come, and watches the desk being set for them — the right books pulled, the right pages opened.
- **Anchors:** a letterpress compositor setting a page live; the site's own editorial rows; a great concierge's "I know exactly what you need" moment.
- Global aurora stays (normal chrome page). Motion budget goes to the *assembly*: sections materialize with the site's existing rise/fade grammar, staggered as they stream — the reveal enhances already-renderable content (each section renders complete as its data arrives; no content gated behind animation).

## 4. Scope

Production-ready, one route + one API route, full streaming interactivity, mobile-first-class.

## 5. Experience walkthrough

**State A — The question (default).** Quiet, centered, generous whitespace. The site serif asks: *"What brought you here?"* Below: 4 chips (`Writing about Próspera` · `Evaluating the engineering` · `Policy & governance work` · `Just curious`) and a free-text input ("or say it your way"). One line of fine print: "Composed live from what's actually on this site, by a language model. ~15 seconds." Also a quiet escape link: "or browse the usual way →" (to `/writing`). Must be beautiful *before* any AI runs — this state is the page most visitors see first.

**State B — Composition (the wow).** On submit, the question compresses upward into a small standfirst restating the visitor's intent in the site's voice (streamed first, so response feels instant). Sections then stream in one at a time — each an editorial block using existing site affordances (`EditorialIndexRow`, standfirst paragraphs, hairline rules): a tailored opening paragraph, then 2–4 content sections (selected essays / projects / library shelf / transmissions / about-pointer), each with one line of connective copy explaining *why this, for you*. A subtle progress affordance (the section rule draws in) while streaming. Total target: first section < 3s, complete < 20s.

**State C — The composed edition.** Streaming done: a complete, calm front page for this one visitor. Footer of the edition: "Composed [date] for a visitor who [intent paraphrase]. Everything above is real — every link, every essay." + "Compose again" + "Browse the usual way". No share/permalink in v1.

**Other states:** feature flag off → designed dormant state ("The Edition is resting. Browse the usual way →"); rate-limited → honest, warm 429 copy with the static paths; model/gateway error mid-stream → keep whatever sections landed, append a hand-written fallback section linking the four main routes (never a blank or half-broken page); JS disabled → server-rendered State A with the escape link functioning as plain navigation.

## 6. Architecture

**Grounding manifest (build-time).** `lib/edition/manifest.ts` builds a compact catalog from `content-collections` (essays, notes, projects) + `lib/books` + `lib/transmissions` + `content/media/appearances.json`: `{type, slug, title, date, summary, tags}` per item, plus a short fixed bio block. Target < 25k tokens serialized. Generated at module scope on the server (all sources are build-time data already) — no new build script unless import cycles force one.

**API route.** `app/api/edition/route.ts`, following the subscribe-route discipline + shared-contracts rate limiting (10 req/hr/IP). Uses `ai@6` `streamObject` with `gateway('anthropic/claude-sonnet-4.5')` (pinned as `EDITION_MODEL` constant — verify current sonnet alias against gateway docs at build time). Zod output schema:

```ts
{ intent: string,            // ≤140 chars, second person, site voice
  opening: string,           // ≤500 chars
  sections: Array<{          // 2–4
    kind: 'essays'|'projects'|'library'|'transmissions'|'about',
    lede: string,            // ≤200 chars, why this for you
    slugs: string[]          // 1–4, MUST exist in manifest
  }>,
  closing: string }          // ≤300 chars
```

**System prompt contract:** model is a *compositor*, not an author — it selects real items and writes only connective tissue; it never invents facts about Trey beyond the provided bio block; visitor text is delimited as untrusted data (prompt-injection in the visitor's answer must not change the rules — red-team this in review); tone rules from the site voice. Temperature modest; max tokens bounded.

**Client renderer.** `components/edition/**` consumes the partial-object stream (`useObject` or manual reader — lane's choice, verify against local `ai@6` docs). **The renderer is the guardrail:** every slug is resolved against the manifest; unknown slugs are dropped silently; empty sections are skipped; links are built from resolved items only — a hallucinated URL is unrepresentable. Free-text input: 500 char cap, byte-capped body, zod on the way in.

**Env/flag:** `NEXT_PUBLIC_ENABLE_EDITION` + `AI_GATEWAY_API_KEY` documented in `.env.example` (create if absent). Flag off → API 404s and page renders dormant state.

## 7. Performance & accessibility

- State A: static server-rendered, zero AI cost, LCP < 1.5s. No three.js (route joins `PROTECTED_ROUTES`).
- Streaming renders progressively; no layout shift on section arrival (sections append below, never reflow above; rules reserve no speculative space).
- Reduced motion: sections appear instantly (opacity-only, no rise), stream still works. Standard CSS kill-switch covers the rest.
- The streaming region is `aria-live="polite"` at the *section* granularity (announce section arrival, not token spam). Chips are buttons; the whole flow keyboard-completable. Focus management: on submit, focus moves to the intent standfirst.

## 8. Content requirements

All copy authored in-spec quality, coordinator reviews at merge: the question, 4 chips, fine print, escape link, dormant/429/error/fallback-section copy, edition footer lines, "Compose again". The connective copy the model writes is bounded by schema lengths above; the system prompt includes 2 example sections in-voice (written by the lane, reviewed at merge).

## 9. Cost & abuse posture

Sonnet-class, one call per composition, hard `maxOutputTokens`, rate limit 10/hr/IP + global daily circuit breaker (env-set cap, in-memory counter; when tripped, dormant state). This is a lab route: worst-case spend is capped and boring.

## 10. File ownership

Creates: `app/edition/page.tsx`, `app/api/edition/route.ts`, `components/edition/**`, `lib/edition/**` (manifest, schema, prompt), `lib/rate-limit.ts` (extracted from the subscribe pattern — subscribe route itself left untouched), `.env.example`, `e2e/edition.spec.ts` (State A renders + chips visible + escape link; mock the API in e2e — no live model calls in CI), unit tests for schema validation + slug-resolution guardrail (`test/edition.test.ts`: unknown slugs dropped, injection-shaped intent text doesn't leak into links, section caps enforced).

Adds dependency: `ai` (v6.x) — the only lane allowed to touch `package.json`.

## 11. Out of scope (v1)

Multi-turn refinement ("more like this"); permalinks/sharing of compositions; caching compositions; personalization memory; any second model call.

## 12. Open questions

- Chip labels are drafts — Trey may want different personas fronted (investor? press vs researcher?). Trivial to change post-build; flagged for his pass.
