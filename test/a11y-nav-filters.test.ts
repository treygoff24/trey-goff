import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const projectRoot = join(__dirname, "..")

describe("A11y: Navigation labels and filter states", () => {
  describe("A10: Footer nav regions have unique aria-labels", () => {
    it("footer quick nav (line 57) should have aria-label", () => {
      const filePath = join(projectRoot, "components/layout/Footer.tsx")
      const content = readFileSync(filePath, "utf-8")

      const hasQuickNavLabel = /<nav[^>]+aria-label="[^"]*[Nn]avigation[^"]*"/.test(content)
      assert.ok(
        hasQuickNavLabel,
        "Footer quick nav element should have aria-label with \"navigation\""
      )
    })

    it("footer links nav (line 113) should have aria-label", () => {
      const filePath = join(projectRoot, "components/layout/Footer.tsx")
      const content = readFileSync(filePath, "utf-8")

      const navMatches = content.match(/<nav[^>]+aria-label="[^"]+"/g) || []
      assert.ok(
        navMatches.length >= 2,
        "Footer should have at least 2 nav elements with aria-label"
      )
    })

    it("footer nav elements should have distinct aria-labels", () => {
      const filePath = join(projectRoot, "components/layout/Footer.tsx")
      const content = readFileSync(filePath, "utf-8")

      const navLabels = content.match(/<nav[^>]+aria-label="([^"]+)"/g) || []
      const labels = navLabels.map(match => {
        const labelMatch = match.match(/aria-label="([^"]+)"/)
        return labelMatch ? labelMatch[1] : ""
      })

      const uniqueLabels = new Set(labels)
      assert.ok(
        uniqueLabels.size === labels.length && labels.length >= 2,
        "All footer nav elements should have unique aria-labels"
      )
    })
  })

  describe("A11: TopNav has aria-label", () => {
    it("main nav element (line 26) should have aria-label", () => {
      const filePath = join(projectRoot, "components/layout/TopNav.tsx")
      const content = readFileSync(filePath, "utf-8")

      const hasNavLabel = /<nav[^>]+aria-label="[^"]*[Mm]ain[^"]*navigation[^"]*"/.test(content)
      assert.ok(
        hasNavLabel,
        "Main nav element should have aria-label with \"main navigation\""
      )
    })
  })

  describe("A12: Library filter buttons have aria-pressed", () => {
    it("status filter buttons should have aria-pressed", () => {
      const filePath = join(projectRoot, "components/library/LibraryFilters.tsx")
      const content = readFileSync(filePath, "utf-8")

      const lines = content.split("\n")
      const statusStart = lines.findIndex(l => l.includes("Status filter"))
      const statusEnd = lines.findIndex((l, i) => i > statusStart && l.includes("Topic filter"))
      const statusSection = lines.slice(statusStart, statusEnd).join("\n")

      const hasAriaPressed = /aria-pressed=/.test(statusSection)
      assert.ok(
        hasAriaPressed,
        "Status filter buttons should have aria-pressed attribute"
      )
    })

    it("topic filter buttons should have aria-pressed", () => {
      const filePath = join(projectRoot, "components/library/LibraryFilters.tsx")
      const content = readFileSync(filePath, "utf-8")

      const lines = content.split("\n")
      const topicStart = lines.findIndex(l => l.includes("Topic filter"))
      const topicEnd = lines.findIndex((l, i) => i > topicStart && l.includes("Sort"))
      const topicSection = lines.slice(topicStart, topicEnd).join("\n")

      const hasAriaPressed = /aria-pressed=/.test(topicSection)
      assert.ok(
        hasAriaPressed,
        "Topic filter buttons should have aria-pressed attribute"
      )
    })

    it("aria-pressed should reflect active state", () => {
      const filePath = join(projectRoot, "components/library/LibraryFilters.tsx")
      const content = readFileSync(filePath, "utf-8")

      const hasConditionalPressed = /aria-pressed=\{[^}]*===/.test(content)
      assert.ok(
        hasConditionalPressed,
        "aria-pressed should be conditional based on filter state"
      )
    })
  })

  describe("A13: Graph filter toggles have aria-pressed", () => {
    it("graph filter toggles should have aria-pressed", () => {
      const filePath = join(projectRoot, "components/graph/GraphClient.tsx")
      const content = readFileSync(filePath, "utf-8")

      const lines = content.split("\n")
      const filterStart = lines.findIndex(l => l.includes("Filter controls"))
      const filterEnd = lines.findIndex((l, i) => i > filterStart && l.includes("Graph canvas"))
      const filterSection = lines.slice(filterStart, filterEnd).join("\n")

      const hasAriaPressed = /aria-pressed=/.test(filterSection)
      assert.ok(
        hasAriaPressed,
        "Graph filter toggle buttons should have aria-pressed attribute"
      )
    })

    it("aria-pressed should reflect visible state", () => {
      const filePath = join(projectRoot, "components/graph/GraphClient.tsx")
      const content = readFileSync(filePath, "utf-8")

      const hasConditionalPressed = /aria-pressed=\{visibleTypes\.has/.test(content)
      assert.ok(
        hasConditionalPressed,
        "aria-pressed should be conditional based on visibleTypes state"
      )
    })
  })
})
