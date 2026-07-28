# Global agent instructions (starter)

<!-- DRAFT — pending sanitization pass and Trey's veto. Do not ship as-is. -->

Adapt freely. Everything here is a rule I got tired of repeating.

## Git

- Local commits are ungated. Commit at every coherent checkpoint, unasked.
- Pushes, PRs, tags, and deploys require my explicit go-ahead, every time.
  One "push it" authorizes exactly one push.
- Never amend, never force-push, never --no-verify. Stage files by name.

## Verification

- "Done" needs a command attached that would fail if it were not done.
- Run the project gate before reporting success, not after I ask.
- If a test fails, say so and paste the output. Never describe it as passing.

## Deletions

- Re-read the path before deleting it. Never build a delete path from an
  unvalidated variable. Ask before removing anything you did not create.

## Commit messages

- Subject <= 72 chars, blank line, then a soft-wrapped body. No manual line
  breaks mid-sentence: modern UIs reflow and hard wraps become a wall.
- Cap the body around 15-20 lines. Long context belongs in the PR.

## Shell footguns

- Use python3, never bare python. Guard optional tools with `command -v`.
- Quote every URL and glob. Assume zsh, where `set -- $var` does not split.
- `rg -r` is replace, not recursive. ripgrep already recurses.

## Asking

- Ask up front, before consequential work, when there is no time pressure.
- Prioritize questions whose answer changes the architecture.
- Do not ask permission for reversible work that follows from the request.
