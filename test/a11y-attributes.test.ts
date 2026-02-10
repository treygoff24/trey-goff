import { describe, it } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = join(__dirname, "..");

describe("A11y Attributes", () => {
  describe("A6: AppearanceCard image alt", () => {
    it("should have either empty alt with aria-hidden or unique descriptive alt", () => {
      const filePath = join(projectRoot, "components/media/AppearanceCard.tsx");
      const content = readFileSync(filePath, "utf-8");
      const hasAltAndAriaHidden = /alt=""[^>]*\s+aria-hidden="true"/.test(content) || /aria-hidden="true"[^>]*\s+alt=""/.test(content);
      assert.ok(hasAltAndAriaHidden, "Image should have empty alt with aria-hidden");
    });
  });

  describe("A7: MobileNav aria-expanded", () => {
    it("should have aria-expanded attribute on hamburger button", () => {
      const filePath = join(projectRoot, "components/layout/TopNav.tsx");
      const content = readFileSync(filePath, "utf-8");
      const hasAriaExpanded = /aria-label="Open menu"[^>]*\s+aria-expanded={mobileNavOpen}/.test(content);
      assert.ok(hasAriaExpanded, "Hamburger button should have aria-expanded attribute");
    });
  });

  describe("A8: Active nav link aria-current", () => {
    it("should have aria-current on active nav links", () => {
      const filePath = join(projectRoot, "components/layout/TopNav.tsx");
      const content = readFileSync(filePath, "utf-8");
      const hasAriaCurrent = /aria-current={isActive \? .page. : undefined}/.test(content);
      assert.ok(hasAriaCurrent, "Active nav link should have aria-current attribute");
    });
  });

  describe("A9: RatingStars accessible label", () => {
    it("should have aria-label describing the rating", () => {
      const filePath = join(projectRoot, "components/library/BookCard.tsx");
      const content = readFileSync(filePath, "utf-8");
      const hasAriaLabel = /export function RatingStars[\s\S]*?<div[^>]*aria-label=/.test(content);
      assert.ok(hasAriaLabel, "RatingStars container should have aria-label");
    });
  });
});
