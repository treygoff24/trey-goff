import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { defineTool } from "eve/tools";
import { z } from "zod";

import { memoryDirectory, readMarkdownDirectory } from "../lib/files";

const key = z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/);

export default defineTool({
  description: "Read the Resident's local working-memory files, or list their names.",
  inputSchema: z.object({ key: key.optional() }),
  async execute({ key }) {
    if (key) {
      try {
        return { key, content: await readFile(join(memoryDirectory, `${key}.md`), "utf8") };
      } catch {
        return { key, content: null };
      }
    }

    return (await readMarkdownDirectory(memoryDirectory)).map(({ name }) => ({
      key: name.replace(/\.md$/, ""),
    }));
  },
});
