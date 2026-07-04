import { type Locator, type Page, expect } from '@playwright/test'
import { BasePage } from './base.page'

/** Page object model for the Aurora Library page. */
export class LibraryPage extends BasePage {
  readonly pageTitle: Locator
  readonly constellationCanvas: Locator
  readonly lensSwitcher: Locator
  readonly categoryButtons: Locator
  readonly bookDetailDialog: Locator

  constructor(page: Page) {
    super(page)
    this.pageTitle = page.getByRole('heading', {
      name: /Everything I've read, and four ways to wander it\./,
      level: 1,
    })
    this.constellationCanvas = page.getByRole('img', {
      name: 'Constellation of books linked by shared topics',
    })
    this.lensSwitcher = page
      .locator('.fixed')
      .filter({ has: page.getByRole('button', { name: 'Constellation' }) })
    this.categoryButtons = page.getByRole('button').filter({ hasText: /· \d+/ })
    this.bookDetailDialog = page.getByRole('dialog')
  }

  async gotoLibraryPage() {
    await this.goto('/library')
  }

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible()
    await expect(this.page.getByTestId('aurora-library')).toHaveAttribute(
      'data-aurora-library-ready',
      'true',
      { timeout: 60000 },
    )
    const stats = [this.page.getByText('334 books'), this.page.getByText('12 shelves')]
    if ((this.page.viewportSize()?.width ?? 1024) < 640) {
      for (const stat of stats) {
        await expect(stat).toBeAttached()
        await expect(stat).toBeHidden()
      }
      return
    }

    for (const stat of stats) {
      await expect(stat).toBeVisible()
    }
  }

  async switchLens(name: 'Constellation' | 'Shelf' | 'River' | 'Index') {
    const key = name.toLowerCase()
    const button = this.page.getByTestId(`library-lens-${key}`)
    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'true')
  }

  async filterByCategory(category: 'All' | 'Sci-Fi' | 'Economics' | 'Politics' | 'Fantasy') {
    const ids = {
      All: 'all',
      'Sci-Fi': 'scifi',
      Economics: 'econ',
      Politics: 'politics',
      Fantasy: 'fantasy',
    } as const
    const button = this.page.getByTestId(`library-category-${ids[category]}`)
    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'true')
  }

  async clickFirstShelfBook() {
    await this.switchLens('Shelf')
    await this.page.locator('[data-testid^="library-shelf-book-"]').first().click()
  }

  async expectBookDetailVisible() {
    await expect(this.bookDetailDialog).toBeVisible()
    await expect(this.bookDetailDialog.getByRole('heading', { level: 2 })).toBeVisible()
  }

  async closeBookDetail() {
    await this.page.getByRole('button', { name: 'Close', exact: true }).click()
    await expect(this.bookDetailDialog).not.toBeVisible()
  }
}
