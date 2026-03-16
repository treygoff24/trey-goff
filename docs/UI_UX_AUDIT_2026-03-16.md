# UI/UX Audit

**Date:** 2026-03-16
**Auditor:** Codex with Playwright interactive inspection
**Environment:** Local Next.js app at `http://localhost:3001` using `next dev --webpack`
**Scope:** Desktop and mobile audit of the current public website shell and major routes: `/`, `/writing`, `/projects`, `/library`, `/graph`, `/about`, `/now`, `/notes`, `/media`, `/topics`

## Audit setup

- Primary inspection method: manual browser pass in Playwright on desktop `1600x900` and mobile `390x844`
- Functional checks: global nav, command palette, mobile drawer, route rendering, graph controls, library filters, keyboard traversal
- Visual checks: first-view clarity, hierarchy, density, spacing, touch affordances, responsiveness, and interaction discoverability
- Out of scope for product-quality judgment:
  - `/interactive` is feature-flagged off and currently resolves to the custom 404 page
  - `/subscribe` is feature-flagged off and currently resolves to the custom 404 page
- Important dev note:
  - The initial audit used webpack dev mode because Turbopack was inferring the wrong workspace root from a parent-level lockfile. That has since been fixed in `next.config.ts` by anchoring `turbopack.root` to the project directory.

## Anti-patterns verdict

**Verdict:** Pass, with a few warning signs.

This does **not** read as generic AI slop. The site has a clear point of view: restrained sci-fi, editorial typography, strong atmosphere, and a coherent command-palette-first mental model. The visual language feels intentional.

The main risk is not genericity. It is **over-indexing on ambiance at the expense of orientation**, especially on mobile and in the immersive routes. A few pages ask the user to infer too much from a sparse or visually dense first view.

## Executive summary

- **Total issues:** 7
- **Severity mix:** 0 critical, 3 high, 4 medium
- **Overall UI/UX score:** 7.6/10
- **Primary strengths:** strong brand identity, cohesive visual system, good desktop polish, thoughtful search/navigation concept
- **Primary weaknesses:** mobile ergonomics, modal accessibility, orientation inside immersive routes, and information density on the graph/library experiences

### Top priorities

1. Fix the mobile navigation drawer so keyboard focus is trapped inside the open dialog.
2. Add a visible heading/orientation layer to the floating library experience.
3. Create a simplified mobile mode for the knowledge graph instead of shrinking the full desktop visualization.
4. Increase touch target sizes for key mobile and graph controls.

## Detailed findings by severity

### High-severity issues

#### 1. Mobile navigation drawer does not trap keyboard focus

- **Location:** `components/layout/MobileNav.tsx:20-33`, `components/layout/MobileNav.tsx:64-149`
- **Severity:** High
- **Category:** Accessibility
- **Description:** The mobile menu is presented as a modal dialog, but keyboard focus can tab out of the drawer and continue into background page content while the overlay is still open. In Playwright, after tabbing through the menu links, focus moved to homepage CTAs and cards behind the overlay.
- **Impact:** Keyboard and assistive-tech users can lose context, interact with obscured content, and experience a broken modal flow.
- **WCAG/Standard:** WCAG 2.4.3 Focus Order, WCAG 2.1.1 Keyboard, dialog focus-management best practice
- **Recommendation:** Add focus trapping, restore focus to the trigger on close, and mark non-dialog content inert while the drawer is open.
- **Suggested command:** `/harden`

#### 2. The library route opens with almost no visible orientation or page-level context

- **Location:** `app/library/page.tsx:35-38`, `components/library/floating/FloatingLibrary.tsx:145-210`, `components/library/floating/AccessibleBookList.tsx:67-77`
- **Severity:** High
- **Category:** Accessibility / UX
- **Description:** `/library` drops the user directly into a full-viewport 3D scene with floating controls, but there is no visible `h1`, no short explainer, and no first-view framing for what the page is or how to use it. The only heading-like content lives in the hidden accessible list.
- **Impact:** First-time users must infer the purpose of the page from the visualization alone. This hurts orientation, learnability, and screen-reader semantics.
- **WCAG/Standard:** WCAG 1.3.1 Info and Relationships, WCAG 2.4.6 Headings and Labels
- **Recommendation:** Add a visible heading and one-sentence onboarding layer in the first viewport, then let it collapse once the user starts exploring.
- **Suggested command:** `/onboard`

#### 3. The knowledge graph is not meaningfully adapted for mobile

- **Location:** `components/graph/GraphClient.tsx:77-121`, `components/graph/GraphCanvas.tsx:119-129`, `components/graph/GraphCanvas.tsx:221-281`
- **Severity:** High
- **Category:** Responsive / UX
- **Description:** On a `390px` viewport, the graph still renders a `356x598` interactive canvas containing 513 nodes and 999 connections. Labels and edges become a dense mass, and the experience depends on precision interactions that are hard on touch devices.
- **Impact:** The route technically works on mobile, but the main artifact is difficult to read, difficult to manipulate, and low in information yield relative to effort.
- **WCAG/Standard:** WCAG 1.4.10 Reflow, responsive usability best practice
- **Recommendation:** Add a mobile-specific mode: fewer labels, a filtered summary view, larger controls, and a clear default detail panel or list-first entry point.
- **Suggested command:** `/adapt`

### Medium-severity issues

#### 4. Several high-frequency controls miss modern touch target guidance

- **Location:** `components/layout/TopNav.tsx:72-99`, `components/graph/GraphClient.tsx:82-105`, `components/graph/GraphCanvas.tsx:239-273`
- **Severity:** Medium
- **Category:** Accessibility / Responsive
- **Description:** The mobile search and menu buttons render at `40x40`. Graph filter chips are `32px` tall. Graph zoom controls render at `36x36`. These all fall short of the `44x44` target size guidance for touch.
- **Impact:** Tapping precision is harder than it needs to be, especially for users with motor impairments or when operating one-handed on mobile.
- **WCAG/Standard:** WCAG 2.5.8 Target Size (Minimum)
- **Recommendation:** Bring primary controls to at least `44x44`, increase vertical padding on graph chips, and space stacked buttons a little more generously.
- **Suggested command:** `/adapt`

#### 5. The home page hero stack is visually strong but too tall on mobile

- **Location:** `components/home/HeroSection.tsx:9-56`, `components/home/CommandHero.tsx:20-86`
- **Severity:** Medium
- **Category:** Responsive / UX
- **Description:** On mobile, the opening hero section consumes roughly 1.4 viewport-heights before the user reaches the next navigational content. The combination of oversized atmospheric card treatment, generous spacing, and a second large command block pushes the “start anywhere” structure far below the fold.
- **Impact:** The page makes a strong first impression, but the information scent for where to go next arrives late. New visitors have to scroll a long way before the site’s structure becomes clear.
- **WCAG/Standard:** Responsive hierarchy best practice
- **Recommendation:** Compress vertical spacing on small screens, tighten the hero container, and reduce the visual mass of the command search block below `sm`.
- **Suggested command:** `/adapt`

#### 6. Library HUD controls float over the scene without enough contextual framing

- **Location:** `components/library/floating/LibraryHUD.tsx:257-360`
- **Severity:** Medium
- **Category:** UX / Responsive
- **Description:** The search, filters, sort, and quality controls are fixed in the upper-left corner of the 3D scene. On desktop this is acceptable; on mobile it feels crowded and competes directly with the visualization.
- **Impact:** Users are asked to parse several floating controls before they understand the scene itself. The page feels more like an internal tool overlay than a guided public-facing experience.
- **WCAG/Standard:** UX clarity best practice
- **Recommendation:** Group controls behind a clearer “Filter library” affordance on small screens, or progressive-disclose advanced controls like quality settings.
- **Suggested command:** `/distill`

#### 7. Projects page feels under-explained because the strong headline resolves to a single card

- **Location:** `app/projects/page.tsx:20-53`
- **Severity:** Medium
- **Category:** UX / Content
- **Description:** The page promises “Projects that move from idea to deployment,” but currently resolves to one project card and a large amount of empty space. The page design suggests a richer case-study index than the user actually gets.
- **Impact:** Users can come away feeling the page is unfinished, even if the single project itself is strong. This weakens trust in the navigation label and reduces onward exploration.
- **WCAG/Standard:** Information scent / content strategy best practice
- **Recommendation:** Either tighten the page into a “featured case study” format or add scaffolding that makes the current depth feel intentional.
- **Suggested command:** `/clarify`

## Patterns and systemic issues

- **Immersive routes are stronger aesthetically than they are in orientation.** The library and graph experiences look distinctive, but both need a better “what am I looking at and what should I do next?” layer.
- **Mobile adaptation is the main quality gap.** The desktop experience is consistently more confident than the mobile one.
- **Accessibility foundations exist, but modal/interaction details need another pass.** Skip links, `aria-current`, and screen-reader fallbacks are present, which is good. The issues are now at the interaction-detail layer rather than the fundamentals-only layer.

## Positive findings

- The site has a clear and memorable visual identity. The dark editorial sci-fi language feels authored, not generic.
- Desktop typography and spacing are strong across the content-first pages, especially `/writing` and `/about`.
- The command palette is a meaningful navigation concept, not decorative chrome. It improves findability and fits the site’s mental model.
- Desktop focus states are visible and reasonably consistent in the primary navigation.
- The floating library includes a thoughtful accessible-list fallback rather than treating the 3D experience as the only interface.
- The custom 404 page is polished and on-brand without becoming noisy.

## Recommendations by priority

### Immediate

1. Trap focus within the mobile drawer and restore focus correctly on close.
2. Add visible page-level orientation to the library route.
3. Increase touch target sizes for nav and graph controls.

### Short-term

1. Create a simplified mobile knowledge-graph mode.
2. Reduce home-page hero height and command-block mass on small screens.
3. Rework the library HUD into a more progressive mobile control pattern.

### Medium-term

1. Reframe the projects page so its content depth matches the promise of the headline.

## Suggested commands for follow-up

- Use `/harden` to fix dialog behavior and focus handling.
- Use `/adapt` to improve mobile layout, touch targets, and route-specific responsive behavior.
- Use `/onboard` to add better orientation and first-use guidance to the library route.
- Use `/distill` to reduce control clutter in the floating library HUD.
- Use `/clarify` to tighten the framing and expectations on the projects page.

## Notes and evidence

- Mobile drawer keyboard test: focus escaped from the open menu to homepage CTAs and cards behind the overlay.
- Mobile measurements observed in Playwright:
  - top-nav search button: `40x40`
  - top-nav menu button: `40x40`
  - graph zoom controls: `36x36`
  - graph filter chips: `32px` tall
- Route-level semantic check:
  - `/library` rendered with no visible `h1`
- Visual captures were taken for desktop and mobile variants of the audited routes during this session.
