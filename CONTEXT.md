# The Control Room - Build Context

**Last Updated**: Phase 1 - Foundation + Design System (IN PROGRESS)

## Protocol Reminder (Re-read on every phase start)

**The Loop**: IMPLEMENT → TYPECHECK → LINT → BUILD → TEST → REVIEW → FIX → REPEAT → COMMIT

**Skills to invoke:**
- `writing-plans` — if a sub-task needs breakdown
- `test-driven-development` — for new features/logic
- `systematic-debugging` — when tests fail unexpectedly
- `requesting-code-review` — before finalizing changes
- `verification-before-completion` — before declaring done
- `webapp-testing` — for UI verification with Playwright

**Before UI work**: Read frontend-design skill
**Before review**: All must pass: `pnpm typecheck && pnpm lint && pnpm build`
**After all phases**: Run accessibility audit before declaring done

**If context feels stale**: Re-read `docs/planning/AUTONOMOUS_BUILD_GREENFIELD.md` and this file

## What This Is

Personal website for Trey Goff. Dark mode only. Command palette-first navigation.

## Tech Stack

- Framework: Next.js 15 (App Router) + TypeScript
- Styling: Tailwind CSS v4 with CSS-first tokens
- Content: Content Collections + MDX
- Search: Orama (lazy-loaded)
- UI: shadcn/ui (Radix-based) + cmdk
- Animation: Motion for React (primary) + GSAP ScrollTrigger (complex scroll)
- Graph: Sigma.js + Graphology (Phase 6)
- Deploy: Vercel

## Design Tokens

- Background: #070A0F (void), #0B1020 (primary)
- Surface: rgba(255,255,255,0.06), rgba(255,255,255,0.10)
- Text: rgba(255,255,255,0.92/0.72/0.52)
- Warm accent: #FFB86B
- Electric accent: #7C5CFF
- Fonts: Satoshi (UI), Newsreader (prose), Monaspace Neon (mono)

## Build Commands

```bash
pnpm dev        # Start dev server
pnpm build      # Production build
pnpm lint       # ESLint
pnpm typecheck  # TypeScript check
```

## Performance Targets

- Lighthouse Mobile: 90+
- LCP: < 2.5s
- CLS: < 0.1
- INP: < 200ms
- First Load JS: < 100KB

## Current Phase

Phase 1: Foundation + Design System

## Implementation Progress

- [ ] Phase 1: Foundation + Design System
- [ ] Phase 2: Content Pipeline + Writing
- [ ] Phase 3: Command Palette + Search
- [ ] Phase 4: Library
- [ ] Phase 5: Newsletter + Polish
- [ ] Phase 6: Knowledge Graph (stretch)

## Key Files

- `/app/layout.tsx` - Root layout with providers
- `/app/globals.css` - Tailwind v4 config and design tokens
- `/lib/fonts.ts` - Font configuration
- `/lib/motion.ts` - Animation utilities and reduced motion policy
- `/lib/utils.ts` - Shared utility functions

## Hook Signatures

<!-- Add every custom hook with its exact return type -->

### useReducedMotion()

```typescript
Returns: boolean
```

## Utility Functions

- `cn(...inputs: ClassValue[]): string` → `/lib/utils.ts`
- `formatDate(date: string | Date): string` → `/lib/utils.ts`
- `formatDateShort(date: string | Date): string` → `/lib/utils.ts`

## Import Locations

<!-- Track non-obvious imports to prevent errors -->

- `cn` → `@/lib/utils`
- `satoshi`, `newsreader`, `monaspace` → `@/lib/fonts`
- `useReducedMotion` → `@/hooks/useReducedMotion`

## Design Decisions

- Dark mode only - no light mode styles anywhere
- Command palette is primary navigation (Cmd+K)
- Fluid typography using clamp()
- Mobile drawer slides from right
- Reduced motion respects system preference

## Notes

<!-- Claude Code: Update this section with important discoveries, decisions, and context as you work -->

