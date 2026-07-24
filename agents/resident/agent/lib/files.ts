import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
export const journalDirectory = resolve(moduleDirectory, "../../../../content/journal");
export const memoryDirectory = resolve(moduleDirectory, "../..", "memory");

export async function readMarkdownDirectory(directory: string): Promise<Array<{ name: string; content: string }>> {
  let names: string[];
  try {
    names = await readdir(directory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const markdownNames = names.filter((name) => name.endsWith(".md") || name.endsWith(".mdx"));
  return Promise.all(
    markdownNames.sort().reverse().map(async (name) => ({ name, content: await readFile(join(directory, name), "utf8") })),
  );
}

export async function writeMarkdown(directory: string, name: string, content: string): Promise<string> {
  await mkdir(directory, { recursive: true });
  const filePath = join(directory, name);
  await writeFile(filePath, content, { encoding: "utf8", flag: "wx" });
  return filePath;
}
