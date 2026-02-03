import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './base.page'

/**
 * Page object model for the Library page.
 */
export class LibraryPage extends BasePage {
  readonly pageTitle: Locator
  readonly bookGrid: Locator
  readonly bookCards: Locator
  readonly bookCountText: Locator
  readonly statusFilterButtons: Locator
  readonly topicFilterButtons: Locator
  readonly sortSelect: Locator
  readonly bookDetailModal: Locator
  readonly modalCloseButton: Locator
  readonly noResultsMessage: Locator
  readonly statsCards: Locator

  constructor(page: Page) {
    super(page)
    this.pageTitle = page.getByRole('heading', { name: 'Library', level: 1 })
    this.bookGrid = page.locator('.grid.grid-cols-2')
    this.bookCards = page.locator('[class*="book-card"], article').filter({ has: page.locator('img, svg') })
    this.bookCountText = page.locator('text=/\\d+ books?/')
    this.statusFilterButtons = page.locator('text=Status').locator('..').locator('button')
    this.topicFilterButtons = page.locator('text=Topic').locator('..').locator('button')
    this.sortSelect = page.getByLabel('Sort by')
    this.bookDetailModal = page.locator('.fixed.inset-0').filter({ has: page.locator('h2') })
    this.modalCloseButton = page.locator('.fixed button').filter({ has: page.locator('svg') }).first()
    this.noResultsMessage = page.getByText('No books match the current filters.')
    this.statsCards = page.locator('.grid.grid-cols-2.md\\:grid-cols-4 > div')
  }

  async gotoLibraryPage() {
    await this.goto('/library')
  }

  async isClassicMode(): Promise<boolean> {
    const countLabel = this.page.getByTestId('library-book-count')
    return countLabel.isVisible().catch(() => false)
  }

  async is3DMode(): Promise<boolean> {
    const hud = this.page.getByRole('region', { name: 'Library filters' })
    return hud.isVisible().catch(() => false)
  }

  async filterByStatus(status: 'All' | 'Read' | 'Reading' | 'Want to Read' | 'Abandoned') {
    await this.page.getByRole('button', { name: status, exact: true }).click()
  }

  async filterByTopic(topic: string) {
    // Topic filters are in a specific section
    const topicSection = this.page.locator('text=Topic').locator('..')
    await topicSection.getByRole('button', { name: topic, exact: true }).click()
  }

  async clearTopicFilter() {
    const topicSection = this.page.locator('text=Topic').locator('..')
    await topicSection.getByRole('button', { name: 'All', exact: true }).click()
  }

  async sortBy(option: 'Title' | 'Author' | 'Year' | 'Rating' | 'Date Read') {
    const value = option === 'Date Read' ? 'dateRead' : option.toLowerCase()
    await this.sortSelect.selectOption(value)
  }

  async clickFirstBook() {
    const firstCard = this.page.locator('article, [role="button"]').filter({ hasText: /.+/ }).first()
    await firstCard.click()
  }

  async clickBookByTitle(title: string) {
    await this.page.getByText(title).first().click()
  }

  async closeBookDetail() {
    // Click the close button or click outside
    await this.page.keyboard.press('Escape')
    // If that doesn't work, try clicking the backdrop
    const backdrop = this.page.locator('.fixed.inset-0.bg-black\\/80')
    if (await backdrop.isVisible()) {
      await backdrop.click({ position: { x: 10, y: 10 } })
    }
  }

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible()
  }

  async expectBooksDisplayed(minCount: number = 1) {
    // Wait for books to load - BookCard uses div with cursor-pointer class
    // Look for book titles which are in h3 elements inside the book grid
    await this.page.waitForSelector('.grid h3', { timeout: 10000 })
    const bookTitles = this.page.locator('.grid h3')
    const count = await bookTitles.count()
    expect(count).toBeGreaterThanOrEqual(minCount)
  }

  async expectNoResults() {
    await expect(this.noResultsMessage).toBeVisible()
  }

  async expectBookDetailVisible() {
    // The modal should have book title (h2)
    await expect(this.page.locator('.fixed h2')).toBeVisible()
  }

  async expectBookDetailHidden() {
    await expect(this.page.locator('.fixed h2')).not.toBeVisible()
  }

  async getBookCount(): Promise<number> {
    if (!(await this.isClassicMode())) return 0

    const text = await this.page.getByTestId('library-book-count').textContent()
    const match = text?.match(/(\d+)/)
    return match?.[1] ? parseInt(match[1], 10) : 0
  }

  async expectStatsVisible() {
    await expect(this.page.getByText('Total Books')).toBeVisible()
    await expect(this.page.getByText('Books Read')).toBeVisible()
    await expect(this.page.getByText('Avg Rating')).toBeVisible()
  }
}
