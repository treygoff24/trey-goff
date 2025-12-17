import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './base.page'

/**
 * Page object model for the Writing page and essay detail pages.
 */
export class WritingPage extends BasePage {
  readonly pageTitle: Locator
  readonly essayCards: Locator
  readonly emptyState: Locator

  constructor(page: Page) {
    super(page)
    this.pageTitle = page.getByRole('heading', { name: 'Writing', level: 1 })
    this.essayCards = page.locator('article')
    this.emptyState = page.getByText('Essays coming soon.')
  }

  async gotoWritingPage() {
    await this.goto('/writing')
  }

  async clickEssay(title: string) {
    await this.page.getByRole('link', { name: title }).click()
  }

  async clickFirstEssay() {
    const firstLink = this.essayCards.first().getByRole('link')
    await firstLink.click()
  }

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible()
  }

  async expectEssaysDisplayed(minCount: number = 1) {
    const count = await this.essayCards.count()
    expect(count).toBeGreaterThanOrEqual(minCount)
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible()
  }

  async getEssayTitles(): Promise<string[]> {
    const links = await this.essayCards.locator('a').all()
    return Promise.all(links.map((link) => link.textContent() as Promise<string>))
  }
}

/**
 * Page object model for individual essay detail pages.
 */
export class EssayDetailPage extends BasePage {
  readonly articleTitle: Locator
  readonly articleSummary: Locator
  readonly articleContent: Locator
  readonly tableOfContents: Locator
  readonly mobileTocButton: Locator
  readonly mobileTocDropdown: Locator
  readonly tags: Locator
  readonly readingTime: Locator
  readonly wordCount: Locator
  readonly publishDate: Locator
  readonly newsletterCta: Locator
  readonly evergreenBadge: Locator

  constructor(page: Page) {
    super(page)
    this.articleTitle = page.locator('article h1')
    this.articleSummary = page.locator('article header p').first()
    this.articleContent = page.locator('#essay-content')
    this.tableOfContents = page.getByRole('navigation', { name: 'Table of contents' })
    this.mobileTocButton = page.getByRole('button', { name: 'On this page' })
    this.mobileTocDropdown = page.locator('.lg\\:hidden ul')
    this.tags = page.locator('article header').getByRole('link', { name: /#\w+/i })
    this.readingTime = page.getByText(/\d+ min read/)
    this.wordCount = page.getByText(/\d+,?\d* words/)
    this.publishDate = page.locator('article time')
    this.newsletterCta = page.locator('.mt-16').filter({ hasText: 'Enjoyed this essay?' })
    this.evergreenBadge = page.getByText('Evergreen')
  }

  async gotoEssay(slug: string) {
    await this.goto(`/writing/${slug}`)
  }

  async expectArticleLoaded() {
    await expect(this.articleTitle).toBeVisible()
    await expect(this.articleContent).toBeVisible()
  }

  async expectTableOfContentsVisible() {
    await expect(this.tableOfContents).toBeVisible()
  }

  async expectMobileTocVisible() {
    await expect(this.mobileTocButton).toBeVisible()
  }

  async toggleMobileToc() {
    await this.mobileTocButton.click()
  }

  async expectMobileTocDropdownVisible() {
    await expect(this.mobileTocDropdown).toBeVisible()
  }

  async clickTocLink(text: string) {
    await this.tableOfContents.getByRole('link', { name: text }).click()
  }

  async clickMobileTocLink(text: string) {
    await this.mobileTocDropdown.getByRole('link', { name: text }).click()
  }

  async expectNewsletterCtaVisible() {
    await expect(this.newsletterCta).toBeVisible()
  }

  async getHeadings(): Promise<string[]> {
    const headings = await this.articleContent.locator('h1, h2, h3').all()
    return Promise.all(headings.map((h) => h.textContent() as Promise<string>))
  }

  async expectTagsVisible(minCount: number = 1) {
    const tagElements = this.page.locator('article header a[href*="tag="]')
    const count = await tagElements.count()
    expect(count).toBeGreaterThanOrEqual(minCount)
  }
}
