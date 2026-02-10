import { describe, it } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = join(__dirname, "..");

describe("ProjectCard accessibility", () => {
  const projectCardPath = join(projectRoot, "components/projects/ProjectCard.tsx");
  const source = readFileSync(projectCardPath, "utf-8");

  it("should use description list for label-value pairs", () => {
    assert.match(
      source,
      /<dl[>\s]/,
      "ProjectCard should contain a description list element"
    );
  });

  it("should use dt elements for labels", () => {
    assert.match(
      source,
      /<dt[>\s]/,
      "ProjectCard should contain dt elements for labels"
    );
  });

  it("should use dd elements for values", () => {
    assert.match(
      source,
      /<dd[>\s]/,
      "ProjectCard should contain dd elements for values"
    );
  });

  it("should not use p tags for label-value display in Problem/Approach sections", () => {
    const problemApproachSection = source.match(
      /<div className="mt-7 grid gap-6 md:grid-cols-2">[\s\S]*?<\/div>\s*<\/div>/
    );

    if (problemApproachSection) {
      const sectionContent = problemApproachSection[0];
      const hasLabelPTag = /<p className="text-xs uppercase/.test(
        sectionContent
      );
      assert.strictEqual(
        hasLabelPTag,
        false,
        "Problem/Approach section should not use <p> tags for labels (should use <dt> instead)"
      );
    }
  });
});
