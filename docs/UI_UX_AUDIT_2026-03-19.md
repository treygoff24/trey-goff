# Site QA Audit

Date: 2026-03-19
Method: Playwright interactive audit against local `pnpm dev`
Scope: 40 crawled routes, representative desktop and mobile screenshots, spot checks for search, mobile nav, library, graph, and media

## Anti-Patterns Verdict

Pass. The site feels intentional and custom rather than AI-generic. The visual language is consistent across the editorial pages and the interactive surfaces, and the responsive navigation/search patterns are coherent.

## Executive Summary

- Total issues: 3
- High: 1
- Medium: 1
- Low: 1
- Most important issue: the `Media` page is shipping blank artwork tiles because remote thumbnails are blocked by CSP.
- Overall quality: strong visual design and route coverage, with one obvious content regression and one semantic/accessibility gap on the library experience.

## Coverage

- Crawled routes included `/`, `/writing`, `/notes`, `/library`, `/media`, `/topics`, `/projects`, `/about`, `/now`, `/colophon`, `/graph`, `/powerlifting`, `/transmissions`, multiple `/writing/[slug]` pages, filtered writing views, and topic pages.
- Representative mobile screenshots were captured for `/`, `/writing`, `/media`, `/library`, and `/graph`.
- Interaction checks covered:
  - command palette open/close
  - mobile drawer open state
  - conditional hiding of `Subscribe` when the newsletter flag is off
- Direct visits to `/subscribe` and `/interactive` returned branded `404` pages, but those routes are currently feature-flagged and are not exposed in the live nav/search state in this environment. They are noted here, not counted as bugs.

## Findings

### High

#### 1. `Media` cards render as empty gray boxes because thumbnail requests are blocked by CSP

- Location: [app/media/page.tsx](/Users/treygoff/Code/trey-goff/app/media/page.tsx), [components/media/AppearanceCard.tsx](/Users/treygoff/Code/trey-goff/components/media/AppearanceCard.tsx), [lib/media/index.ts](/Users/treygoff/Code/trey-goff/lib/media/index.ts), [lib/security/csp.ts](/Users/treygoff/Code/trey-goff/lib/security/csp.ts), [proxy.ts](/Users/treygoff/Code/trey-goff/proxy.ts)
- Severity: High
- Category: Visual QA / Content integrity / Security config
- Evidence:
  - On both desktop and mobile, the thumbnail areas render as blank placeholders.
  - Browser console reports CSP violations for `https://img.youtube.com/...` and multiple `https://is1-ssl.mzstatic.com/...` assets.
- Impact:
  - The page loses most of its visual hierarchy and scannability.
  - Users cannot quickly identify shows/episodes from artwork, which makes the page feel broken.
- Recommendation:
  - Prefer serving pre-resolved artwork from local/static assets if that is the intended architecture.
  - If remote artwork is expected at runtime, update `img-src` to explicitly allow the required hosts.
  - Consider keeping a real visual fallback when a remote image fails, rather than leaving an empty box.

### Medium

#### 2. The primary `Library` experience has no page-level heading in the rendered DOM

- Location: [app/library/page.tsx](/Users/treygoff/Code/trey-goff/app/library/page.tsx), [components/library/FloatingLibraryWrapper.tsx](/Users/treygoff/Code/trey-goff/components/library/FloatingLibraryWrapper.tsx)
- Severity: Medium
- Category: Accessibility / Semantic structure
- Evidence:
  - The audited WebGL path rendered with `0` visible `h1` elements.
  - The fallback path does define a proper `Library` heading, but the primary interactive path does not.
- Impact:
  - Screen reader and keyboard users lose the normal page landmark/orientation cue they get everywhere else on the site.
  - The route is visually rich, but semantically sparse compared with the rest of the app.
- Recommendation:
  - Add a real page-level heading and short description to the default interactive route.
  - If a visible heading compromises the intended composition, use a visually-hidden heading inside the main content and keep the current visual overlay separate.

### Low

#### 3. WebGL-heavy routes emit console warnings during normal load

- Location: `/` and `/library` during the Playwright pass
- Severity: Low
- Category: Performance / Maintenance
- Evidence:
  - `THREE.THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.`
  - Home also emitted repeated GPU stall warnings tied to `ReadPixels` during load.
- Impact:
  - This is not a blocking user-visible failure today, but it is a sign that the interactive surfaces deserve a follow-up profiling pass.
  - Console noise makes it harder to notice new regressions.
- Recommendation:
  - Trace the deprecation to the responsible 3D dependency or scene helper and update it.
  - Profile the home starfield path to confirm whether the `ReadPixels` warnings are only a tooling artifact or a real runtime cost worth reducing.

## Patterns And Systemic Notes

- The site is generally stable across desktop/mobile route coverage: no horizontal overflow showed up in the crawl.
- Feature flags are applied consistently in nav/search, which prevented the gated `Subscribe` and `Interactive` routes from leaking into obvious user flows.
- The most important systemic risk is around rich media and 3D surfaces:
  - remote-media policy on `Media`
  - semantic fallbacks for the `Library`
  - console/perf hygiene on WebGL routes

## Positive Findings

- The overall visual direction is distinctive and cohesive.
- The mobile nav drawer has solid fundamentals:
  - focus is restored on close
  - `Escape` closes the drawer
  - tab trapping is implemented
  - `Subscribe` is correctly omitted when the newsletter flag is off
- The command palette opens reliably and did not surface a broken `Subscribe` entry in the current environment.
- The `Graph` page holds together well on mobile despite the density of controls.

## Priority Recommendations

1. Immediate
   Fix the `Media` thumbnail regression so the page regains its visual hierarchy.

2. Short-term
   Add semantic heading/intro structure to the primary `Library` experience.

3. Medium-term
   Do a focused performance/console cleanup pass on the WebGL routes.

## Notes

- Full-page screenshots of the home page show some reveal-animated sections in their pre-scroll hidden state. I did not count that as a bug because the content appears once those sections enter the viewport, but it is worth remembering when using static screenshot automation as a QA source.
