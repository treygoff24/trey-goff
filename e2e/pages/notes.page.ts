import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './base.page'

/**
 * Page object model for the Notes page.
 */
export class NotesPage extends BasePage {
  readonly pageTitle: Locator
  readonly noteCards: Locator
  readonly emptyState: Locator

  constructor(page: Page) {
    super(page)
    this.pageTitle = page.getByRole('heading', { name: 'Notes', level: 1 })
    this.noteCards = page.locator('article')
    this.emptyState = page.getByText('Notes coming soon.')
  }

  async gotoNotesPage() {
    await this.goto('/notes')
  }

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible()
  }

  async expectNotesDisplayed(minCount: number = 1) {
    const count = await this.noteCards.count()
    expect(count).toBeGreaterThanOrEqual(minCount)
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible()
  }

  async getNoteById(slug: string): Promise<Locator> {
    return this.page.locator(`#${slug}`)
  }

  async expectNoteHasAnchorId(slug: string) {
    const note = await this.getNoteById(slug)
    await expect(note).toBeVisible()
  }

  async clickAnchorLink(slug: string) {
    const note = await this.getNoteById(slug)
    const anchorLink = note.getByRole('link', { name: 'Link to this note' })
    await anchorLink.click()
  }

  async expectUrlContainsHash(hash: string) {
    const url = this.page.url()
    expect(url).toContain(`#${hash}`)
  }

  async getNoteTypes(): Promise<string[]> {
    const typeLabels = await this.noteCards.locator('text=/Thought|Dispatch|Link/').all()
    return Promise.all(typeLabels.map((label) => label.textContent() as Promise<string>))
  }

  async expectNoteHasType(noteIndex: number, expectedType: 'Thought' | 'Dispatch' | 'Link') {
    const note = this.noteCards.nth(noteIndex)
    await expect(note.getByText(expectedType)).toBeVisible()
  }

  async expectNoteHasDate(noteIndex: number) {
    const note = this.noteCards.nth(noteIndex)
    // Dates are shown as relative time (e.g., "2 days ago") or formatted
    await expect(note.locator('time')).toBeVisible()
  }

  async expectSourceLinkVisible(noteIndex: number) {
    const note = this.noteCards.nth(noteIndex)
    const sourceLink = note.locator('a[target="_blank"]')
    await expect(sourceLink).toBeVisible()
  }
}
