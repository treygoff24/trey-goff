import { type Page, type Locator, expect } from '@playwright/test'

/**
 * Base page object model with common functionality shared across all pages.
 */
export class BasePage {
  readonly page: Page
  readonly skipLink: Locator
  readonly topNav: Locator
  readonly mainContent: Locator
  readonly footer: Locator

  constructor(page: Page) {
    this.page = page
    this.skipLink = page.getByRole('link', { name: 'Skip to main content' })
    this.topNav = page.locator('header nav')
    this.mainContent = page.locator('#main-content')
    this.footer = page.locator('footer')
  }

  async goto(path: string = '/') {
    await this.page.goto(path, { waitUntil: 'domcontentloaded', timeout: 60000 })
    if (!path.startsWith('/interactive')) {
      await expect(this.topNav).toBeVisible({ timeout: 60000 })
      await expect(this.page.locator('html')).toHaveAttribute(
        'data-command-palette-ready',
        'true',
        {
          timeout: 60000,
        },
      )
      await expect(this.page.getByRole('banner')).toHaveAttribute('data-top-nav-ready', 'true', {
        timeout: 60000,
      })
    }
  }

  async openCommandPalette() {
    await this.page.keyboard.press('Meta+k')
    await expect(this.page.getByRole('dialog')).toBeVisible()
  }

  async closeCommandPalette() {
    await this.page.keyboard.press('Escape')
    await expect(this.page.getByRole('dialog')).not.toBeVisible()
  }

  async navigateViaTopNav(linkText: string) {
    await this.topNav.getByRole('link', { name: linkText }).click()
  }

  async useSkipLink() {
    await expect(this.skipLink).toBeAttached({ timeout: 60000 })
    // Focus the skip link (it's sr-only until focused)
    await this.skipLink.focus()
    await this.skipLink.evaluate((link: HTMLAnchorElement) => link.click())
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded')
  }
}
