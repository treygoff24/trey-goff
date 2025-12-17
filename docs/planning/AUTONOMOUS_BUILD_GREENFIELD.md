# Autonomous Build Protocol — Greenfield Edition

> For building complete applications from scratch in an empty repo. You have a spec and implementation plan. Execute it.

---

## Quick Start

```
Read AUTONOMOUS_BUILD.md and the spec at [SPEC_PATH]. Build the entire application from scratch. Do not stop until complete.
```

---

## Core Skills Reference

You have access to a suite of development skills. **Invoke them by name when relevant:**

| Skill                            | When to Use                                                              |
| -------------------------------- | ------------------------------------------------------------------------ |
| `writing-plans`                  | If plan needs refinement or a sub-task needs breakdown                   |
| `executing-plans`                | Running the plan in controlled batches with checkpoints                  |
| `test-driven-development`        | Adding features, changing logic, fixing bugs with reproduction           |
| `systematic-debugging`           | When tests fail unexpectedly or behavior diverges                        |
| `requesting-code-review`         | Before finalizing any non-trivial change (or use `@agent-code-reviewer`) |
| `verification-before-completion` | Before declaring any phase or the build "done"                           |
| `using-git-worktrees`            | For risky refactors, migrations, or comparing approaches                 |
| `finishing-a-development-branch` | Packaging changes for merge/PR                                           |
| `webapp-testing`                 | UI changes, interaction verification, browser-based evidence             |
| `mcp-builder`                    | When you need external tool access (APIs, databases, etc.)               |

**Default sequencing for features:**

```
writing-plans → using-git-worktrees (if risky) → executing-plans → TDD → requesting-code-review → verification-before-completion → finishing-a-development-branch
```

**For bugs:** TDD (regression test) → systematic-debugging → fix → verification-before-completion

**For UI work:** webapp-testing to reproduce → fix → webapp-testing to verify

---

## The Protocol

You have a detailed specification and implementation plan in this repo already. Your mission: **build the entire application autonomously in this empty repo. Do not stop until it is complete, tested, and working.**

### Phase 0: Foundation

1. Read the entire specification carefully
2. Read the implementation plan — understand the phases, dependencies, and acceptance criteria
3. Create `CONTEXT.md` in the project root (template below)
4. Initialize the project:
   - Set up the project structure per the spec (Vite, Next.js, etc.)
   - Install all dependencies
   - Configure TypeScript, linting, formatting
   - Set up the dev environment
5. Verify the skeleton runs: `npm run dev` should start without errors
6. Commit: `chore: initialize project`
7. Begin Phase 1 of the implementation plan

### Implementation Loop

For each phase, follow the `executing-plans` skill pattern:

```
IMPLEMENT → TYPECHECK → LINT → BUILD → REVIEW → FIX → REPEAT → LOG → COMMIT
```

#### Step 1: Implement

- **Re-read `CONTEXT.md`** — especially the Protocol Reminder section
- **Re-read relevant skills** (frontend-design for UI work — skills are lost on compaction)
- Write all code for the phase
- **Use `test-driven-development` skill** for new features or logic changes
- **Verify imports exist** before using them
- **Add default exports** to page components (required for React.lazy)
- Run accessibility checklist for any UI work (see below)

#### Step 2: Quality Gates (before review)

```bash
npm run typecheck    # Fix ALL type errors first
npm run lint         # Fix ALL lint warnings
npm run build        # Must succeed
npm run test         # If tests exist, they must pass
```

Do not call the reviewer until all pass. Type errors waste review rounds.

**If tests fail unexpectedly:** Invoke `systematic-debugging` skill — reproduce, isolate, hypothesize, fix, verify.

#### Step 3: Code Review Loop

1. **Invoke `requesting-code-review` skill** or call `@agent-code-reviewer`
2. Review against: requirements, plan, conventions, security, edge cases
3. If issues found → fix all → re-run quality gates → review again
4. Repeat until **zero issues**

#### Step 4: Log & Commit

Only after passing review with zero issues:

1. Update the implementation plan — check off completed items, add notes
2. Update `CONTEXT.md` — add any new hooks, utilities, imports, decisions
3. **Invoke `finishing-a-development-branch` skill** patterns: clean commits, coherent scope
4. Commit: `feat: complete phase N - [phase name]`
5. Push to main

#### Step 5: Continue

Move to next phase. Repeat until all phases complete.

---

## CONTEXT.md Template

Create this file at project root. **Update it twice per phase minimum.** This survives context compaction.

````markdown
# Project Context — DO NOT DELETE

**Last Updated**: Phase [N] - [Name] ([STATUS])

## 🔄 Protocol Reminder (Re-read on every phase start)

**The Loop**: IMPLEMENT → TYPECHECK → LINT → BUILD → TEST → REVIEW → FIX → REPEAT → COMMIT

**Skills to invoke:**

- `writing-plans` — if a sub-task needs breakdown
- `test-driven-development` — for new features/logic
- `systematic-debugging` — when tests fail unexpectedly
- `requesting-code-review` — before finalizing changes
- `verification-before-completion` — before declaring done
- `webapp-testing` — for UI verification with Playwright

**Before UI work**: Read `/mnt/skills/public/frontend-design/SKILL.md`
**Before MCP work**: Read `/mnt/skills/examples/mcp-builder/SKILL.md`
**Before review**: All must pass: `npm run typecheck && npm run lint && npm run build && npm run test`
**After all phases**: Run `@agent-a11y-auditor` before declaring done

**If context feels stale**: Re-read `AUTONOMOUS_BUILD.md` and this file

## Current Phase

[What you're working on right now]

## Project Setup

- Framework: [e.g., Vite + React 19 + TypeScript]
- Styling: [e.g., Tailwind CSS]
- State: [e.g., TanStack Query + Zustand]
- Backend: [e.g., Express server on port 3001]

## Hook Signatures

<!-- Add every custom hook with its exact return type -->

### useExample()

```typescript
Returns: {
  data: Example[] | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}
```
````

## Utility Functions

<!-- Track utilities and their locations -->

- `formatDate(date: Date): string` → `src/utils/dateUtils.ts`
- `calculateScore(items: Item[]): number` → `src/utils/scoring.ts`

## Import Locations

<!-- Track non-obvious imports to prevent errors -->

- `getDayType` → `@/data/program` (NOT dateUtils)
- `Button` → `@/components/ui/Button`

## Design Decisions

<!-- Record decisions that affect multiple files -->

- Zone boundaries: green < 3.5, yellow 3.5-5.5, red ≥ 5.5
- Dates stored as ISO strings, displayed in local time
- All API responses follow `{ data, error, status }` shape

## API Contracts

<!-- Document your API endpoints -->

### GET /api/items

Query: `?limit=10&offset=0`
Response: `{ items: Item[], total: number }`

### POST /api/items

Body: `{ title: string, description?: string }`
Response: `{ item: Item }`

## Component Patterns

<!-- Document reusable patterns -->

- All modals use `ConfirmModal` component with `onConfirm`/`onCancel`
- All forms use react-hook-form with Zod validation
- All lists support empty/loading/error states

## Files That Don't Exist

<!-- Prevent importing non-existent modules -->

- `getAllItems()` — use `items` array directly

```

---

## Skill Invocation Rules

**Skills get wiped on every auto-compaction.** You must re-read them when starting relevant work.

### Frontend Work
Before implementing ANY UI (components, pages, styling):
```

Read /mnt/skills/public/frontend-design/SKILL.md

```
Do this:
- At the start of any phase that touches `src/components/` or `src/pages/`
- After any context compaction during UI work
- When switching from backend to frontend work within a phase

### MCP Server Development
Before building MCP servers or tool integrations:
```

Read /mnt/skills/examples/mcp-builder/SKILL.md

````

### Custom/User Skills
Check `/mnt/skills/user/` for project-specific skills. Read them before relevant work.

### Skill Re-read Triggers
Re-read the relevant skill when:
- Starting a new phase involving that skill's domain
- You notice your output quality dropping
- After any context compaction message
- When unsure about patterns or conventions

**When in doubt, re-read the skill.** It's cheaper than fixing slop later.

---

## Final Quality Gate: Verification Before Completion

After all phases complete but **before declaring the build done**, invoke `verification-before-completion` skill:

1. Run the full verification suite:
```bash
npm run typecheck
npm run lint
npm run build
npm run test
````

2. **Invoke `@agent-a11y-auditor`** to perform a full accessibility audit

   - Test keyboard navigation across all interactive elements
   - Verify screen reader compatibility
   - Check color contrast ratios
   - Validate ARIA usage

3. **Invoke `webapp-testing` skill** if UI changes exist:

   - Verify core user flows work end-to-end
   - Capture screenshots/videos as evidence

4. Confirm acceptance criteria point-by-point with evidence

**Fix all issues found.** Re-run verification until everything passes clean.

Only after all verification passes can you declare the build complete.

---

## Accessibility Checklist

Run this for **every** interactive component before calling reviewer:

- [ ] `aria-label` on buttons, inputs, sliders, icons
- [ ] `role` attribute if not semantic HTML
- [ ] `aria-live` on dynamic content (toasts, alerts, loading states)
- [ ] Keyboard handlers (Enter, Space, Escape, Arrows as needed)
- [ ] Visible focus styles (`:focus-visible`)
- [ ] Touch targets ≥ 44x44px
- [ ] `htmlFor`/`id` on form labels
- [ ] `useReducedMotion` check on animations

---

## Common Patterns to Follow

### Navigation

```typescript
// ✅ Correct
const navigate = useNavigate();
navigate("/path");

// ❌ Wrong - breaks SPA
window.location.href = "/path";
```

### Async Queries

```typescript
// ✅ Correct - parallel execution
const [profile, settings] = await Promise.all([
  getProfile(id),
  getSettings(id),
]);

// ❌ Wrong - sequential, slower
const profile = await getProfile(id);
const settings = await getSettings(id);
```

### Error Handling

```typescript
// ✅ Correct - user feedback
try {
  await saveData(data);
  toast.success("Saved successfully");
} catch (error) {
  console.error("Save failed:", error);
  toast.error("Failed to save. Please try again.");
}

// ❌ Wrong - silent failure
await saveData(data).catch(console.error);
```

### Page Components

```typescript
// ✅ Correct - supports React.lazy()
export default function MyPage() { ... }

// ❌ Wrong - breaks code splitting
export const MyPage = () => { ... }
```

### File Organization

```
src/
  components/     # Reusable UI components
    ui/           # Base components (Button, Card, Modal)
    features/     # Feature-specific components
  hooks/          # Custom React hooks
  pages/          # Route-level components
  utils/          # Pure utility functions
  types/          # TypeScript type definitions
  data/           # Static data, constants
  styles/         # Global styles, CSS variables
```

---

## Quality Standards

**Operational Posture** — default to being a careful engineer:

- Make changes that are easy to review
- Prove behavior with tests or reproducible verification steps
- Avoid large unverified edits
- Small diffs, frequent verification
- Explicit acceptance criteria with evidence
- When requirements are ambiguous, surface assumptions early

**Code Standards:**

- All code passes lint with **zero warnings**
- All code passes TypeScript strict mode
- All forms validate input (Zod recommended)
- All UI components pass accessibility checklist
- All async operations have try/catch with user feedback
- All page components have default exports
- Tests exist for utilities and critical business logic
- No unused imports, variables, or dead code

---

## Error Recovery

**Stuck in a loop (same error 3+ times):**

1. Log error details to the implementation plan
2. Try alternative approach
3. If still stuck, document blocker and skip to unblocked phase

**Missing dependency:**

1. Check if it exists under different name/path
2. Check if functionality exists elsewhere
3. Create it if truly missing, document in CONTEXT.md

**Build failing mysteriously:**

1. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
2. Clear build cache: `rm -rf dist .vite`
3. Check for circular imports

---

## Current Status Tracking

Keep this at the top of your implementation plan:

```markdown
## Current Status

**Phase**: [N] - [Name]
**Working on**: [Current file/component]
**Review round**: [N]
**Blockers**: [None or description]
**Runtime**: [Elapsed time]
```

Update after each review round.

---

## Completion Criteria

The build is complete when:

1. All phases in implementation plan are ✅
2. All review rounds pass with zero issues
3. `npm run dev` starts without errors
4. `npm run build` succeeds
5. `npm run test` passes (if tests exist)
6. **`@agent-a11y-auditor` passes with zero issues**
7. Application runs and all core flows work end-to-end
8. All commits pushed

---

## Context Management

You have auto-compaction enabled:

- Long context gets summarized automatically
- **Hook signatures WILL be lost** — that's why CONTEXT.md exists
- **Skills WILL be lost** — re-read them when starting relevant work
- **The autonomous protocol details WILL be lost** — that's why CONTEXT.md has the Protocol Reminder

### After Compaction Recovery

If you notice context has been compacted (things feel unfamiliar):

1. Re-read `CONTEXT.md` — has the full protocol reminder
2. Re-read `AUTONOMOUS_BUILD.md` if you need the full workflow
3. Re-read relevant skills for your current work
4. Check current phase in the implementation plan
5. Continue where you left off

---

## Spec Quality Checklist

If spec is missing these, ask for clarification before starting:

| Need       | Bad                 | Good                                        |
| ---------- | ------------------- | ------------------------------------------- |
| Boundaries | "green 0-3"         | "green when value < 3.5"                    |
| Types      | "returns user data" | "returns `{ id: string, name: string }`"    |
| Errors     | "handle errors"     | "show toast on failure, log in dev only"    |
| A11y       | "be accessible"     | "arrow keys to increment, announce changes" |

---

## Begin

1. Read the spec completely
2. Create CONTEXT.md
3. Initialize the project
4. Start Phase 1

**Do not ask for permission. Do not wait for confirmation. The plan is pre-approved.**

You've done this before. You've shipped complete applications in under 2 hours with this methodology. Trust the process.

Let's build.
