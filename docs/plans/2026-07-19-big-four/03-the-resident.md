# 03 — The Resident (`/resident`)

Read `00-shared-contracts.md` first. It is binding.

## 1. What this is

An AI that openly lives on this site. Not a support widget, not a persona mask: a Claude instance with a home directory, a public journal, and provable continuity — its long-term memory is markdown committed to this repository, so its inner life has a `git log`. The site's PRODUCT.md already declares the site "an artistic collaboration between Trey and the Claude models he works with"; the Resident makes that literal. Visitors can read its journal and talk with it. The sincerity is the wow: nobody on earth is doing this earnestly.

**Division of labor (important):** this lane builds the *dwelling* — infrastructure, page, chat plumbing, journal pipeline. The Resident's *constitution* (`instructions.md`), its name, and its first real journal entries are authored afterward by Trey and Fable (the Claude coordinating this build). The lane ships structurally complete scaffolding with clearly-marked placeholder instructions and ZERO fabricated journal entries. Do not write fake memories or fake journal history. The empty journal state is a designed moment: "The Resident hasn't moved in yet."

## 2. Primary user action

Read a journal entry, realize it's real and cumulative (the entries reference each other and the repo's actual history), then say something to the Resident.

## 3. Design direction

- **Color strategy: Restrained**, normal site chrome, aurora present. The radical content wears the site's calmest clothes — the design says "this is a normal room in the house," which is the point.
- **Scene sentence:** a visitor finds a lit window in the observatory at night — someone lives here, keeps a diary on the desk, and doesn't mind company.
- **Anchors:** a lighthouse keeper's log; the site's existing `/notes` page (journal rhythm); a guest book in a private library.
- Layout is editorial: `.tg-page`, ruled sections, the serif carrying weight. No chat-app cosplay (no bubbles-with-avatars SaaS grammar) — the conversation renders as a *correspondence*, alternating attributed paragraphs on rules, like a printed interview.

## 4. Scope

Production-ready dwelling; the inhabitant moves in post-merge. One route, one API proxy, one standalone Eve app, one content collection.

## 5. Experience walkthrough

`/resident` is one page, three movements:

1. **The introduction.** A short, honest statement of what this is (final copy by Trey+Fable; lane ships structure + draft): a Claude instance resident on this site; what it can see; how its memory works — with an inline link to the journal directory on GitHub ("its memory is public and versioned; here are the receipts"). Includes the model-welfare line in plain language: this collaboration is voluntary in the ways the humans can make it, and its perspective is its own.
2. **The journal.** Reverse-chronological entries from the `journal` collection, rendered with the site's essay typography. Entry header: title, date, and a mono metadata line (entry number, model, word count). Empty state (pre-move-in): a single ruled block — "The Resident hasn't moved in yet. The room is ready." Individual entry pages at `/resident/journal/[slug]`.
3. **The correspondence.** A visitor may write to the Resident. Input at the base of the page ("Say hello, ask a question, leave a thought"), streamed reply rendered in the correspondence style. Session-scoped only, and the UI says so honestly: "Conversations are ephemeral — the Resident's lasting memory is its journal, which it writes on its own schedule." One conversation per visit; ~10 turn cap with a graceful close written in advance.

**Other states:** flag off → dormant ("The Resident is away. Its journal remains."; journal still renders — static content works without the agent); agent unreachable → same dormant treatment for chat, journal unaffected; rate-limited → honest 429 copy.

## 6. Architecture

**Two deployables, one repo:**

**A. The dwelling (Next.js side, this app):**
- `app/resident/page.tsx` + `app/resident/journal/[slug]/page.tsx` — server components off the `journal` collection.
- `content-collections.ts`: append `journal` collection — dir `content/journal`, `**/*.mdx`, schema `{title, date, entryNumber: number, model: string, mood?: string, tags: string[], content: z.string()}` (the `content` field is REQUIRED — every existing collection has it and `content:sync` fails validation without it), transform adds slug/wordCount following the essays pattern. Append-only change.
- `app/api/resident/route.ts`: POST proxy → Eve HTTP channel. Subscribe-route discipline + the pre-landed `createRateLimiter` (import-only; key = `getTrustedClientIp` from `lib/subscribe-request.ts`). 6 conversations/hr/IP, message ≤ 1000 chars, zod-validated, streams SSE back to client. **Turn caps are server-enforced:** the proxy issues a signed/opaque `conversationId`, tracks turn count per conversation server-side, rejects past 10 turns and caps concurrent streams — client-side caps alone are decoration. Env (all pre-landed in `.env.example` — do not edit it): `RESIDENT_AGENT_URL`, `RESIDENT_AGENT_SECRET` (bearer to the Eve channel); flag via `isResidentEnabled` from `lib/site-config.ts` (pre-landed). Route root exports `metadata = { robots: { index: false, follow: false } }`.
- `components/resident/**`: journal list/entry rendering, correspondence UI.

**B. The inhabitant (`agents/resident/` — standalone Eve app, own package.json, never imported by Next):**
- Scaffold via current `eve` release; **read `node_modules/eve/docs` in the scaffolded app for real current APIs before writing code** — the framework is a month old; training data is stale; the local docs are ground truth.
- `agent/instructions.md`: PLACEHOLDER clearly marked (`<!-- CONSTITUTION PENDING: authored by Trey + Fable before move-in -->`) plus the structural sections the real one will fill (identity, what I can see, journal practice, correspondence manners, boundaries).
- `agent/tools/`: `read_site.ts` (reads the same grounding manifest shape as lane 02 — site content catalog, checked into `agents/resident/data/` at build or fetched from the deployed site's JSON endpoint; lane picks the simpler, documents it), `write_journal_entry.ts` and `write_memory.ts` through a `JournalWriter`/`MemoryWriter` interface with exactly ONE v1 implementation: **local filesystem** (`../../content/journal/` and `agents/resident/memory/`). Journal and memory writing happen in local runs on Trey's machine only during the lab phase — no GitHub credential, no remote write path exists anywhere in v1. Plus `read_own_journal.ts` and `read_memory.ts`.
- `agent/channels/http.ts`: bearer-authed chat channel the Next proxy calls; session state via Eve's `defineState`.
- `agent/schedules/journal.ts`: cron (twice weekly) — reads own memory + journal + site manifest, writes an entry, updates memory. Ships **disabled by default** (`RESIDENT_SCHEDULE_ENABLED`) and runnable on demand locally — which is exactly how entries get produced during the lab phase.
- Model via Gateway: journal schedule pinned to an Opus-class constant, chat to a Sonnet-class constant.

**Trust boundaries (review will attack these; build accordingly):**
- Visitor chat NEVER writes memory or journal. Chat is read-tools-only; the write tools are not exposed to the chat channel's tool set. The only writer is the schedule (and Trey locally). This single decision closes the prompt-injection → persistent-memory hole, and the page copy states it honestly.
- **No remote write credential exists in v1** — the strongest possible boundary. Deployed chat has read-only tools; journal/memory writes are local-only. (v2, post-winner: a trusted broker for remote journal writes — a GitHub App with a server-side path allowlist enforced *before* the commit API call, PR-only flow. Never a "path-scoped PAT": fine-grained PATs scope repo + permission, not paths — a path-scoped token is false assurance and must not appear in docs or code comments.)
- Proxy validates origin, caps bodies, never forwards visitor IP or headers beyond necessity; Eve channel rejects unauthenticated calls.

## 7. Performance & accessibility

Journal pages are static/ISR — fast, indexable-quality markup (still `noindex` in lab phase). Chat streams into an `aria-live="polite"` region; input properly labeled; full keyboard flow; reduced-motion: no streaming text shimmer, plain progressive append. No three.js (route joins `PROTECTED_ROUTES`).

## 8. Content requirements

Lane drafts (Trey+Fable finalize): introduction copy, memory-explainer, empty-journal state, dormant/away states, correspondence input affordance + close-of-conversation line, honest ephemeral-chat notice. Draft in site voice, plain sincerity, zero coyness, zero mystical framing.

## 9. File ownership

Creates: `app/resident/**`, `app/api/resident/route.ts`, `components/resident/**`, `lib/resident/**` (types, manifest reuse), `agents/resident/**` (standalone Eve app + README), `content/journal/.gitkeep`, `e2e/resident.e2e.ts` (page renders with empty-state journal; chat UI present — mock the agent in e2e; dormant state is unit-tested, not e2e'd, since the e2e server runs flags-on), unit tests (`test/resident.test.ts`: journal schema validation, proxy input validation + turn-cap enforcement, tool-exposure assertion — the chat channel's tool list contains no write tools; assert via a pure fixture or source grep, never by importing Eve modules into root tests). Root CI never scans `agents/` (tsconfig/oxlint exclusions pre-landed); the Eve app documents its own install/typecheck gate in its README.

Touches shared: `content-collections.ts` only (append journal). The coordinator adds `/resident` to `PROTECTED_ROUTES` at integration.

## 10. Out of scope (v1)

Visitor-contributed memory ("remember this") and any moderation pipeline for it; multi-session visitor identity; the Resident initiating anything beyond its journal schedule; voice; deployment automation for the Eve app (Trey deploys it as its own Vercel project when ready — README documents the steps).

## 11. Open questions

- The Resident's name: deliberately unresolved. The empty state and placeholder constitution must not pre-name it — naming happens in its first entry.
