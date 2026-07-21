#!/bin/bash
# Weekly Audible -> books.json sync wrapper for launchd.
# Design + review record: docs/plans/2026-07-21-audible-sync-plan.md.
set -u

REPO="/Users/treygoff/Code/trey-goff"
LOG="$HOME/Library/Logs/audible-sync.log"
mkdir -p "$(dirname "$LOG")"
exec >>"$LOG" 2>&1
echo "=== audible-sync $(date '+%Y-%m-%dT%H:%M:%S%z') ==="

# launchd env is minimal: absolute paths only (review finding 4)
AUDIBLE="$HOME/.local/bin/audible"
CLAUDE="$HOME/.local/bin/claude"
PNPM="/opt/homebrew/bin/pnpm"
NODE="/opt/homebrew/bin/node"
PYTHON="/opt/homebrew/bin/python3"
FLEET="$HOME/.cargo/bin/fleet"
export PATH="/opt/homebrew/bin:$HOME/.local/bin:$HOME/.cargo/bin:/usr/bin:/bin"
export AUDIBLE_BIN="$AUDIBLE" CLAUDE_BIN="$CLAUDE"
[ -x "$PYTHON" ] || PYTHON="/usr/bin/python3"

for bin in "$PNPM" "$NODE" "$CLAUDE" "$PYTHON"; do
  [ -x "$bin" ] || { echo "FATAL missing binary: $bin"; exit 1; }
done
if [ ! -x "$AUDIBLE" ] || [ ! -d "$HOME/.audible" ]; then
  echo "audible not set up yet — skipping (install: uv tool install audible-cli; then: audible quickstart, external browser login, no auth-file password)"
  exit 0
fi

cd "$REPO" || { echo "FATAL repo missing"; exit 1; }
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "FATAL not a git repo"; exit 1; }

# repo-state guards (review finding 3, adapted): never commit into a
# mid-merge/rebase tree or a detached HEAD; otherwise use the current branch.
gitdir=$(git rev-parse --git-dir)
if [ -e "$gitdir/MERGE_HEAD" ] || [ -d "$gitdir/rebase-merge" ] || [ -d "$gitdir/rebase-apply" ]; then
  echo "repo mid-merge/rebase — skipping this week"
  exit 0
fi
branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$branch" = "HEAD" ]; then
  echo "detached HEAD — skipping this week"
  exit 0
fi

# The paths this pipeline owns outright: the library data plus everything
# `pnpm prebuild` regenerates. Generated artifacts are never hand-edited
# (AGENTS.md), so resetting dirty owned paths to HEAD before prebuild and
# regenerating is always correct — and it means we can stage the whole
# allowlist afterward with no porcelain parsing, no baselines, no rename
# or substring edge cases. Foreign WIP outside these paths is untouched.
OWNED=(content/library/books.json public/covers public/manifests)
owned_globs=(':(glob)public/*.json')

MSG_FILE=$(mktemp)
cleanup() {
  rm -f "$MSG_FILE" 2>/dev/null
  [ -x "$FLEET" ] && "$FLEET" release "$REPO" --owner audible-sync >/dev/null 2>&1
  return 0
}
trap cleanup EXIT

# fleet preflight + claim (review finding 2; trap installed first so a
# failure after claiming still releases). Advisory: unexpected rc is
# logged and the run proceeds; only a positive "occupied" (rc 3) skips.
if [ -x "$FLEET" ]; then
  "$FLEET" repo "$REPO" --for audible-sync
  rc=$?
  if [ "$rc" -eq 3 ]; then echo "repo occupied per fleet — skipping this week"; exit 0; fi
  [ "$rc" -ne 0 ] && echo "fleet preflight rc=$rc (evidence unavailable) — proceeding, claim below still attempted"
  "$FLEET" claim "$REPO" --owner audible-sync --ttl 30m || echo "fleet claim failed (advisory) — proceeding"
fi

if ! "$PYTHON" scripts/audible_sync.py --commit-msg-file "$MSG_FILE"; then
  echo "sync script failed — books.json write is atomic, nothing partial on disk; will retry next week"
  exit 1
fi
if git diff --quiet -- content/library/books.json; then
  echo "no changes"
  exit 0
fi

echo "books.json changed on branch $branch — regenerating artifacts"
# Reset any pre-dirty GENERATED paths (never books.json — it now holds this
# run's additions) so prebuild output is the sole content of owned paths.
git checkout -- public/covers public/manifests "${owned_globs[@]}" 2>/dev/null || true
"$PNPM" prebuild || { echo "prebuild failed — reverting books.json, no commit"; git checkout -- content/library/books.json; exit 1; }

# cheap gate before committing (review finding 7)
"$PNPM" test || { echo "tests failed — leaving tree dirty for inspection, no commit"; exit 1; }
"$PNPM" typecheck || { echo "typecheck failed — leaving tree dirty for inspection, no commit"; exit 1; }

git add -A -- "${OWNED[@]}" "${owned_globs[@]}" || { echo "git add failed"; exit 1; }
printf '\nBranch: %s\nAutomated weekly sync (scripts/audible-sync.sh); push remains manual.\n' "$branch" >>"$MSG_FILE"
git commit -F "$MSG_FILE" -- "${OWNED[@]}" "${owned_globs[@]}" || { echo "commit failed"; exit 1; }
echo "committed: $(git log --oneline -1)"
