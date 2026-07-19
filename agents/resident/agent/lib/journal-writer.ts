import { basename } from "node:path";

import { journalDirectory, readMarkdownDirectory, writeMarkdown } from "./files";

export interface JournalEntryDraft {
  body: string;
  model: string;
  mood?: string;
  tags: string[];
  title: string;
}

export interface JournalWriter {
  write(draft: JournalEntryDraft): Promise<{ entryNumber: number; file: string }>;
}

export class LocalJournalWriter implements JournalWriter {
  async write(draft: JournalEntryDraft): Promise<{ entryNumber: number; file: string }> {
    const entries = await readMarkdownDirectory(journalDirectory);
    const numbers = entries.flatMap(({ content }) => {
      const match = content.match(/^entryNumber:\s*(\d+)$/m);
      return match?.[1] ? [Number(match[1])] : [];
    });
    const entryNumber = Math.max(0, ...numbers) + 1;
    const date = new Date().toISOString().slice(0, 10);
    const slug = draft.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 72);
    const fileName = `${date}-${slug || `entry-${entryNumber}`}.mdx`;
    const mood = draft.mood ? `mood: ${JSON.stringify(draft.mood)}\n` : "";
    const content = `---\ntitle: ${JSON.stringify(draft.title)}\ndate: ${date}\nentryNumber: ${entryNumber}\nmodel: ${JSON.stringify(draft.model)}\n${mood}tags: [${draft.tags.map((tag) => JSON.stringify(tag)).join(", ")}]\n---\n\n${draft.body.trim()}\n`;
    const file = await writeMarkdown(journalDirectory, fileName, content);
    return { entryNumber, file: basename(file) };
  }
}
