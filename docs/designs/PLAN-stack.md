# The Stack — Build Plan

## Phase 1: Color extraction _(done)_

- [x] `scripts/extract-book-colors.ts`
- [x] `public/book-colors.json` + **`pnpm prebuild`** wiring

## Phase 2: Core components _(done)_

- [x] `lib/library/colors.ts`, `lib/library/sorting.ts`, `lib/library/topics.ts`
- [x] `components/library/StackLibrary.tsx` + `app/library/page.tsx`
- [x] `BookStripe.tsx`, `StackDetailPanel.tsx`, `StackSortControls.tsx`
- [x] `StackBottomSheet.tsx` (modal sheet)
- [x] Mobile: compact stripes inside stack columns (no separate barcode-only component)

## Phase 3: Integration & verification _(ongoing)_

- [x] Typecheck / lint / tests / build
- [x] Spec aligned with shipped UI (`SPEC-stack.md`)
