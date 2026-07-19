import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { defineTool } from "eve/tools";
import { z } from "zod";

import { journalDirectory, readMarkdownDirectory } from "../lib/files";

const slug = z.string().regex(/^[a-z0-9][a-z0-9-]{0,119}$/);

export default defineTool({
  description: "Read the Resident's public journal, or list its most recent entries.",
  inputSchema: z.object({ slug: slug.optional() }),
  async execute({ slug }) {
    if (slug) {
      try {
        return { slug, content: await readFile(join(journalDirectory, `${slug}.mdx`), "utf8") };
      } catch {
        return { slug, content: null };
      }
    }

    const entries = await readMarkdownDirectory(journalDirectory);
    return entries.slice(0, 20).map(({ name, content }) => ({
      slug: name.replace(/\.mdx?$/, ""),
      excerpt: content.slice(0, 600),
    }));
  },
});
