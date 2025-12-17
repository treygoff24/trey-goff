import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './base.page'

/**
 * Page object model for the Subscribe page and newsletter forms.
 */
export class SubscribePage extends BasePage {
  readonly emailInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator
  readonly successMessage: Locator

  constructor(page: Page) {
    super(page)
    this.emailInput = page.getByRole('textbox', { name: /email/i })
    this.submitButton = page.getByRole('button', { name: /subscribe/i })
    this.errorMessage = page.getByRole('alert')
    this.successMessage = page.locator('.text-success')
  }

  async gotoSubscribePage() {
    await this.goto('/subscribe')
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email)
  }

  async submit() {
    await this.submitButton.click()
  }

  async submitForm(email: string) {
    await this.fillEmail(email)
    await this.submit()
  }

  async expectLoadingState() {
    await expect(this.submitButton).toHaveText(/subscribing/i)
    await expect(this.submitButton).toBeDisabled()
    await expect(this.emailInput).toBeDisabled()
  }

  async expectSuccessState() {
    await expect(this.successMessage).toBeVisible()
  }

  async expectErrorState(message?: string) {
    await expect(this.errorMessage).toBeVisible()
    if (message) {
      await expect(this.errorMessage).toContainText(message)
    }
  }

  async expectFormVisible() {
    await expect(this.emailInput).toBeVisible()
    await expect(this.submitButton).toBeVisible()
    await expect(this.submitButton).toBeEnabled()
  }

  async expectValidationError() {
    // HTML5 validation shows native browser error
    const isValid = await this.emailInput.evaluate((el: HTMLInputElement) => el.validity.valid)
    expect(isValid).toBe(false)
  }

  /**
   * Get the compact subscribe form found in essay footers.
   */
  getCompactForm() {
    return {
      emailInput: this.page.locator('.mt-16 input[type="email"]'),
      submitButton: this.page.locator('.mt-16 button[type="submit"]'),
    }
  }
}
