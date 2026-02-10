/**
 * Tests for asset optimization - ensures large PNGs are converted to WebP.
 */
import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

describe("nebula asset optimization", () => {
  const nebulaeDir = resolve(__dirname, "../public/assets/library/nebulae");

  it("should have nebula files converted to WebP format", () => {
    const files = readdirSync(nebulaeDir);
    const webpFiles = files.filter(f => f.endsWith('.webp') && f.startsWith('nebula_'));
    const pngFiles = files.filter(f => f.endsWith('.png') && f.startsWith('nebula_'));

    const hasWebP = webpFiles.length > 0;
    const hasPNG = pngFiles.length > 0;

    if (hasWebP) {
      assert.ok(
        pngFiles.length < 7,
        `Found ${pngFiles.length} PNG files. Expected WebP versions to replace them.`
      );
    } else if (hasPNG) {
      for (const file of pngFiles) {
        const filePath = join(nebulaeDir, file);
        const stats = statSync(filePath);
        const sizeKB = stats.size / 1024;

        assert.ok(
          sizeKB < 400,
          `${file} is ${Math.round(sizeKB)}KB, expected < 400KB. Convert to WebP for better compression.`
        );
      }
    } else {
      assert.fail("Expected either WebP or optimized PNG files in nebulae directory");
    }
  });
});
