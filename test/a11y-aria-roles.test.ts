import { describe, it } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = join(__dirname, "..");

describe("A11y: aria-hidden, roles, and reduced motion", () => {
  describe("Footer online indicator", () => {
    it("should have aria-hidden on decorative online status dot", () => {
      const filePath = join(projectRoot, "components/layout/Footer.tsx");
      const content = readFileSync(filePath, "utf-8");
      const hasAriaHidden = /animate-ping[\s\S]*aria-hidden="true"/.test(content);
      assert.ok(hasAriaHidden, "Footer online indicator dot should have aria-hidden");
    });
  });

  describe("Callout emoji", () => {
    it("should have aria-hidden on decorative emoji", () => {
      const filePath = join(projectRoot, "components/mdx/Callout.tsx");
      const content = readFileSync(filePath, "utf-8");
      const hasAriaHidden = /<span[^>]*aria-hidden="true"[^>]*>\{styles\.icon\}/.test(content);
      assert.ok(hasAriaHidden, "Callout emoji should have aria-hidden");
    });
  });

  describe("Lucide icons", () => {
    it("BookCard Star icons should have aria-hidden", () => {
      const filePath = join(projectRoot, "components/library/BookCard.tsx");
      const content = readFileSync(filePath, "utf-8");
      const hasAriaHidden = /<Star[^>]*aria-hidden="true"/.test(content);
      assert.ok(hasAriaHidden, "BookCard Star icons should have aria-hidden");
    });

    it("TransmissionCard Radio icon should have aria-hidden", () => {
      const filePath = join(projectRoot, "components/transmissions/TransmissionCard.tsx");
      const content = readFileSync(filePath, "utf-8");
      const hasAriaHidden = /<Radio[^>]*aria-hidden="true"/.test(content);
      assert.ok(hasAriaHidden, "TransmissionCard Radio icon should have aria-hidden");
    });

    it("TransmissionCard ExternalLink icon should have aria-hidden", () => {
      const filePath = join(projectRoot, "components/transmissions/TransmissionCard.tsx");
      const content = readFileSync(filePath, "utf-8");
      const hasAriaHidden = /<ExternalLink[^>]*aria-hidden="true"/.test(content);
      assert.ok(hasAriaHidden, "TransmissionCard ExternalLink icon should have aria-hidden");
    });
  });

  describe("MediaFilter button group", () => {
    it("should have role group with aria-label on button container", () => {
      const filePath = join(projectRoot, "components/media/MediaFilter.tsx");
      const content = readFileSync(filePath, "utf-8");
      const hasRoleGroup = /role="group"/.test(content);
      const hasAriaLabel = /aria-label="[^"]*filter/i.test(content);
      assert.ok(hasRoleGroup, "MediaFilter should have role group on button container");
      assert.ok(hasAriaLabel, "MediaFilter should have aria-label describing the filter group");
    });
  });

  describe("TransmissionCard animations", () => {
    it("should respect prefers-reduced-motion for animations", () => {
      const filePath = join(projectRoot, "components/transmissions/TransmissionCard.tsx");
      const content = readFileSync(filePath, "utf-8");
      const hasReducedMotion =
        /motion-reduce:/.test(content) ||
        /useReducedMotion/.test(content) ||
        /@media \(prefers-reduced-motion: reduce\)/.test(content);

      assert.ok(
        hasReducedMotion,
        "TransmissionCard should handle prefers-reduced-motion for animations"
      );
    });
  });

  describe("BookCard rating visibility", () => {
    it("should have accessible rating without opacity-0 on hover", () => {
      const filePath = join(projectRoot, "components/library/BookCard.tsx");
      const content = readFileSync(filePath, "utf-8");
      const ratingSection = content.match(/rating[\s\S]*?<div[^>]*class="[^"]*opacity-0[^"]*"/);
      assert.ok(!ratingSection, "BookCard rating should not be hidden with opacity-0");
    });
  });
});
