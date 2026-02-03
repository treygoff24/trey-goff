import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './base.page'

/**
 * Page object model for the Command Palette (Cmd+K search).
 */
export class CommandPalettePage extends BasePage {
  readonly dialog: Locator
  readonly searchInput: Locator
  readonly commandList: Locator
  readonly emptyState: Locator
  readonly navigationGroup: Locator
  readonly actionsGroup: Locator
  readonly loadingIndicator: Locator

  constructor(page: Page) {
    super(page)
    this.dialog = page.getByRole('dialog')
    // cmdk uses a custom input without standard role, use placeholder selector
    this.searchInput = page.getByPlaceholder('Search everything...')
    this.commandList = page.locator('[cmdk-list]')
    this.emptyState = page.getByText('No results found')
    this.navigationGroup = page.getByRole('group', { name: 'Navigation' })
    this.actionsGroup = page.getByRole('group', { name: 'Actions' })
    this.loadingIndicator = page.getByText('Loading search...')
  }

  async openCommandPalette() {
    await super.openCommandPalette()
    await this.waitForSearchIdle()
  }

  async openCommandPaletteByClick() {
    await super.openCommandPaletteByClick()
    await this.waitForSearchIdle()
  }

  async waitForSearchIdle() {
    // Ensure the list is rendered before checking loading state
    await expect(this.commandList).toBeVisible()
    // If loading appears, wait for it to finish; otherwise continue
    const loadingVisible = await this.loadingIndicator
      .isVisible({ timeout: 1000 })
      .catch(() => false)
    if (loadingVisible) {
      await expect(this.loadingIndicator).toBeHidden({ timeout: 10000 })
    }
  }

  async search(query: string) {
    await this.searchInput.fill(query)
    // Wait for search results to update
    await this.page.waitForTimeout(100)
  }

  async clearSearch() {
    await this.searchInput.clear()
  }

  async selectResult(text: string, { exact = false }: { exact?: boolean } = {}) {
    await expect
      .poll(async () => this.commandList.getByRole('option').count(), {
        timeout: 10000,
      })
      .toBeGreaterThan(0)

    const name = exact
      ? new RegExp(`^${escapeRegExp(text)}(?:\\s+G\\s+\\w+)?$`)
      : text
    const item = this.commandList.getByRole('option', { name }).first()
    await expect(item).toBeVisible()
    await item.click()
  }

  async selectResultExact(text: string) {
    await this.selectResult(text, { exact: true })
  }

  async selectResultByKeyboard(text: string) {
    // Use arrow keys to navigate to the item, then press Enter
    const items = await this.commandList.getByRole('option').all()
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item) continue
      const itemText = await item.textContent()
      if (itemText?.includes(text)) {
        for (let j = 0; j < i; j++) {
          await this.page.keyboard.press('ArrowDown')
        }
        await this.page.keyboard.press('Enter')
        return
      }
    }
    throw new Error(`Could not find result matching: ${text}`)
  }

  async getVisibleResults(): Promise<string[]> {
    const items = await this.commandList.getByRole('option').all()
    return Promise.all(items.map((item) => item.textContent() as Promise<string>))
  }

  async expectNavigationItemsVisible() {
    await expect(this.navigationGroup).toBeVisible()
    await expect(this.commandList.getByRole('option', { name: 'Home' })).toBeVisible()
    await expect(this.commandList.getByRole('option', { name: 'Writing' })).toBeVisible()
    await expect(this.commandList.getByRole('option', { name: 'Notes' })).toBeVisible()
    await expect(this.commandList.getByRole('option', { name: 'Library' })).toBeVisible()
    await expect(this.commandList.getByRole('option', { name: 'Projects' })).toBeVisible()
    await expect(this.commandList.getByRole('option', { name: 'About' })).toBeVisible()
    await expect(this.commandList.getByRole('option', { name: 'Knowledge Graph' })).toBeVisible()
  }

  async expectActionsVisible() {
    await expect(this.actionsGroup).toBeVisible()
    await expect(this.commandList.getByRole('option', { name: 'Copy current URL' })).toBeVisible()
    await expect(this.commandList.getByRole('option', { name: 'RSS Feed' })).toBeVisible()
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible()
  }

  async expectSearchResults(minCount: number) {
    const results = await this.getVisibleResults()
    expect(results.length).toBeGreaterThanOrEqual(minCount)
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
