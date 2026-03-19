# The Stack — Build Plan

## Phase 1: Color Extraction
- [ ] Create `scripts/extract-book-colors.ts` build script
- [ ] Generate `public/book-colors.json`

## Phase 2: Core Components (parallel)
- [ ] `lib/library/colors.ts` + `lib/library/sorting.ts` — utility modules
- [ ] `components/library/StackLibrary.tsx` — main client component + `app/library/page.tsx` update
- [ ] `components/library/BookStripe.tsx` — individual stripe with hover expand
- [ ] `components/library/StackDetailPanel.tsx` — right panel with stats + book detail
- [ ] `components/library/StackSortControls.tsx` — sort pill buttons
- [ ] `components/library/StackMobileBarcode.tsx` + `components/library/StackBottomSheet.tsx` — mobile

## Phase 3: Integration & Verification
- [ ] Integration: wire all components, verify typecheck/lint/test pass
- [ ] Commit all changes
