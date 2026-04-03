# THE STACK — Build Spec (authoritative)

## Overview

The `/library` route is **“The Stack”**: books appear as thin **horizontal spine stripes** (dominant color from each cover, from `public/book-colors.json`). Stripes are grouped into **multiple vertical stacks** (columns)—primarily by **topic family**—on a wide **sideways-scrollable shelf**. A **detail panel** on desktop shows aggregate stats when nothing is focused, and **hover / click-to-pin** book detail when a spine is active. **Framer Motion** `layout` + shared **`layoutId` per `book.id`** animates stripes when **sort mode** changes so books move cleanly between stacks.

## Layout & sort modes

- **Desktop (md+):** Shelf region (scroll X/Y within a capped viewport) + **sticky** detail panel (`~380–430px` wide).
- **Mobile:** Same stripe metaphor inside a **compact** column width; horizontal scroll through **stack columns**; **sort pills** in a horizontal chip row; **tap a spine** → **bottom sheet** with cover and metadata.
- **Sort modes** (`SORT_MODES`): **Topic** (topic families), **Year** (decade buckets), **Author** (initial-range bins), **Genre**. There is no separate “reading order” mode in the shipped UI.

## Topic families

Books are bucketed using **`lib/library/topics.ts`**: each book’s **primary topic** (`topics[0]`) maps to a **`TopicFamily`** (label, color, member topic tags). Unmatched books land in **Miscellaneous**.

## Hero & copy

- **Title:** Visible **`<h1>`** with the page title (**Library**).
- **Counts:** **Total book count** and **current stack count** (`groups.length` after grouping) are shown and update with sort mode.
- **Description:** Server-provided short description (same theme as metadata) plus a single UX line about scrolling and pinning in the detail panel.

## Components (implemented)

```
app/library/page.tsx          — Server component: load books, book colors, cover map; JSON-LD; pass props
components/library/
  StackLibrary.tsx            — Shelf + mobile/desktop chrome, grouping, sort state
  BookStripe.tsx              — motion.button stripe; layoutId; hover/selected; reduced-motion aware
  StackDetailPanel.tsx        — Stats default; book detail on hover / pinned selection
  StackSortControls.tsx       — Sort pills (desktop chrome)
  StackBottomSheet.tsx        — Radix Dialog–based sheet (focus trap, Esc, overlay)
lib/library/
  colors.ts                   — BookColorMap, getBookColor()
  sorting.ts                  — SortMode + SORT_MODES
  topics.ts                   — families, groupBooksByFamily, decade/author/genre helpers
scripts/extract-book-colors.ts — Generates public/book-colors.json from cover JPGs
```

Mobile does **not** use a separate “barcode-only” component; stacks use the same **`BookStripe`** in **`compact`** mode.

## Build pipeline

1. **`pnpm prebuild`** runs **`tsx scripts/extract-book-colors.ts`** after cover resolution so **`public/book-colors.json`** stays aligned with **`public/cover-map.json`** and JPGs.
2. `app/library/page.tsx` imports **`public/book-colors.json`** statically, the same way it imports `cover-map.json`, so the route stays prerenderable while each stripe still gets a generated dominant color with a fallback hex per book.

## Animation & performance

- Stripes use **`layout="position"`** and **`layoutId={book.id}`** inside **`LayoutGroup`** scopes (`stack-library-desktop`, `stack-library-mobile`).
- **Hover / selection:** Spring motion on translate/scale; **`prefers-reduced-motion: reduce`** short-circuits aggressive springs on **`BookStripe`**.
- **Detail panel:** `AnimatePresence` + short fade/slide between books.

## Accessibility

- Spine buttons: **keyboard focusable**, **`aria-label`** = title.
- Bottom sheet: **`DialogPrimitive`** (modal focus management, **Esc**, **overlay** close); **Title/Description** primitives for SR; cover image **`alt=""`** when title is read by dialog naming.
- Library route exposes a real **document `<h1>`**.

## Data sources

- Books: `content/library/books.json`
- Covers / map: `public/covers/*.jpg`, `public/cover-map.json`
- Colors: `public/book-colors.json` (generated)

## Quality bar

- Pass **`pnpm ci:quality`** (fmt, lint, typecheck, test, build).
- Visual check desktop + mobile after meaningful UI changes.
