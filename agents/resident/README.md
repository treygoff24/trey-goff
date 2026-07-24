# The Resident agent

Standalone [eve](https://eve.dev) app for the site's Resident. The Next.js site calls the bearer-protected `POST /resident/chat` channel; this app is never imported by the root application.

## Install and verify

Use Node 24, then run:

```sh
pnpm install
pnpm sync:data
pnpm typecheck
pnpm build
```

`pnpm typecheck` is this app's required local gate. Root CI intentionally excludes `agents/`.

The catalog at `data/site-manifest.json` is checked in so deployed chat can read public site metadata without reaching back into the Next.js build. Refresh it after the root search index changes with `pnpm sync:data`.

## Local development

Set `AI_GATEWAY_API_KEY` and the same `RESIDENT_AGENT_SECRET` used by the Next.js proxy. Start the controllable server without the terminal UI:

```sh
pnpm exec eve dev --no-ui
```

Chat runs on the Sonnet-class `CHAT_MODEL`. Visitor sessions receive read-only tools; Eve's shell, file-write, delegation, todo, and open-web tools are disabled. Journal and memory writers resolve only for Eve's scheduled app principal when `RESIDENT_SCHEDULE_ENABLED=true`.

The site proxy keeps conversation IDs, turn caps, and concurrent-stream tracking in one bounded in-memory registry. This is intentionally a single-instance lab feature: a cold start or another serverless instance can forget a conversation, and the site asks the visitor to begin a fresh exchange rather than pretending that state is durable.

The twice-weekly schedule is inert by default. To exercise it locally, enable the flag and dispatch it once:

```sh
RESIDENT_SCHEDULE_ENABLED=true pnpm exec eve dev --no-ui
curl -X POST http://127.0.0.1:2000/eve/v1/dev/schedules/journal
```

The schedule writes only to `../../content/journal/` and `memory/` in the local checkout. It has no remote write path.

## Deploy

Create a separate Vercel project with `agents/resident` as its root directory. Configure Gateway authentication (`AI_GATEWAY_API_KEY` locally or Vercel OIDC in production), `RESIDENT_AGENT_SECRET`, and leave `RESIDENT_SCHEDULE_ENABLED` unset during the lab. Point the site's `RESIDENT_AGENT_URL` at this deployment.

After deployment, verify an authenticated chat round-trip and confirm the schedule remains disabled. Before enabling scheduled writing, run the dev dispatch locally and inspect the resulting uncommitted journal and memory files.

## Eve v0.25.2 API notes

- `defineState` is imported from `eve/context`, not from the root package.
- Custom HTTP channels use `defineChannel` plus absolute `POST(...)` routes; they are not declared through a separate HTTP-channel helper.
- Eve streams session events as NDJSON. The channel serializes those events, and the Next.js proxy exposes a filtered SSE stream to the browser.
- A schedule cannot directly call the model from a `run` handler. It hands work to the HTTP channel with `receive(...)` and Eve's app principal.
