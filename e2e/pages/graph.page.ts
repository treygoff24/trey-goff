import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './base.page'

/**
 * Page object model for the Knowledge Graph page.
 */
export type GraphNodeTypeFilterLabel =
  | 'Essays'
  | 'Notes'
  | 'Books'
  | 'Tags'
  | 'Ideas'
  | 'Transmissions'

export class GraphPage extends BasePage {
  readonly pageTitle: Locator
  readonly graphCanvas: Locator
  /** Filter chips above the canvas (not mobile lens node list buttons). */
  readonly nodeTypeFilterGroup: Locator
  readonly filterButtons: Locator
  readonly nodeInspector: Locator
  readonly legend: Locator
  readonly legendItems: Locator
  readonly navigationHelp: Locator
  readonly statsText: Locator
  readonly loadingIndicator: Locator

  constructor(page: Page) {
    super(page)
    this.pageTitle = page.getByRole('heading', { name: /Knowledge Graph/i, level: 1 })
    this.graphCanvas = page.locator('canvas.sigma-mouse')
    this.nodeTypeFilterGroup = page.getByRole('group', { name: 'Visible graph node types' })
    this.filterButtons = this.nodeTypeFilterGroup.getByRole('button')
    this.nodeInspector = page.locator('text=Select a node').locator('..').locator('..')
    this.legend = this.mainContent.getByRole('heading', { name: 'Legend' }).locator('..')
    this.legendItems = this.legend.locator('.text-text-2')
    this.navigationHelp = this.mainContent
      .getByRole('heading', { name: 'Navigation' })
      .locator('..')
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

  filterChip(label: GraphNodeTypeFilterLabel): Locator {
    return this.nodeTypeFilterGroup.getByRole('button', {
      name: new RegExp(`^${label} \\(\\d+\\)$`),
    })
  }

  async toggleFilter(filterName: GraphNodeTypeFilterLabel) {
    await this.filterChip(filterName).click()
  }

  async expectFilterActive(filterName: GraphNodeTypeFilterLabel) {
    const button = this.filterChip(filterName)
    // Active filters have different styling - not dimmed
    await expect(button).not.toHaveClass(/opacity-50/)
  }

  async expectFilterInactive(filterName: GraphNodeTypeFilterLabel) {
    const button = this.filterChip(filterName)
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
    await expect(this.legendItems.getByText('Essays', { exact: true })).toBeVisible()
    await expect(this.legendItems.getByText('Notes', { exact: true })).toBeVisible()
    await expect(this.legendItems.getByText('Books', { exact: true })).toBeVisible()
    await expect(this.legendItems.getByText('Tags', { exact: true })).toBeVisible()
    await expect(this.legendItems.getByText('Ideas', { exact: true })).toBeVisible()
    await expect(this.legendItems.getByText('Transmissions', { exact: true })).toBeVisible()
  }

  async expectNavigationHelpVisible() {
    await expect(this.navigationHelp).toBeVisible()
    await expect(this.navigationHelp.getByText('Click:')).toBeVisible()
    await expect(this.navigationHelp.getByText('Drag:')).toBeVisible()
    await expect(this.navigationHelp.getByText('Scroll:')).toBeVisible()
  }
}
