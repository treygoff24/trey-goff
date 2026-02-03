# Personal Website Overhaul Implementation Plan

**Goal:** Turn the current site into a world-class personal website with a bold editorial aesthetic, clear positioning, strong CTAs, and polished motion while excluding /interactive entirely.

**Architecture:** Keep `app/page.tsx` server-first and assemble new home sections from data + small client islands for motion. Use content-collections as the single source of truth for essays/projects. Add a shared motion variants module and a global OG image generator. Keep Three.js background but avoid adding new heavy 3D.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind v4, Framer Motion, content-collections, R3F

---

### Task 1: Establish Visual System (Typography + Theme)

**Parallel:** no
**Blocked by:** none
**Owned files:** `app/globals.css`, `lib/fonts.ts`, `app/layout.tsx`

**Files:**
- Modify: `app/globals.css`
- Modify: `lib/fonts.ts`
- Modify: `app/layout.tsx`

**Step 1: Update type stack to a distinctive pairing**
- Swap the `satoshi` variable to a distinct Google font (avoid Inter) in `lib/fonts.ts`.
- Ensure `app/layout.tsx` still applies the font variables to `<html>`.

**Step 2: Refine global palette + texture**
- Update `@theme` tokens in `app/globals.css` to deepen background contrast and tune warm/accent highlights.
- Add a subtle grain/gradient utility class for section backgrounds.

**Step 3: Verify typography scale + base styles**
- Ensure hero/body/prose hierarchy still maps to `--text-*` scale.
- Confirm `body` and `.prose` stay legible on dark backgrounds.

**Step 4: Quick visual smoke check**
- Run `pnpm dev` and eyeball home + writing + projects for regressions.

---

### Task 2: Motion Primitives (Framer Motion + Reduced Motion)

**Parallel:** yes
**Blocked by:** Task 1
**Owned files:** `components/motion/variants.ts`, `components/motion/Reveal.tsx`

**Files:**
- Create: `components/motion/variants.ts`
- Create: `components/motion/Reveal.tsx`

**Step 1: Add shared motion variants**
- Implement `fadeInUp`, `staggerContainer`, and `staggerItem` variants with the standard easing curves.

**Step 2: Build a `Reveal` wrapper**
- Use `useReducedMotion()` to disable motion when requested.
- Provide `as` prop and viewport defaults (`once: true`, `amount: 0.2`).

**Step 3: Smoke test**
- Import `Reveal` in a scratch component to ensure no runtime errors.

---

### Task 3: Home Page Overhaul (Hero + Signals + Featured Work)

**Parallel:** no
**Blocked by:** Task 1, Task 2
**Owned files:** `app/page.tsx`, `components/home/HeroSection.tsx`, `components/home/SignalGrid.tsx`, `components/home/FeaturedProject.tsx`, `components/home/FeaturedWriting.tsx`, `components/home/CTASection.tsx`, `data/home.ts`

**Files:**
- Create: `data/home.ts`
- Create: `components/home/HeroSection.tsx`
- Create: `components/home/SignalGrid.tsx`
- Create: `components/home/FeaturedProject.tsx`
- Create: `components/home/FeaturedWriting.tsx`
- Create: `components/home/CTASection.tsx`
- Modify: `app/page.tsx`

**Step 1: Define home content data**
- Add hero copy, focus areas, CTA labels, and section headings in `data/home.ts`.

**Step 2: Build new hero section**
- Implement `HeroSection` with strong headline, subhead, proof points, and dual CTAs.
- Use `Reveal` for staggered entrance.

**Step 3: Build focus/signal grid**
- Implement `SignalGrid` (3–4 cards) for domains of work.
- Add hover microinteractions (lift/glow) and reduced-motion safe transitions.

**Step 4: Add featured project + featured writing**
- `FeaturedProject` pulls top `featuredRank` project from `content-collections`.
- `FeaturedWriting` shows 3 featured essays and links to `/writing`.

**Step 5: Add CTA footer section**
- Implement `CTASection` with subscribe CTA and secondary links.

**Step 6: Refactor `app/page.tsx` to server component**
- Remove `/interactive` prefetch/link and client-only hooks.
- Assemble new sections and keep `StarfieldBackground` dynamic import.

**Step 7: Visual QA**
- Confirm layout on mobile, tablet, desktop.
- Ensure Starfield background does not obscure content.

---

### Task 4: Writing Index Upgrade (Start Here + Featured)

**Parallel:** yes
**Blocked by:** Task 1
**Owned files:** `app/writing/page.tsx`, `components/writing/EssayCard.tsx`, `content/essays/governance-innovation.mdx`, `content/essays/peer-reviewed-paper-prospera-governance.mdx`, `content/essays/the-voluntaryist-constitution.mdx`

**Files:**
- Modify: `app/writing/page.tsx`
- Modify: `components/writing/EssayCard.tsx`
- Modify: `content/essays/governance-innovation.mdx`
- Modify: `content/essays/peer-reviewed-paper-prospera-governance.mdx`
- Modify: `content/essays/the-voluntaryist-constitution.mdx`

**Step 1: Mark featured essays**
- Add `featured: true` to 3 key essays in frontmatter.

**Step 2: Add “Start here” section**
- Build a featured block above tag filters.
- Use `Reveal` for scroll-in animation.

**Step 3: Refine EssayCard**
- Add a subtle featured badge and improve hover states.

**Step 4: QA**
- Ensure tag filtering still works and featured essays render correctly.

---

### Task 5: Projects Page Polish

**Parallel:** yes
**Blocked by:** Task 1
**Owned files:** `app/projects/page.tsx`, `components/projects/ProjectCard.tsx`

**Files:**
- Modify: `app/projects/page.tsx`
- Modify: `components/projects/ProjectCard.tsx`

**Step 1: Strengthen the header and layout**
- Add short “what I build” framing and CTA to subscribe or writing.

**Step 2: Improve ProjectCard layout**
- Adjust spacing, add explicit “Case study” link CTA, refine tags/roles presentation.

**Step 3: QA**
- Confirm layout is clean with a single project or multiple.

---

### Task 6: SEO + OG Image Refresh

**Parallel:** no
**Blocked by:** Task 1
**Owned files:** `app/layout.tsx`, `app/opengraph-image.tsx`

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/opengraph-image.tsx`

**Step 1: Add global OG image generator**
- Implement `app/opengraph-image.tsx` with the new visual identity.

**Step 2: Wire global OG/Twitter defaults**
- Add `openGraph.images` + `twitter.images` defaults in `app/layout.tsx`.

**Step 3: QA**
- Run `pnpm dev` and verify `/opengraph-image` renders.

---

### Task 7: Home Page E2E Coverage

**Parallel:** no
**Blocked by:** Task 3
**Owned files:** `e2e/home.e2e.ts`

**Files:**
- Create: `e2e/home.e2e.ts`

**Step 1: Add homepage assertions**
- Verify hero headline, primary CTA, featured writing section, and featured project section render.

**Step 2: Run targeted E2E**
- Run `pnpm test:e2e:chromium -- --grep "Home"` (or equivalent) and confirm pass.

---

### Task 8: Full Quality Gates

**Parallel:** no
**Blocked by:** Task 1-7
**Owned files:** none

**Files:**
- Test: `pnpm typecheck`
- Test: `pnpm lint`
- Test: `pnpm test`
- Test: `pnpm build`
- Test: `pnpm test:e2e:chromium`

**Step 1: Run typecheck**
- `pnpm typecheck`

**Step 2: Run lint**
- `pnpm lint`

**Step 3: Run unit tests**
- `pnpm test`

**Step 4: Run build**
- `pnpm build`

**Step 5: Run E2E (chromium)**
- `pnpm test:e2e:chromium`

---

## Execution Notes

- Use server-first components and keep client boundaries minimal.
- Respect `prefers-reduced-motion` everywhere.
- No `/interactive` content or links on the homepage.
