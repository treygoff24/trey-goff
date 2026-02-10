import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = join(__dirname, "..");

describe("A14: CommandPalette loading aria-live", () => {
  it("loading indicator has aria-live=\"polite\"", () => {
    const filePath = join(projectRoot, "components/command/CommandPalette.tsx");
    const content = readFileSync(filePath, "utf-8");

    const hasAriaLive = /isLoading[\s\S]*?<div[^>]*aria-live="polite"[\s\S]*?Loading search/i.test(content);

    assert.ok(
      hasAriaLive,
      "Loading indicator must have aria-live=\"polite\" for screen reader announcement"
    );
  });
});

describe("A15: Mobile TOC toggle aria-expanded", () => {
  it("toggle button has aria-expanded attribute", () => {
    const filePath = join(projectRoot, "components/writing/TableOfContents.tsx");
    const content = readFileSync(filePath, "utf-8");

    const hasAriaExpanded = /MobileTableOfContents[\s\S]*?<button[\s\S]*?aria-expanded=/i.test(content);

    assert.ok(
      hasAriaExpanded,
      "Mobile TOC toggle button must have aria-expanded attribute"
    );
  });
});

describe("A16: Sort select label association", () => {
  it("select has aria-label or associated label", () => {
    const filePath = join(projectRoot, "components/library/LibraryFilters.tsx");
    const content = readFileSync(filePath, "utf-8");

    const hasAriaLabel = /<select[^>]*aria-label=/i.test(content);
    const hasHtmlFor = /htmlFor="sort-select"[\s\S]{0,300}<select[^>]*id="sort-select"/i.test(content);

    assert.ok(
      hasAriaLabel || hasHtmlFor,
      "Sort select must have aria-label or be associated with a label via htmlFor/id"
    );
  });
});

describe("A17: Easter egg toast announcement", () => {
  it("toast has role=\"alert\" or aria-live", () => {
    const filePath = join(projectRoot, "components/easter-eggs/EasterEggs.tsx");
    const content = readFileSync(filePath, "utf-8");

    const hasAlert = /<div[^>]*fixed[^>]*role="alert"/i.test(content);
    const hasAriaLive = /<div[^>]*fixed[^>]*aria-live=/i.test(content);

    assert.ok(
      hasAlert || hasAriaLive,
      "Toast must have role=\"alert\" or aria-live for screen reader announcement"
    );
  });
});

describe("A18: ContentOverlay focus restoration", () => {
  it("saves focus reference on open", () => {
    const filePath = join(projectRoot, "components/interactive/ContentOverlay.tsx");
    const content = readFileSync(filePath, "utf-8");

    const hasFocusSave = /const\s+\w*[Ff]ocus\w*Ref\w*\s*=\s*useRef/.test(content) ||
                          /previouslyFocusedElement\s*=\s*document\.activeElement/.test(content) ||
                          /\w+Ref\.current\s*=\s*document\.activeElement/.test(content);

    assert.ok(
      hasFocusSave,
      "ContentOverlay must save the previously focused element when opening"
    );
  });

  it("restores focus on close", () => {
    const filePath = join(projectRoot, "components/interactive/ContentOverlay.tsx");
    const content = readFileSync(filePath, "utf-8");

    const hasFocusRestore = /\w+Ref\.current\.focus\(\)/.test(content) ||
                             /\w+Ref\.current\?\.\s*focus\(\)/.test(content) ||
                             /previouslyFocusedElement\?\.\s*focus\(\)/.test(content);

    assert.ok(
      hasFocusRestore,
      "ContentOverlay must restore focus to the previously focused element on close"
    );
  });
});
