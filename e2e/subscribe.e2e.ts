import { test, expect } from '@playwright/test'
import { SubscribePage } from './pages'

test.describe('Newsletter Subscribe Form - Subscribe Page', () => {
  let subscribePage: SubscribePage

  test.beforeEach(async ({ page }) => {
    subscribePage = new SubscribePage(page)
    await subscribePage.gotoSubscribePage()
  })

  test.describe('Form display', () => {
    test('should display email input and submit button', async () => {
      await subscribePage.expectFormVisible()
    })

    test('should have proper email input attributes', async () => {
      await expect(subscribePage.emailInput).toHaveAttribute('type', 'email')
      await expect(subscribePage.emailInput).toHaveAttribute('placeholder', 'you@example.com')
      await expect(subscribePage.emailInput).toHaveAttribute('required', '')
    })

    test('should have accessible email input label', async () => {
      await expect(subscribePage.emailInput).toHaveAttribute('aria-label', 'Email address')
    })
  })

  test.describe('Email validation', () => {
    test('should require email field', async ({ page }) => {
      // Try to submit empty form
      await subscribePage.submit()

      // Form should not submit (HTML5 validation)
      // We stay on the same page
      await expect(page).toHaveURL('/subscribe')
    })

    test('should validate email format', async ({ page }) => {
      await subscribePage.fillEmail('invalid-email')

      // Browser's built-in validation should prevent submission
      await subscribePage.submit()

      // Should still be on subscribe page (form didn't submit)
      await expect(page).toHaveURL('/subscribe')
    })

    test('should accept valid email format', async () => {
      await subscribePage.fillEmail('test@example.com')

      // No validation error should be present
      const isValid = await subscribePage.emailInput.evaluate(
        (el: HTMLInputElement) => el.validity.valid
      )
      expect(isValid).toBe(true)
    })
  })

  test.describe('Form submission', () => {
    test('should show loading state during submission', async ({ page }) => {
      // Hold the API response so we can assert loading state deterministically
      let releaseResponse: (() => void) | null = null
      const pendingResponse = new Promise<void>((resolve) => {
        releaseResponse = resolve
      })

      await page.route('/api/subscribe', async (route) => {
        await pendingResponse
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Success!' }),
        })
      })

      await subscribePage.fillEmail('test@example.com')
      await subscribePage.submit()

      // Check loading state
      await subscribePage.expectLoadingState()
      releaseResponse?.()
    })

    test('should show success state after successful submission', async ({ page }) => {
      // Mock successful API response
      await page.route('/api/subscribe', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Success! Check your inbox.' }),
        })
      })

      await subscribePage.submitForm('test@example.com')
      await subscribePage.expectSuccessState()
    })

    test('should clear email input after successful submission', async ({ page }) => {
      // Mock successful API response
      await page.route('/api/subscribe', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Success!' }),
        })
      })

      await subscribePage.submitForm('test@example.com')

      // Success state replaces the form, so input should not be visible
      await expect(subscribePage.emailInput).not.toBeVisible()
    })
  })

  test.describe('Error handling', () => {
    test('should show error message on API error', async ({ page }) => {
      // Mock error API response
      await page.route('/api/subscribe', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid email address.' }),
        })
      })

      await subscribePage.submitForm('test@example.com')
      await subscribePage.expectErrorState('Invalid email address.')
    })

    test('should show error for already subscribed email', async ({ page }) => {
      // Mock already subscribed response
      await page.route('/api/subscribe', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'You are already subscribed.' }),
        })
      })

      await subscribePage.submitForm('existing@example.com')
      await subscribePage.expectErrorState('already subscribed')
    })

    test('should show generic error on network failure', async ({ page }) => {
      // Mock network failure
      await page.route('/api/subscribe', async (route) => {
        await route.abort('failed')
      })

      await subscribePage.submitForm('test@example.com')
      await subscribePage.expectErrorState('Something went wrong')
    })

    test('should keep form visible after error', async ({ page }) => {
      // Mock error response
      await page.route('/api/subscribe', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' }),
        })
      })

      await subscribePage.submitForm('test@example.com')

      // Form should still be visible for retry
      await expect(subscribePage.emailInput).toBeVisible()
      await expect(subscribePage.submitButton).toBeEnabled()
    })
  })
})

test.describe('Newsletter Subscribe Form - Essay Footer', () => {
  test.beforeEach(async ({ page }) => {
    // We need an actual essay to test. Let's go to writing first to find one.
    await page.goto('/writing', { waitUntil: 'domcontentloaded' })
  })

  test('should display newsletter CTA at bottom of essays', async ({ page }) => {
    const subscribePage = new SubscribePage(page)
    // Click on first essay if available
    const essayLinks = page.locator('article a')
    const count = await essayLinks.count()

    if (count > 0) {
      await essayLinks.first().click()
      await expect(page.locator('article h1')).toBeVisible({ timeout: 15000 })

      // Newsletter CTA should be visible
      await expect(
        page.getByRole('heading', { name: 'Enjoyed this essay?' })
      ).toBeVisible()
    } else {
      // Skip test if no essays available
      test.skip()
    }
  })

  test('should have compact subscribe form in essay footer', async ({ page }) => {
    const subscribePage = new SubscribePage(page)
    const essayLinks = page.locator('article a')
    const count = await essayLinks.count()

    if (count > 0) {
      await essayLinks.first().click()
      await expect(page.locator('article h1')).toBeVisible({ timeout: 15000 })

      // Compact form should have email input and subscribe button
      const compactForm = subscribePage.getCompactForm()
      await expect(compactForm.emailInput).toBeVisible()
      await expect(compactForm.submitButton).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('compact form should submit successfully', async ({ page }) => {
    const subscribePage = new SubscribePage(page)
    const essayLinks = page.locator('article a')
    const count = await essayLinks.count()

    if (count > 0) {
      await essayLinks.first().click()
      await expect(page.locator('article h1')).toBeVisible({ timeout: 15000 })

      // Mock successful API response
      await page.route('/api/subscribe', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Success!' }),
        })
      })

      const compactForm = subscribePage.getCompactForm()
      await compactForm.emailInput.fill('test@example.com')
      await compactForm.submitButton.click()

      // Success message should appear
      await expect(compactForm.successMessage).toBeVisible()
    } else {
      test.skip()
    }
  })
})

test.describe('Newsletter Subscribe Form - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should be usable on mobile viewport', async ({ page }) => {
    const subscribePage = new SubscribePage(page)
    await subscribePage.gotoSubscribePage()

    // Form should be visible and functional
    await subscribePage.expectFormVisible()

    // Mock API
    await page.route('/api/subscribe', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Success!' }),
      })
    })

    await subscribePage.submitForm('mobile@example.com')
    await subscribePage.expectSuccessState()
  })
})
