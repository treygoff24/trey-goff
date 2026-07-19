import { defineDynamic, defineTool } from "eve/tools";
import { z } from "zod";

import { JOURNAL_MODEL } from "../agent";
import { LocalJournalWriter } from "../lib/journal-writer";
import { isSchedulePrincipal, scheduleWritesEnabled } from "../lib/tool-policy";

export default defineDynamic({
  events: {
    "session.started": (_event, ctx) =>
      isSchedulePrincipal(ctx.session.auth.initiator) && scheduleWritesEnabled()
        ? defineTool({
            description: "Write one public journal entry to the local repository checkout.",
            inputSchema: z.object({
              title: z.string().trim().min(1).max(120),
              body: z.string().trim().min(1).max(20_000),
              mood: z.string().trim().min(1).max(80).optional(),
              tags: z.array(z.string().trim().min(1).max(40)).max(6).default([]),
            }),
            async execute(input) {
              return new LocalJournalWriter().write({ ...input, model: JOURNAL_MODEL });
            },
          })
        : null,
  },
});
