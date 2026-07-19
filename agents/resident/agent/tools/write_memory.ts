import { defineDynamic, defineTool } from "eve/tools";
import { z } from "zod";

import { LocalMemoryWriter } from "../lib/memory-writer";
import { isSchedulePrincipal, scheduleWritesEnabled } from "../lib/tool-policy";

export default defineDynamic({
  events: {
    "session.started": (_event, ctx) =>
      isSchedulePrincipal(ctx.session.auth.initiator) && scheduleWritesEnabled()
        ? defineTool({
            description: "Create or update one local working-memory markdown file.",
            inputSchema: z.object({
              key: z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/),
              content: z.string().trim().min(1).max(20_000),
            }),
            async execute({ key, content }) {
              return new LocalMemoryWriter().write(key, content);
            },
          })
        : null,
  },
});
