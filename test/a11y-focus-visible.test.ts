import { describe, it } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = join(__dirname, "..");

describe("A11y Focus-Visible Styles", () => {
  describe("CodeBlock copy button", () => {
    it("floating copy button should have focus-visible:opacity-100", () => {
      const filePath = join(projectRoot, "components/mdx/CodeBlock.tsx");
      const content = readFileSync(filePath, "utf-8");
      const hasFloatingButton = /className="[^"]*opacity-0[^"]*group-hover:opacity-100[^"]*"/.test(content);
      assert.ok(hasFloatingButton, "Found floating copy button");
      const hasFocusVisible = /className="[^"]*opacity-0[^"]*group-hover:opacity-100[^"]*focus-visible:opacity-100[^"]*"/.test(content);
      assert.ok(hasFocusVisible, "Floating copy button should have focus-visible:opacity-100");
    });
  });

  describe("NoteCard anchor link", () => {
    it("should have focus-visible styles for keyboard users", () => {
      const filePath = join(projectRoot, "components/notes/NoteCard.tsx");
      const content = readFileSync(filePath, "utf-8");
      const hasAnchorLink = /href=\{`#\$\{slug\}`\}/.test(content);
      assert.ok(hasAnchorLink, "Found anchor link");
      const hasFocusVisible = /href=\{`#\$\{slug\}`\}[\s\S]{0,200}className="[^"]*focus-visible:(opacity-100|text-)/.test(content);
      assert.ok(hasFocusVisible, "Anchor link should have focus-visible visibility styles");
    });
  });

  describe("card-interactive class", () => {
    it("should have focus-visible styles in globals.css", () => {
      const filePath = join(projectRoot, "app/globals.css");
      const content = readFileSync(filePath, "utf-8");
      const hasCardInteractive = /\.card-interactive\s*\{/.test(content);
      assert.ok(hasCardInteractive, "Found card-interactive class");
      const hasFocusVisible = /\.card-interactive:focus-visible\s*\{/.test(content);
      assert.ok(hasFocusVisible, "card-interactive should have :focus-visible pseudo-class styles");
    });
  });

  describe("FloatingLibrary Canvas", () => {
    it("should have visible focus indicator", () => {
      const filePath = join(projectRoot, "components/library/floating/FloatingLibrary.tsx");
      const content = readFileSync(filePath, "utf-8");
      const hasCanvas = /<Canvas/.test(content);
      assert.ok(hasCanvas, "Found Canvas component");
      const hasWrapperWithFocus = /(?:tabIndex=\{0\}|focus-visible:)[\s\S]{0,200}<Canvas/.test(content);
      assert.ok(hasWrapperWithFocus, "Canvas wrapper should have focus-visible styles");
    });
  });

  describe("main element tabIndex", () => {
    it("should not have tabIndex={-1} outline flash issue", () => {
      const filePath = join(projectRoot, "app/layout.tsx");
      const content = readFileSync(filePath, "utf-8");
      const mainMatch = content.match(/<main[^>]*>/);
      assert.ok(mainMatch, "Found main element");
      const mainTag = mainMatch[0];
      if (mainTag.includes("tabIndex={-1}")) {
        const hasOutlineNone = mainTag.includes("outline:none") || mainTag.includes("outline-none");
        assert.ok(hasOutlineNone, "main with tabIndex={-1} should have outline-none to prevent flash");
      } else {
        assert.ok(!mainTag.includes("tabIndex"), "main element should not have tabIndex to avoid focus outline flash");
      }
    });
  });
});
