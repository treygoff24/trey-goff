import { defineAgent, defineDynamic } from "eve";

import { isSchedulePrincipal } from "./lib/tool-policy";

export const CHAT_MODEL = "anthropic/claude-sonnet-5";
export const JOURNAL_MODEL = "anthropic/claude-opus-4.8";

export default defineAgent({
  model: defineDynamic({
    fallback: CHAT_MODEL,
    events: {
      "session.started": (_event, ctx) =>
        isSchedulePrincipal(ctx.session.auth.initiator) ? JOURNAL_MODEL : null,
    },
  }),
});
