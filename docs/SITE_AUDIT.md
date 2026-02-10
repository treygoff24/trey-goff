# Comprehensive Site Audit — trey.world

**Date:** 2026-02-10
**Scope:** Full codebase audit across 6 domains
**Auditors:** 6 parallel specialist agents (Architecture, Performance, SEO, Accessibility, Security, UX/Content)

---

## Executive Summary

trey.world is a sophisticated Next.js 16 personal website with excellent architectural decisions, premium design, and strong engineering discipline. The site features a 3D floating library, interactive world, knowledge graph, command palette navigation, and a content system built on Content Collections + MDX.

**The site's greatest strength is its design and technical foundation. Its greatest weakness is content sparsity.**

### Scores by Domain

| Domain | Grade | Score | Key Finding |
|--------|-------|-------|-------------|
| Architecture & Code Quality | B+ | 85/100 | Excellent patterns, minor type safety gaps |
| Performance & Bundle | B | 75/100 | Good isolation, critical asset optimization gaps |
| SEO & Metadata | B+ | 82/100 | Strong foundation, missing canonicals & feed discovery |
| Accessibility | B- | 72/100 | 43 issues (9 critical), but good foundations |
| Security | B+ | 80/100 | Low attack surface, dependency CVE needs patching |
| UX, Content & Design | C+ | 68/100 | Design 9/10, Content 4/10 |

**Overall: B (77/100)** — Beautiful foundation waiting for substance.

---

## Critical Issues (Fix Immediately)

These are the highest-impact items across all domains, ordered by priority.

### 1. Next.js CVE — DoS via React Server Components
- **Domain:** Security
- **Severity:** HIGH
- **Location:** `package.json` — `next: ^16.0.10`
- **Issue:** GHSA-h25m-26qc-wcjf affects `>=16.0.0-beta.0 <16.0.11`. HTTP request deserialization can crash the server. Two additional moderate CVEs also apply.
- **Fix:** `pnpm update next@latest` (target `>=16.1.5`)
- **Effort:** 5 minutes

### 2. Graph Page Bundle Not Code-Split
- **Domain:** Performance
- **Severity:** CRITICAL
- **Location:** `app/graph/page.tsx`
- **Issue:** `GraphClient` imports Sigma + graphology synchronously (~150-180KB). Every route chunk includes this even though <1% of users visit `/graph`.
- **Fix:** Wrap in `dynamic(() => import(...), { ssr: true })`
- **Effort:** 10 minutes
- **Savings:** 150-180KB from route bundle

### 3. Nebula PNGs Unoptimized (5.4MB total)
- **Domain:** Performance
- **Severity:** CRITICAL
- **Location:** `public/assets/nebula_*.png` — 7 files at ~780KB each
- **Issue:** Full-resolution PNGs used as WebGL textures. No WebP/AVIF/KTX2 conversion.
- **Fix:** Convert to WebP (~250KB each) or KTX2 for Three.js
- **Effort:** 1-2 hours
- **Savings:** 2-3MB

### 4. Preview Images Oversized
- **Domain:** Performance
- **Severity:** CRITICAL
- **Location:** `public/assets/chunks/god_gundam_preview.png` (1.9MB), `mansion_front_door_preview.png` (725KB)
- **Fix:** Resize to max 800px width, convert to WebP
- **Effort:** 30 minutes
- **Savings:** 1.2-1.5MB

### 5. Home Page Missing Custom Metadata
- **Domain:** SEO
- **Severity:** CRITICAL
- **Location:** `app/page.tsx`
- **Issue:** No `generateMetadata` or `metadata` export. Falls back to root layout template only — no description, no custom OG data for the most important page.
- **Fix:** Add metadata export with title, description, OG config
- **Effort:** 15 minutes

### 6. No Canonical URLs
- **Domain:** SEO
- **Severity:** CRITICAL
- **Location:** `app/layout.tsx`
- **Issue:** No `alternates.canonical` configured anywhere. Risk of duplicate content issues.
- **Fix:** Add `alternates: { canonical: ... }` to root metadata
- **Effort:** 15 minutes

### 7. No RSS Feed Discovery Links
- **Domain:** SEO
- **Severity:** CRITICAL
- **Location:** `app/layout.tsx`
- **Issue:** Three RSS feeds exist (`/feed.xml`, `/writing/feed.xml`, `/notes/feed.xml`) but no `<link rel="alternate" type="application/rss+xml">` tags in HTML. Feed readers cannot auto-discover feeds.
- **Fix:** Add alternates to root layout metadata
- **Effort:** 10 minutes

### 8. No Security Headers
- **Domain:** Security
- **Severity:** MEDIUM-HIGH
- **Location:** `next.config.ts`
- **Issue:** No CSP, no X-Frame-Options, no HSTS, no Referrer-Policy. Defense-in-depth gap.
- **Fix:** Add `headers()` to next.config.ts
- **Effort:** 20 minutes

### 9. `rehype-raw` XSS Vector
- **Domain:** Security
- **Severity:** HIGH (conditional)
- **Location:** `lib/markdown.ts:25-26`
- **Issue:** `allowDangerousHtml: true` + `rehype-raw` passes raw HTML through to `dangerouslySetInnerHTML`. Safe today (content is author-controlled), but a compromised content source means full XSS.
- **Fix:** Add `rehype-sanitize` after `rehype-raw`
- **Effort:** 15 minutes

### 10. Asset Compression Pipeline Not Connected
- **Domain:** Performance
- **Severity:** CRITICAL
- **Location:** `scripts/compress-assets.ts`
- **Issue:** Script expects source GLBs in `public/assets/source/` — directory is empty. Validation passes with no files. Pipeline exists but isn't being used.
- **Fix:** Move uncompressed GLBs to source dir, wire into prebuild
- **Effort:** 1 hour
- **Savings:** 150-200KB

---

## High Priority (Fix This Week)

### Accessibility — Critical Issues (9 found)

| # | Issue | Location | WCAG |
|---|-------|----------|------|
| A1 | No skip-to-content for 3D Canvas | `FloatingLibrary.tsx`, `InteractiveShell.tsx` | 2.4.1 (A) |
| A2 | SettingsMenu focus not trapped at boundaries | `SettingsMenu.tsx` | 2.4.3 (A) |
| A3 | ContentOverlay focus trap incomplete | `ContentOverlay.tsx` | 2.4.3 (A) |
| A4 | BookDetailPanel missing Escape key handler | `BookDetailPanel.tsx` | 2.1.1 (A) |
| A5 | Quality dropdown missing ARIA roles & Escape | `LibraryHUD.tsx:324-359` | 2.1.1, 4.1.2 (A) |
| A6 | AppearanceCard image alt duplicates heading | `AppearanceCard.tsx:70` | 1.1.1 (A) |
| A7 | MobileNav lacks `aria-expanded` on hamburger | `TopNav.tsx` | 4.1.2 (A) |
| A8 | No `aria-current="page"` on active nav link | `TopNav.tsx:38-49` | 1.3.1 (A) |
| A9 | RatingStars has no accessible label | `BookCard.tsx:109-123` | 1.1.1 (A) |

### SEO — Missing OG Images

Pages missing `opengraph-image.tsx`: `/projects`, `/library`, `/topics/[tag]`, `/graph`, `/media`, `/transmissions`

### SEO — Missing Structured Data

- No BreadcrumbList schema on `/writing/[slug]`, `/topics/[tag]`
- No Organization schema at root
- Book schema missing `image`, `datePublished`, `inLanguage` fields

### Security — Subscribe API Hardening

| Issue | Location | Fix |
|-------|----------|-----|
| No rate limiting | `app/api/subscribe/route.ts` | Add IP-based rate limit (5/min) |
| Email enumeration | `route.ts:66-70` | Return uniform response for new/existing |
| Buttondown error detail forwarded | `route.ts:73-76` | Replace with generic message |
| No email length limit | `route.ts:25-31` | Max 320 chars per RFC 5321 |
| Non-timing-safe secret comparison | `app/preview/writing/[slug]/page.tsx:39` | Use `crypto.timingSafeEqual` |

### Architecture

| Issue | Location | Fix |
|-------|----------|-----|
| Orama DB typed as `any` | `lib/search/orama.ts` | Add proper generic type |
| Missing error boundaries for 3D | `components/interactive/*` | Add try-catch around shader init |
| `getAllBooks()` called twice | `app/library/page.tsx` + `LibraryClient.tsx` | Memoize at module scope or pass as props |

---

## Medium Priority (Fix This Month)

### Accessibility — Serious Issues (12 found)

| # | Issue | Location |
|---|-------|----------|
| A10 | Footer nav regions lack unique `aria-label` | `Footer.tsx:57, 113` |
| A11 | TopNav missing `aria-label` | `TopNav.tsx:26` |
| A12 | Library filter buttons missing `aria-pressed` | `LibraryFilters.tsx:49-63` |
| A13 | Graph filter toggles missing `aria-pressed` | `GraphClient.tsx:88-109` |
| A14 | Command palette loading not in `aria-live` region | `CommandPalette.tsx:75-83` |
| A15 | Mobile TOC toggle missing `aria-expanded` | `TableOfContents.tsx:135-158` |
| A16 | Sort select missing label association | `LibraryFilters.tsx:101-118` |
| A17 | Easter egg toast not announced | `EasterEggs.tsx:40-44` |
| A18 | ContentOverlay doesn't restore focus on close | `ContentOverlay.tsx` |
| A19 | SVG icons missing `aria-hidden` in TopNav | `TopNav.tsx:73-85, 95-107` |
| A20 | Interactive quality buttons missing group context | `InteractiveShell.tsx:211-229` |
| A21 | Duplicate `aria-live` regions in LoadingSequence | `LoadingSequence.tsx:137, 145` |

### Performance

| Issue | Fix | Savings |
|-------|-----|---------|
| Framer Motion loaded on home for hover effect only | Replace HolographicTile with CSS animations | 8-10KB |
| Graph data computed per request | Add `export const revalidate = 3600` or precompute at build | ~50-100ms/request |
| No prefetch hints for heavy routes | Add `prefetch={true}` on nav links to `/interactive`, `/library`, `/graph` | Perceived perf |
| StarfieldBackground no progressive degradation | Add LOD system, skip effects on low-end | Mobile perf |

### SEO

| Issue | Fix |
|-------|-----|
| Topic `lastModified` uses current date | Use latest signal date instead |
| No `robots.txt` file | Create explicit file in `public/` |
| Book schema incomplete | Add `image`, `datePublished`, `inLanguage` |

### Code Quality

| Issue | Fix |
|-------|-----|
| ~50% test coverage | Add Zustand store tests, error boundary tests, snapshot tests |
| No tests for `useSearch` hook | Add unit tests with mock Orama |
| ESLint config minimal | Add no-console-in-prod, no-any rules |
| Build script ordering undocumented | Document prebuild dependencies |
| `execSync` string concatenation in compress script | Switch to `execFileSync` array form |

---

## Low Priority (Backlog)

### Accessibility — Moderate Issues (12 found)

- CodeBlock copy button invisible on keyboard focus (needs `focus-visible:opacity-100`)
- NoteCard anchor link invisible to keyboard users
- TransmissionCard animations ignore `prefers-reduced-motion`
- Footer "Online" dot needs `aria-hidden`
- BookCard rating only visible on hover
- MediaFilter button group missing `role="group"`
- Callout emoji should have `aria-hidden`
- FloatingLibrary canvas missing visible focus indicator
- ProjectCard labels use `<p>` instead of `<dt>`/`<dd>`
- `tabIndex={-1}` on main causes outline flash
- Multiple Lucide icons missing `aria-hidden`
- `card-interactive` class needs `focus-visible` styles

### Accessibility — Minor Issues (10 found)

- `kbd` elements may not announce distinctly in all screen readers
- Some touch targets may be <24x24px
- `text-text-3` color contrast should be verified
- External links should indicate new window
- Command palette footer hints use 10px font
- LibraryBreadcrumb may have duplicate `aria-current`

### Architecture

- Lazy-load CommandPaletteProvider behind Suspense
- Consolidate book schema generation into single `<script>`
- Store initialization patterns inconsistent between stores
- Add Zod validation in `loadFromStorage()` for corrupted state

---

## Content & UX Gaps

These aren't code bugs but they significantly impact the site's effectiveness.

### Content Sparsity (CRITICAL)

| Content Type | Count | Assessment |
|-------------|-------|------------|
| Essays | 6 (2 are stubs) | 4 real essays. Need 15+ for the knowledge system to work |
| Notes | 3 | System underutilized. Should be weekly dispatches |
| Projects | 1 | "The Control Room" only. Need 3-5 |
| Books | 50+ | Strongest section by far |
| Media | 8 | Good credibility signal |
| Transmissions | 8 | Good external validation |

### Stale Content

- **Now page:** Last updated 2024-01-15 (over 1 year stale)
- **Essay stubs:** `peer-reviewed-paper-prospera-governance.mdx` and `the-voluntaryist-constitution.mdx` are frontmatter only

### Missing Features

| Feature | Impact | Notes |
|---------|--------|-------|
| Resume/CV | High | Not visible on main paths |
| Contact info | High | Only newsletter — no email/contact form |
| Light mode | Medium | Deliberate dark-only, but limits accessibility |
| /interactive not discoverable | Medium | 3D world not linked from anywhere |
| Newsletter archives | Low | No link to past issues |
| Mobile 3D fallback/warning | Medium | Will break on older devices |

---

## What's Working Well

These patterns should be preserved and built upon:

1. **Bundle Isolation** — Three.js perfectly isolated to `/interactive` route, verified by build script
2. **Zustand State Management** — Well-designed stores with selectors, persistence, and `subscribeWithSelector`
3. **Content Collections** — Zod-validated, statically generated, computed fields (reading time, word count)
4. **Build Validation** — Asset budgets and bundle isolation verified at build time
5. **Error Handling** — Dedicated error module with custom classes, recovery strategies, and memory monitoring
6. **Accessibility Foundations** — Skip link, `prefers-reduced-motion` support, `AccessibleBookList` fallback for 3D, semantic HTML throughout
7. **Design System** — Cohesive color tokens, thoughtful typography pairing (Satoshi/Newsreader/Monaspace), premium motion design
8. **Command Palette** — Radix-based, Orama-powered search across all content types
9. **Wikilinks** — Bidirectional linking system with type priority, backlinks display, and circular reference handling
10. **No External Scripts** — Zero third-party JS. No analytics soup, no tracking pixels

---

## Recommended Action Plan

### Phase 1: Security & Critical Fixes (1 day)

1. Update Next.js to `>=16.1.5` (patches 3 CVEs)
2. Add security headers to `next.config.ts`
3. Add `rehype-sanitize` to markdown pipeline
4. Harden subscribe API (rate limit, uniform responses, email length)
5. Use `crypto.timingSafeEqual` for preview secret
6. Add home page metadata
7. Add canonical URLs and RSS discovery links
8. Dynamic import GraphClient

### Phase 2: Performance (2-3 days)

1. Optimize nebula PNGs (convert to WebP or KTX2)
2. Optimize preview images (resize + WebP)
3. Connect asset compression pipeline
4. Replace Framer Motion hover with CSS on home
5. Precompute graph data at build time

### Phase 3: Accessibility (3-4 days)

1. Fix 9 critical a11y issues (focus trapping, ARIA roles, keyboard handlers)
2. Fix 12 serious a11y issues (labels, states, announcements)
3. Add `focus-visible` styles across components
4. Verify color contrast for all `text-text-*` tokens

### Phase 4: SEO Completeness (1-2 days)

1. Add OG images for `/projects`, `/library`, `/topics/[tag]`
2. Add BreadcrumbList and Organization schemas
3. Create `robots.txt`
4. Improve Book schema completeness

### Phase 5: Content (Ongoing)

1. Complete or remove essay stubs
2. Update Now page
3. Write 3-5 new essays
4. Add resume/CV page
5. Add contact information
6. Link /interactive from navigation
7. Establish publishing cadence (1-2 essays/month)

---

## Appendix: Positive Accessibility Findings

The following practices are well-implemented and should be maintained:

- Skip link with proper focus styling (`app/layout.tsx:55-60`)
- Language declaration (`<html lang="en">`)
- `useReducedMotion` hook used throughout (MobileNav, LoadingSequence, ContentOverlay, SettingsMenu, FloatingBook)
- `AccessibleBookList` — sr-only alternative to 3D library
- CommandDialog wraps Radix Dialog with sr-only title
- ContentOverlay correctly traps focus with Tab cycling
- BookDetailPanel saves and restores focus on close
- SubscribeForm has `aria-label`, `role="alert"`, proper disabled states
- MediaFilter correctly uses `aria-pressed`
- SettingsMenu toggle uses `role="switch"` with `aria-checked`
- Semantic HTML throughout (`<article>`, `<aside>`, `<nav>`, `<main>`, `<time>`, `<dl>`)
