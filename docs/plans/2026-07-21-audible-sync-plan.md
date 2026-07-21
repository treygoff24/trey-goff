# Audible → Library weekly sync — implementation plan

Date: 2026-07-21. Author: workspace Claude (Fable). Status: REVIEWED —
plan-reviewer verdict "implement with amendments"; all findings triaged
below, all accepted (one adapted). Implementation may proceed.

## Amendments (plan-review triage, 2026-07-21)

1. **ACCEPT (blocker) — cover artifacts.** `resolve-book-covers.ts`
   downloads `public/covers/{id}.jpg` (git-tracked, 327 present) and the
   plan only staged `public/*.json`. The wrapper now stages, by explicit
   pathspec, every prebuild-touched artifact: `content/library/books.json`,
   new/changed files under `public/covers/`, and changed `public/*.json`
   (cover-map, appearance-covers, book-colors, search-index, manifests).
2. **ACCEPT (blocker) — index-sweeping commit.** Commit uses an explicit
   pathspec (`git commit -F <msg> -- <paths>`), never a bare index commit,
   so another session's staged work is untouched. Fleet preflight added:
   `fleet repo <repo> --for audible-sync` (exit 3 → skip week), plus a
   30-minute claim around the write/commit, released on exit. Residual
   risk, accepted knowingly: regenerated artifacts (e.g. search index)
   embed whatever content sits in the working tree at run time; harmless
   because those artifacts are regenerated on every content commit.
3. **ACCEPT, ADAPTED (blocker) — branch guard.** Reviewer asked for a
   hard `main` assert. Reality: development lives on the long-lived
   `feat/machine-city` branch and `main` is ~100 commits stale, so a
   main-only assert means the job never runs. Adapted guard: abort
   (exit 0, logged) on detached HEAD or mid-merge/rebase state; otherwise
   commit on the current branch and record the branch name in the log and
   commit body. Content commits merge trivially across branches.
4. **ACCEPT (major) — launchd binary rot.** Wrapper hardcodes absolute
   paths (`/opt/homebrew/bin/{pnpm,node}`, `~/.local/bin/{audible,claude}`,
   `~/.cargo/bin/fleet`), sets an explicit PATH, and fails loudly naming
   any missing binary. (The interactive `claude` on PATH is a temp cmux
   shim — `~/.local/bin/claude` is the stable symlink.) Verified once by
   `launchctl kickstart` at install, not just a shell run.
5. **ACCEPT (major) — matching.** Match key uses full normalized primary
   author, not surname. Every decision (matched→id / inserted / promoted /
   skipped) is logged in the report and commit body. Title-collision with
   different author → "possible duplicate — review" report line, no
   auto-action. The LLM `match_existing_id` pass feeds the same report.
6. **ACCEPT (major) — slug collisions.** Disambiguate `{slug}-2` instead
   of dropping; reported.
7. **ACCEPT (minor) — cheap gate.** Wrapper runs `pnpm test` and
   `pnpm typecheck` before committing; abort on failure (commit is still
   the review surface; push remains manual).
8. **ACCEPT (minor) — `whyILoveIt`.** Typed required in
   `lib/books/types.ts` but present on only 9/334 entries and guarded by
   every renderer; the sync never writes it (Trey's voice). Implementer:
   do not "fix" the type.
9. **ACCEPT (minor) — missed runs.** `StartCalendarInterval` doesn't
   catch up if the Mac is asleep Sunday 07:00; accepted as best-effort
   weekly.
10. **NIT.** The subtitle-delimiter mojibake in the original draft is an
   encoding artifact; the normalizer splits on literal `:` and the em
   dash (U+2014).

## Goal

A weekly, unattended pipeline that pulls Trey's Audible library and folds new
and newly-finished books into `content/library/books.json`, regenerates the
derived artifacts (`pnpm prebuild`), and commits locally. Pushes stay manual
(Trey's standing push gate). Hand-curated existing entries are never mutated
except for a status promotion.

## Ground truth (verified 2026-07-21 against audible-cli 0.4.0 source + PyPI)

- `audible-cli` 0.4.0 (released 2026-07-20, active), Python >=3.11,<3.15,
  install via `uv tool install audible-cli` → `~/.local/bin/audible`.
- Auth: one-time interactive `audible quickstart` (external-browser login
  recommended; handles 2FA). Device registration yields RSA sign-request
  credentials valid until deregistered — **headless forever after**, no token
  refresh dance. Auth file: `~/.audible/` (leave unencrypted for launchd; the
  file is already in Trey's home dir with user-only perms).
- Export: `audible library export -f json -o <path>` emits a JSON array with
  `asin, title, subtitle, authors, narrators, genres, is_finished,
  percent_complete, rating, date_added, release_date, cover_url, ...`.
  `is_finished`/`percent_complete` are first-class — no raw API needed.
- Weekly read-only polling is negligible lockout risk; the cron must never
  invoke `quickstart`/login (re-registration loops are the real risk).

## Target schema (existing, do not change)

`content/library/books.json` = `{ lastUpdated, books: [...] }`, each book:
`id` (kebab slug), `title`, `author` ("First Last", single string), `year`
(**original publication year**, not audiobook release — e.g. 1879 for
Progress and Poverty), `status` (`read` observed 333×, `want` 1×; `reading`
is the intended in-progress value), `topics[]` (curated vocab, e.g.
`governance`, `land`, `classical-liberalism`), `genre` (one of the ~33
existing values), optional `rating`. Consumers: `resolve-book-covers.ts`,
`generate-interactive-manifests.ts`, search index — all driven by `pnpm
prebuild`.

## Design

One Python script + one shell wrapper + one launchd plist. No new npm deps,
no framework.

### Components

1. **`scripts/audible_sync.py`** (Python 3.11+, stdlib only). Steps:
   a. Run `audible library export -f json -o <tmpfile>` via subprocess
      (absolute binary path from config; `--timeout` set; stderr captured).
   b. Load both files. Filter Audible items to *books with signal*:
      skip podcasts (genre ladder contains "Podcast"), skip items with
      `percent_complete == 0 and not is_finished` (unstarted purchases
      don't belong on the site), skip ASINs in the ignore file.
   c. **Match** each remaining item against existing books by normalized
      key: lowercase title with subtitle stripped (text before ":" / "‚Äî"),
      punctuation/articles removed + author surname. Exact normalized match
      → same book.
   d. For **matched** books: if `is_finished` and existing status is
      `reading`/`want` → promote to `read`. No other field is ever touched.
   e. For **unmatched** items: batch them into ONE enrichment call to
      `claude -p --model claude-sonnet-5 --output-format json` (headless,
      subscription auth). Prompt includes: the site's exact genre list and
      full topics vocabulary (extracted from books.json at runtime), five
      style-guide example entries, and per-item Audible metadata. The model
      returns, per item, strict JSON: `id` (slug), `title` (cleaned, no
      subtitle unless load-bearing), `author` (primary author only), `year`
      (original publication year from its knowledge), `topics` (2–5, from
      existing vocab; new topic allowed only when nothing fits), `genre`
      (existing values only), `status` (`read` if is_finished else
      `reading`), and `match_existing_id` — its judgment that the item is
      actually an already-listed book the normalizer missed (those become
      status promotions, not inserts). **Never a rating** (mission rule:
      no invented ratings).
   f. Validate the model output in code: schema check, genre ∈ existing set,
      no id collisions, no rating key, year sanity (1000–current+1).
      Items failing validation are skipped and listed in the report — never
      guessed at in code.
   g. Write books.json (append new, apply promotions, bump `lastUpdated`,
      preserve key order/2-space indent to keep diffs reviewable). Idempotent:
      re-running with no changes writes nothing and exits 0 "no changes".
   h. `--dry-run` flag prints the would-be diff and report without writing.
2. **`scripts/audible-sync.sh`** (wrapper for launchd): sets PATH +
   `AUDIBLE_CONFIG_DIR`, cds to the repo, exits 0 with a logged notice if
   `~/.audible` auth is missing (pre-auth grace), runs the Python script;
   on changes runs `pnpm prebuild`, then `git add` **by name** (books.json +
   the generated `public/*.json` incl. `book-colors.json`) and commits with
   a message listing added/promoted titles. Never pushes. All output →
   `~/Library/Logs/audible-sync.log`.
3. **`~/Library/LaunchAgents/com.trey.audible-sync.plist`**: weekly
   (`StartCalendarInterval` Sunday 07:00, `RunAtLoad` false), absolute
   paths, stdout/err to the same log.
4. **`content/library/audible-ignore.json`**: ASIN list with a `_comment`
   field, for titles Trey never wants surfaced. Starts empty.

### Failure posture

- Any step failing (export non-zero, claude call failing, validation empty)
  → log, exit non-zero, **no partial writes, no commit**. Next week retries.
- A 401 from Audible → logged with the exact re-auth instruction
  (`audible quickstart`, external browser) so Trey sees it in the log.
- The commit is the review surface: message lists every change; `git log`
  + the Library page diff is Trey's audit trail. Reverting = `git revert`.

### Testing

- Unit-ish: run `audible_sync.py --dry-run` against a fixture export JSON
  (checked into `test/fixtures/audible-export.sample.json`, fabricated
  titles) with a temp books.json — asserts matching, promotion, podcast
  filtering, validation rejection, idempotence. One pytest-free
  `python3 scripts/audible_sync.py --self-test` entry running asserts.
- Live acceptance (post-auth, once Trey completes quickstart): real export
  `--dry-run`, eyeball the report; then a real run; verify `pnpm
  ci:quality` green and Library page renders the new entries in dev.

### Queued for Trey (the one human step)

`uv tool install audible-cli && audible quickstart` — choose external
browser login, country `us`, **no auth-file password**. ~3 minutes. Until
then the launchd job self-skips harmlessly.

## Non-goals

- No Audible ratings/import of Trey's star ratings (site ratings are
  hand-given; 8/334 have one).
- No cover sourcing from Audible's `cover_url` — the site's existing
  `resolve-book-covers.ts` pipeline stays authoritative.
- No deletion sync (removing an Audible title never removes a site entry).
- No push, no deploy, no CI change.

## Wave plan

Single wave (this is ~250 lines total): script + wrapper + plist + fixture
+ self-test, implemented by coordinator (Claude) directly — foundry lanes
reserved for Mission 2; this is a small, testable unit. Reviewed by
plan-reviewer (this doc) and post-implementation by a fresh-context
subagent diff review.
