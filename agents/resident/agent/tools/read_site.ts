import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { defineTool } from "eve/tools";
import { z } from "zod";

const manifestSchema = z.object({
  entries: z.array(
    z.object({
      type: z.string(),
      slug: z.string(),
      title: z.string(),
      date: z.string().nullable(),
      summary: z.string(),
      tags: z.array(z.string()),
    }),
  ),
});

export default defineTool({
  description: "Search the checked-in catalog of public content on Trey Goff's site.",
  inputSchema: z.object({ query: z.string().trim().min(1).max(200), limit: z.number().int().min(1).max(12).default(8) }),
  async execute({ query, limit }) {
    const raw = await readFile(join(process.cwd(), "data", "site-manifest.json"), "utf8");
    const manifest = manifestSchema.parse(JSON.parse(raw));
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return manifest.entries
      .map((entry) => ({
        entry,
        score: terms.reduce((score, term) => {
          const haystack = `${entry.title} ${entry.summary} ${entry.tags.join(" ")}`.toLowerCase();
          return score + (haystack.includes(term) ? 1 : 0);
        }, 0),
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
      .slice(0, limit)
      .map(({ entry }) => entry);
  },
});
