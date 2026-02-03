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
  readonly searchButton: Locator
  readonly mobileMenuButton: Locator
  readonly mobileNav: Locator

  constructor(page: Page) {
    this.page = page
    this.skipLink = page.getByRole('link', { name: 'Skip to main content' })
    this.topNav = page.locator('header nav')
    this.mainContent = page.locator('#main-content')
    this.footer = page.locator('footer')
    this.searchButton = page.getByRole('button', { name: /search|command k/i })
    this.mobileMenuButton = page.getByRole('button', { name: 'Open menu' })
    this.mobileNav = page.getByRole('dialog', { name: 'Navigation menu' })
  }

  async goto(path: string = '/') {
    await this.page.goto(path, { waitUntil: 'domcontentloaded', timeout: 60000 })
  }

  async openCommandPalette() {
    await this.page.waitForSelector('html[data-command-palette-ready="true"]')
    // Use keyboard shortcut
    await this.page.keyboard.press('Meta+k')
    // Wait for the dialog to be visible
    await expect(this.page.getByRole('dialog')).toBeVisible()
  }

  async openCommandPaletteByClick() {
    await this.page.waitForSelector('html[data-command-palette-ready="true"]')
    await this.searchButton.first().click()
    await expect(this.page.getByRole('dialog')).toBeVisible()
  }

  async closeCommandPalette() {
    await this.page.keyboard.press('Escape')
    await expect(this.page.getByRole('dialog')).not.toBeVisible()
  }

  async openMobileNav() {
    await this.page.waitForSelector('html[data-command-palette-ready="true"]')
    await this.mobileMenuButton.click()
    await expect(this.mobileNav).toBeVisible()
  }

  async closeMobileNav() {
    const closeButton = this.page.getByRole('button', { name: 'Close menu' })
    await closeButton.click()
    await expect(this.mobileNav).not.toBeVisible()
  }

  async navigateViaTopNav(linkText: string) {
    await this.topNav.getByRole('link', { name: linkText }).click()
  }

  async navigateViaMobileNav(linkText: string) {
    await this.mobileNav.getByRole('link', { name: linkText }).click()
  }

  async useSkipLink() {
    // Focus the skip link (it's sr-only until focused)
    await this.skipLink.focus()
    await this.skipLink.click()
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded')
  }
}
