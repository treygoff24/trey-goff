import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = JSON.parse(
  await readFile(resolve(appRoot, "..", "..", "public", "search-index.json"), "utf8"),
);

const entries = source.documents
  .filter((document) => document.type !== "action")
  .map((document) => ({
    type: document.type,
    slug: document.url.replace(/^\//, "") || "home",
    title: document.title,
    date: null,
    summary: document.description ?? "",
    tags: document.tags ?? [],
  }));

await writeFile(
  resolve(appRoot, "data", "site-manifest.json"),
  `${JSON.stringify({ version: 1, generatedAt: source.generatedAt, entries }, null, 2)}\n`,
);

console.log(`Wrote ${entries.length} site catalog entries.`);
