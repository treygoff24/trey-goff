import { describe, it } from "node:test";
import assert from "node:assert";
import { promises as fs } from "node:fs";
import path from "node:path";

describe("A11y: SVG icons, quality buttons, loading", () => {
describe("A19: SVG icons missing aria-hidden in TopNav", () => {
it("should have aria-hidden on decorative SVG icons", async () => {
const topNavPath = path.join(
process.cwd(),
"components/layout/TopNav.tsx"
);
const content = await fs.readFile(topNavPath, "utf-8");

// Find SVG elements (search icon at line 74, hamburger icon at line 96)
const svgMatches = content.matchAll(/<svg[^>]*>/g);
const svgElements = Array.from(svgMatches);

assert.ok(
svgElements.length >= 2,
"Expected at least 2 SVG elements in TopNav"
);

// Check that all decorative SVGs have aria-hidden
for (const match of svgElements) {
const svgTag = match[0];
assert.ok(
svgTag.includes('aria-hidden="true"'),
`SVG element should have aria-hidden="true": ${svgTag}`
);
}
});
});

describe("A20: Interactive quality buttons missing group context", () => {
it("should wrap quality buttons in role=group with aria-label", async () => {
const shellPath = path.join(
process.cwd(),
"components/interactive/InteractiveShell.tsx"
);
const content = await fs.readFile(shellPath, "utf-8");

// Find the quality tier selection section (around line 218-236)
// Look for the div containing all four quality buttons
const qualityButtonsPattern = /<div[^>]*className="grid grid-cols-4[^"]*"[^>]*>[\s\S]*?"auto"[\s\S]*?"low"[\s\S]*?"medium"[\s\S]*?"high"[\s\S]*?<\/div>/;
const qualitySection = content.match(qualityButtonsPattern);

assert.ok(qualitySection, "Should find quality tier buttons section");

// Check for role="group" in the quality buttons container
const hasRoleGroup = /role="group"/.test(qualitySection[0]);
assert.ok(
hasRoleGroup,
'Quality buttons container should have role="group"'
);

// Check for aria-label describing the group
const hasAriaLabel = /aria-label="[^"]*[Qq]uality[^"]*"/.test(
qualitySection[0]
);
assert.ok(
hasAriaLabel,
'Quality buttons group should have aria-label describing quality settings'
);
});
});

describe("A21: Duplicate aria-live regions in LoadingSequence", () => {
it("should have only one aria-live region", async () => {
const loadingPath = path.join(
process.cwd(),
"components/interactive/LoadingSequence.tsx"
);
const content = await fs.readFile(loadingPath, "utf-8");

// Count aria-live occurrences
const ariaLiveMatches = content.match(/aria-live="[^"]+"/g);
const count = ariaLiveMatches ? ariaLiveMatches.length : 0;

assert.strictEqual(
count,
1,
`Expected exactly 1 aria-live region, found ${count}. Duplicate aria-live regions can confuse screen readers.`
);
});
});
});
