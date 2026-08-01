<!--
Skill: parallel-cli
Source: one of the always-on agent skills from treygoff.com/stack
De-personalized for public use: machine paths, personal names, and private
infrastructure references have been genericized. Read it before you run it —
some steps assume tools you may not have installed.
Install: save as ~/.claude/skills/parallel-cli/SKILL.md
-->

---
name: parallel-cli
description: >-
  Use Parallel through the local `parallel-cli` for live web intelligence: current web search,
  URL/PDF extraction, deep or exhaustive research, structured data enrichment, FindAll entity/list
  discovery, and Monitor change tracking. Prefer this skill when the user asks to use Parallel,
  asks for source-backed current research, asks to fetch/read URLs with Parallel, requests
  exhaustive/deep research, wants to enrich companies/people/products/CSV data from the web, wants
  to build a list of entities from natural-language criteria, or wants ongoing monitoring/alerts.
  Do not use for ordinary codebase search or when the user explicitly requests a different search
  provider.
---

# Parallel CLI

Use the installed `parallel-cli` instead of Parallel MCP. Keep API keys out of commands, output, and final replies. If auth fails, check whether `PARALLEL_API_KEY` is loaded from the active shell/profile before asking the user for a key.

## Tool choice

- Use `parallel-cli search` for normal current-info lookup, source discovery, market/company/person research, documentation lookups, and fact checking.
- Use `parallel-cli extract`/`fetch` when the user gives specific URLs, PDFs, JS-heavy pages, or after search identifies pages worth reading.
- Use `parallel-cli research run` only when the user explicitly asks for deep, exhaustive, comprehensive, or multi-hop research. Default to async (`--no-wait`) first.
- Use `parallel-cli enrich` for CSV/JSON/inline lists of companies, people, products, or other entities where fields should be added from web research.
- Use `parallel-cli findall` when the user wants to discover a set of matching entities from criteria, e.g. companies matching a profile, competitors, grants, programs, vendors, people, or datasets.
- Use `parallel-cli monitor` when the user asks to track a query over time, create alerts, list monitors, inspect events, or simulate monitor webhooks.

## Baseline checks

```bash
command -v parallel-cli
parallel-cli auth
parallel-cli --version
```

Use `--json` for machine-readable output when available. Save large outputs to files rather than dumping them into chat. Good default output locations are the current workspace for user deliverables or `/tmp` for scratch results.

## Search

```bash
parallel-cli search "<natural-language objective>" \
  -q "<keyword query>" -q "<alternate keyword query>" \
  --max-results 10 --json
```

Useful options:
- `--include-domains domain.com,other.org` for source-constrained research.
- `--exclude-domains domain.com` to avoid noisy sources.
- `--after-date YYYY-MM-DD` for recency filters.
- `-o path.json` to save the full result for follow-up.

Answer with source-backed synthesis. Cite URLs returned by Parallel. Do not invent citations.

## Extract / fetch

```bash
parallel-cli extract "https://example.com/page" --json
parallel-cli extract "https://example.com/page" --objective "pricing and enterprise plan limits" --json
parallel-cli extract "https://example.com/page" --full-content -o page.md
```

Use extraction for specific pages and PDFs. If the output is long, save it and summarize from the file rather than flooding context.

## Deep research

Start async unless the user explicitly wants to wait:

```bash
parallel-cli research run "<research question>" --processor pro-fast --no-wait --json
```

Processor guidance:
- `pro-fast`: default for deep research.
- `ultra-fast`: deeper, slower, more expensive.
- `ultra`: maximum depth; use only when explicitly requested.

Poll/save results:

```bash
parallel-cli research status <run_id> --json
parallel-cli research poll <run_id> --timeout 540 -o "research-output"
```

The `-o` poll path produces markdown/JSON files. Report file paths, run id, and any interaction id. Use `--previous-interaction-id` for follow-up research that should build on prior context.

## Enrichment

Inline example:

```bash
parallel-cli enrich run \
  --data '[{"company":"Google"},{"company":"Microsoft"}]' \
  --intent "Find current CEO and annual revenue" \
  --target output.csv \
  --no-wait --json
```

CSV example:

```bash
parallel-cli enrich run \
  --source-type csv --source input.csv --target enriched.csv \
  --source-columns '[{"name":"company","description":"Company name"}]' \
  --intent "Find current CEO and headquarters" \
  --no-wait --json
```

Poll:

```bash
parallel-cli enrich status <taskgroup_id> --json
parallel-cli enrich poll <taskgroup_id> --timeout 540 --output enriched.csv
```

For large or valuable datasets, do a small dry run/sample first when feasible.

## FindAll

Use `parallel-cli findall --help` and subcommand help for exact options, because FindAll schemas can vary by use case. Typical flow:

```bash
parallel-cli findall ingest "<natural-language criteria>" --json
parallel-cli findall run "<criteria or schema>" --no-wait --json
parallel-cli findall status <run_id> --json
parallel-cli findall poll <run_id> --json
parallel-cli findall result <run_id> --json
```

Use FindAll when discovery is the core task, not when the user already supplied the list.

## Monitor

Use `parallel-cli monitor --help` and command-specific help before creating or updating monitors. Typical flow:

```bash
parallel-cli monitor list --json
parallel-cli monitor create --help
parallel-cli monitor events <monitor_id> --json
parallel-cli monitor get <monitor_id> --json
```

Before creating a persistent monitor, state the query, cadence/trigger assumptions, and destination/webhook assumptions. Do not create noisy monitors without a clear user request.

## Evidence discipline — when the answer will be relied on

Applies to any lookup whose result feeds a decision, a deliverable, or another agent. Each of these has produced a real, confident, wrong answer.

- **A wall is not a negative.** "The page was paywalled / CAPTCHA'd / 403'd" and "I looked and the record is not there" are different facts and must never be reported the same way. Say which one you have. Unexamined evidence is not absent evidence.
- **A zero result is not proof of absence.** Before reporting a negative, run a **control query that returns hits** to prove the search actually works, and say so. Note spelling variants tried, wildcard/compaction behavior, and the index's date coverage.
- **Read the index at the position** when the interface allows it. Typeahead, proximity, and alphabetical browse let you see the actual neighbours where a name *would* sort. Reporting "the slot between X and Y is empty" is a real negative; reporting "the search returned nothing" is not.
- **HTTP 200 is not proof of access.** Many sources return 200 while serving a CAPTCHA, a JS shell, or a login page. Classify on what the body contains, and re-probe anything that looked open on the first request — bot walls frequently appear on the second.
- **Fuzzy search endpoints fabricate findings.** Many government and vendor APIs do full-text matching, and substring-filtering their *results* is just as unsafe. Filter on exact normalized equality, and verify the target's exact legal name first — one wrong letter hides a record set, one loose filter invents one.
- **Assume a namesake exists.** Find them, document their distinguishing facts, and record them so nobody later rediscovers them as a hit.
- **Don't launder a precise fact through an aggregator.** When the value of a date or figure is its precision, only the official record will do.

For a full records-diligence workflow built on these rules, plus a tested map of which government registries are open vs walled, see the `public-records-diligence` skill.

## Response norms

- State when Parallel was used and which mode (`search`, `extract`, `research`, `enrich`, `findall`, or `monitor`).
- Include source links for factual claims derived from web results.
- Include output file paths for saved artifacts.
- Do not expose API keys or auth file contents.
