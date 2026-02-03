import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './base.page'

/**
 * Page object model for the Subscribe page and newsletter forms.
 */
export class SubscribePage extends BasePage {
  readonly form: Locator
  readonly emailInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator
  readonly successMessage: Locator

  constructor(page: Page) {
    super(page)
    this.form = page.getByTestId('subscribe-form')
    this.emailInput = this.form.getByRole('textbox', { name: /email/i })
    this.submitButton = this.form.getByRole('button', { name: /subscribe/i })
    this.errorMessage = this.form.getByRole('alert')
    this.successMessage = page.getByTestId('subscribe-success')
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
    const loadingButton = this.page.getByRole('button', { name: /subscribing/i })
    const loadingInput = this.page.getByRole('textbox', { name: /email/i })

    await expect(loadingButton).toBeVisible()
    await expect(loadingButton).toBeDisabled()
    await expect(loadingInput).toBeDisabled()
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
    await expect(this.form).toBeVisible()
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
    const cta = this.page
      .getByRole('heading', { name: 'Enjoyed this essay?' })
      .locator('..')
    return {
      emailInput: cta.getByTestId('subscribe-form').locator('input[type="email"]'),
      submitButton: cta.getByTestId('subscribe-form').locator('button[type="submit"]'),
      successMessage: cta.getByTestId('subscribe-success'),
    }
  }
}
