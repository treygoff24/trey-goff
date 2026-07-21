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

# fleet preflight + claim (review finding 2). Advisory: unexpected rc is
# logged and the run proceeds; only a positive "occupied" (rc 3) skips.
if [ -x "$FLEET" ]; then
  "$FLEET" repo "$REPO" --for audible-sync
  rc=$?
  if [ "$rc" -eq 3 ]; then echo "repo occupied per fleet — skipping this week"; exit 0; fi
  [ "$rc" -ne 0 ] && echo "fleet preflight rc=$rc (evidence unavailable) — proceeding, claim below still attempted"
  "$FLEET" claim "$REPO" --owner audible-sync --ttl 30m || echo "fleet claim failed (advisory) — proceeding"
fi

MSG_FILE=$(mktemp)
cleanup() {
  rm -f "$MSG_FILE" "$BASELINE" "$AFTER" 2>/dev/null
  [ -x "$FLEET" ] && "$FLEET" release "$REPO" --owner audible-sync >/dev/null 2>&1
  return 0
}
trap cleanup EXIT

# Baseline of already-dirty paths, so foreign WIP never rides into our
# commit (review finding 2): we stage only paths that BECOME dirty during
# this run, plus books.json itself.
BASELINE=$(mktemp); AFTER=$(mktemp)
git status --porcelain -z > "$BASELINE"

if ! "$PYTHON" scripts/audible_sync.py --commit-msg-file "$MSG_FILE"; then
  echo "sync script failed — books.json write is atomic, nothing partial on disk; will retry next week"
  exit 1
fi
if git diff --quiet -- content/library/books.json; then
  echo "no changes"
  exit 0
fi

echo "books.json changed on branch $branch — regenerating artifacts"
"$PNPM" prebuild || { echo "prebuild failed — reverting books.json, no commit"; git checkout -- content/library/books.json; exit 1; }

# cheap gate before committing (review finding 7)
"$PNPM" test || { echo "tests failed — leaving tree dirty for inspection, no commit"; exit 1; }
"$PNPM" typecheck || { echo "typecheck failed — leaving tree dirty for inspection, no commit"; exit 1; }

# Stage exactly what this run changed (review findings 1+2+13): every
# public/ path newly dirtied by prebuild — covers, cover-map, manifests,
# search index, book colors — parsed NUL-safe, minus anything dirty before
# we started.
git status --porcelain -z > "$AFTER"
paths=(content/library/books.json)
while IFS= read -r -d '' entry; do
  p=${entry:3}
  case "$p" in
    public/*)
      if ! grep -qzF "$entry" "$BASELINE"; then paths+=("$p"); fi
      ;;
  esac
done < "$AFTER"
git add -- "${paths[@]}" || { echo "git add failed"; exit 1; }
printf '\nBranch: %s\nAutomated weekly sync (scripts/audible-sync.sh); push remains manual.\n' "$branch" >>"$MSG_FILE"
git commit -F "$MSG_FILE" -- "${paths[@]}" || { echo "commit failed"; exit 1; }
echo "committed: $(git log --oneline -1)"
