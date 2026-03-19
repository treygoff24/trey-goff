# THE STACK — Build Spec

## Overview
Replace the existing 3D WebGL library page with "The Stack" — a design where every book is a thin colored horizontal stripe (dominant color extracted from its cover), stacked vertically like a physical pile of 334 books. The hero interaction: change sort order and watch all 334 items simultaneously animate to new positions via Framer Motion layout animations.

## The Core Experience

### What the user sees on page load
A full-viewport page. Left 40%: a tall colored column of 334 thin horizontal stripes — each stripe is one book, colored by its dominant cover color. It looks like a Gerhard Richter color-field painting. Right 60%: a detail/stats panel.

Sort control pills float above the stack: "Reading Order · Topic · Author · Year · Genre"

At the very top: "334 books" in Newsreader italic, understated.

### The Hero Moment — Sort Animation
When the user clicks a different sort mode, ALL 334 books simultaneously animate to their new positions using Framer Motion `layout` + `layoutId`. This is THE showstopper. 334 colored stripes reshuffling in real-time like a deck of cards being machine-sorted. This MUST be smooth (60fps). Use `layoutId` per book keyed to `book.id`.

### Stack Interaction
- Each stripe is 4-6px tall by default (enough to see color, show all 334 in a scrollable container)
- On hover, the hovered stripe expands to ~40px, showing the book title in small IBM Plex Mono text
- Adjacent stripes compress slightly to make room (spring physics)
- Running your cursor up and down the stack creates a flowing, living interaction

### Detail Panel (right 60%)
- **Default state (nothing hovered):** Shows aggregate stats — total books, top 10 topics as a minimal horizontal bar chart, a reading-by-year dot timeline
- **On hover/select:** Shows the book cover at generous size (200px+), title in Newsreader serif, author in Geologica, topic pills styled with the site's accent colors, and year in IBM Plex Mono
- Cover images crossfade between books with a subtle scale transition

### Mobile Layout
The stack rotates horizontal — a wide, horizontally-scrollable strip of thin VERTICAL stripes (each book is a thin vertical colored line). It becomes a "color barcode" of your reading life. Tapping any stripe opens a bottom sheet with book details (cover, title, author, topics). Sort pills become a horizontal scroll above the barcode.

## Technical Requirements

### Pre-computation: Dominant Color Extraction
Create a build script at `scripts/extract-book-colors.ts` that:
1. Reads each cover JPG from `public/covers/[slug].jpg`
2. Extracts the dominant color (use canvas sampling — load image, draw to small canvas, average the center pixels, or use a simple k-means with k=1)
3. Writes output to `public/book-colors.json` as `{ [bookId]: "#hexcolor" }`
4. Run this as part of `pnpm prebuild`

### File Structure
```
app/library/page.tsx          — Server component, loads book data + colors
components/library/
  StackLibrary.tsx             — Main client component
  BookStripe.tsx               — Individual stripe (motion.div with layoutId)
  StackDetailPanel.tsx         — Right panel with stats/book detail
  StackSortControls.tsx        — Sort pill buttons
  StackMobileBarcode.tsx       — Mobile horizontal barcode view
  StackBottomSheet.tsx         — Mobile book detail bottom sheet
lib/library/
  colors.ts                    — Load book-colors.json, fallback color logic
  sorting.ts                   — Sort functions (reading-order, topic, author, year, genre)
```

### Design Tokens (use these exactly)
```
Background: bg-0 (#05060a)
Surface: surface-1, surface-2
Text: text-1 (95% white), text-2 (74%), text-3 (55%)
Warm accent: #f5a25a (active sort pill, hover glow)
Cool accent: #3ed6c8 (topic pills)
Fonts: font-satoshi (Geologica) for UI, font-newsreader for titles, font-mono for data
```

### Animation Specs
- Sort transition: Framer Motion `layout` prop on each stripe, `transition={{ type: "spring", stiffness: 300, damping: 30 }}`
- Stripe hover expand: `animate={{ height }}` with spring physics
- Detail panel crossfade: `AnimatePresence` with `mode="wait"`, 200ms duration
- Initial load: stripes cascade from bottom, 5ms stagger per item (334 × 5ms = 1.67s)
- Mobile barcode: horizontal scroll with `scroll-snap-type: x proximity`

### Performance Critical
- 334 simultaneous layout animations MUST be smooth. Tips:
  - Each BookStripe should be a simple div with NO complex children during animation
  - Use `will-change: transform` on stripes
  - Avoid re-renders during animation — sort state should update once, not per-frame
  - Consider using `motion.div` with `layout="position"` instead of full layout if perf issues
  - Test on throttled CPU (Chrome DevTools 4x slowdown)

### Data
- Books: `content/library/books.json` (334 books with id, title, author, year, status, topics, genre)
- Covers: `public/covers/[slug].jpg` (327 real JPGs)
- Cover map: `public/cover-map.json` (maps book id → cover path)
- Colors: `public/book-colors.json` (will be generated by build script)

### Existing Site Integration
- The page must use the existing layout (TopNav, Footer via app/layout.tsx)
- Use existing font variables (--font-satoshi-font, --font-newsreader-font, --font-mono-font)
- Use existing Tailwind theme tokens from globals.css
- Keep the existing `app/library/layout.tsx` and `app/library/opengraph-image.tsx`
- The existing floating library components under `components/library/floating/` should NOT be deleted yet — just don't import them

### Quality Bar
- Must pass `pnpm typecheck` and `pnpm lint`
- Must pass `pnpm test` (existing tests)
- Must work on desktop (1440px+) and mobile (375px)
- No new heavy dependencies — only Framer Motion (already installed) for animation
- Sort animation must be 60fps on M1 MacBook (test with 4x CPU throttle)
- Book covers must be lazy-loaded with intersection observer
- Accessible: keyboard navigation through stripes, screen reader labels

### Dev Server
```bash
cd ~/Development/trey-goff-stack
pnpm install
pnpm dev
# Visit http://localhost:3000/library
```

Port: run `pnpm dev` and use whatever port Next.js assigns (likely 3000, or 3001+ if occupied).

## What "Done" Looks Like
1. Visit /library → see the full stack of 334 colored stripes
2. Click sort pills → watch 334 items animate to new positions smoothly
3. Hover stripes → see them expand with title, detail panel updates
4. Resize to mobile → see horizontal color barcode with bottom sheet
5. `pnpm typecheck && pnpm lint && pnpm test` all pass
