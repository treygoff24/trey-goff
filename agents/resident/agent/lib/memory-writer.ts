import { mkdir, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { join } from "node:path";

import { memoryDirectory } from "./files";

export interface MemoryWriter {
  write(key: string, content: string): Promise<{ file: string }>;
}

export class LocalMemoryWriter implements MemoryWriter {
  async write(key: string, content: string): Promise<{ file: string }> {
    await mkdir(memoryDirectory, { recursive: true });
    const file = join(memoryDirectory, `${key}.md`);
    await writeFile(file, `${content.trim()}\n`, "utf8");
    return { file: basename(file) };
  }
}
