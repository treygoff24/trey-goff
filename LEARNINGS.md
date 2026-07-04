# Project Learnings

> Append entries at session end. Read recent entries at session start. This accumulator compounds insights across builds.

---

## Template Entry

```markdown
## YYYY-MM-DD — [Feature/Project Name]

**What Worked:**
- [Specific technique or decision that paid off]

**What Failed:**
- [Approach that didn't work and why]

**Patterns:**
- [Reusable insight for future builds]
```

---

## Example Entries

### 2024-01-15 — User Authentication Feature

**What Worked:**
- Writing integration tests before implementing the auth flow caught API contract mismatches early
- Splitting the auth provider into smaller hooks (`useAuth`, `useSession`, `usePermissions`) made testing easier

**What Failed:**
- Initially tried to handle all auth states in a single context, led to complex conditional logic
- Skipped error state UI during first pass, had to retrofit later

**Patterns:**
- Always design error states alongside happy paths in the spec
- For auth flows, write the logout flow first - it exercises the same paths but is simpler

### 2024-01-22 — Dashboard Performance Optimization

**What Worked:**
- Profiling before optimizing identified the actual bottleneck (excessive re-renders, not data fetching)
- Memoizing expensive list computations with `useMemo` + stable keys solved 80% of the issue

**What Failed:**
- First instinct was to add caching, but the problem was client-side rendering, not data fetching

**Patterns:**
- Profile first, optimize second - intuition about performance issues is often wrong
- Virtual scrolling is usually overkill for lists under 1000 items; simple memoization suffices

---

## Your Learnings

<!-- Add your entries below -->

### 2026-07-04 — The Workshop (foundry build, feat/the-workshop)

**What Worked:**
- The foundry loop earned its keep every round: three waves, each implement→gate→review→fix→re-review-until-dry. Every single wave's review caught something real (inverted SSR visibility contract; viewport-scaled collision math; focus-trap escape from a tabindex=-1 title).
- Evidence over debate: two "would not ship" review findings died to a 30-second headless-Chromium repro (custom-property var() chains DO resolve for canvas fonts) and a React commit-ordering trace (reduced-motion race impossible). Testing a reviewer's claim is cheaper than arguing with it.
- One projects.json spine with build-time Zod invariants (sealed rows, dangling lineage, duplicate ids) means bad curation fails the build, not the page.
- Visual-QA critic loop (6 rounds, 12 agents) found things no code review can: label collisions, dead footer link, the transparent-header collision, install commands collapsing into GitHub links.

**What Failed:**
- GLM droid lane fabricated a completion report about an unrelated planning doc (zero edits, confident prose). Report-validity check + git status caught it; benched, rerouted to Kimi.
- Kimi reports its own fixes as "already present" — verify by grep, its work is real but its narration is unreliable.
- Playwright e2e clicking SSR HTML before hydration = 1-in-3 mobile flake. Fix: wait for the shell's data-hydrated beacon (but never in no-JS contexts).
- npx playwright install fetches version-mismatched browsers when the repo pins via pnpm — use pnpm exec playwright install.

**Patterns:**
- Coordinator reads diffs, never trusts reports: caught a lane refactoring a committed reviewed contract while describing it as a "fix."
- Sealed/redacted rows for private work read stronger than omission — density is the message.
