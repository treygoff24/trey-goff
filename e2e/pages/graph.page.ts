import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './base.page'

/**
 * Page object model for the Knowledge Graph page.
 */
export class GraphPage extends BasePage {
  readonly pageTitle: Locator
  readonly graphCanvas: Locator
  readonly filterButtons: Locator
  readonly nodeInspector: Locator
  readonly legend: Locator
  readonly navigationHelp: Locator
  readonly statsText: Locator
  readonly loadingIndicator: Locator

  constructor(page: Page) {
    super(page)
    this.pageTitle = page.getByRole('heading', { name: /Knowledge Graph/i, level: 1 })
    this.graphCanvas = page.locator('canvas')
    this.filterButtons = page.locator('button').filter({ hasText: /Essays|Notes|Books|Tags|Ideas/ })
    this.nodeInspector = page.locator('text=Select a node').locator('..').locator('..')
    this.legend = page.locator('text=Legend').locator('..')
    this.navigationHelp = page.locator('text=Navigation').locator('..')
    this.statsText = page.locator('text=/\\d+ nodes/')
    this.loadingIndicator = page.getByText('Loading graph...')
  }

  async gotoGraphPage() {
    await this.goto('/graph')
  }

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible()
  }

  async expectGraphRendered() {
    // Wait for loading to complete
    await expect(this.loadingIndicator).not.toBeVisible({ timeout: 15000 })
    // Canvas should be visible
    await expect(this.graphCanvas).toBeVisible()
  }

  async toggleFilter(filterName: 'Essays' | 'Notes' | 'Books' | 'Tags' | 'Ideas') {
    await this.page.getByRole('button', { name: new RegExp(filterName) }).click()
  }

  async expectFilterActive(filterName: string) {
    const button = this.page.getByRole('button', { name: new RegExp(filterName) })
    // Active filters have different styling - not dimmed
    await expect(button).not.toHaveClass(/opacity-50/)
  }

  async expectFilterInactive(filterName: string) {
    const button = this.page.getByRole('button', { name: new RegExp(filterName) })
    // Inactive filters are dimmed
    await expect(button).toHaveClass(/opacity-50/)
  }

  async getNodeCount(): Promise<number> {
    const text = await this.statsText.textContent()
    const match = text?.match(/(\d+) nodes/)
    return match?.[1] ? parseInt(match[1], 10) : 0
  }

  async getConnectionCount(): Promise<number> {
    const text = await this.page.locator('text=/\\d+ connections/').textContent()
    const match = text?.match(/(\d+) connections/)
    return match?.[1] ? parseInt(match[1], 10) : 0
  }

  async clickOnCanvas(x: number, y: number) {
    await this.graphCanvas.click({ position: { x, y } })
  }

  async expectNodeInspectorEmpty() {
    await expect(this.page.getByText('Click a node to view details')).toBeVisible()
  }

  async expectNodeInspectorHasContent() {
    // When a node is selected, the inspector shows its details
    // Should not show the empty state message
    await expect(this.page.getByText('Select a node to see details')).not.toBeVisible()
  }

  async expectLegendVisible() {
    await expect(this.legend).toBeVisible()
    // Legend should show all node types
    await expect(this.page.getByText('Essays')).toBeVisible()
    await expect(this.page.getByText('Notes')).toBeVisible()
    await expect(this.page.getByText('Books')).toBeVisible()
    await expect(this.page.getByText('Tags')).toBeVisible()
  }

  async expectNavigationHelpVisible() {
    await expect(this.navigationHelp).toBeVisible()
    await expect(this.page.getByText('Click:')).toBeVisible()
    await expect(this.page.getByText('Drag:')).toBeVisible()
    await expect(this.page.getByText('Scroll:')).toBeVisible()
  }
}
