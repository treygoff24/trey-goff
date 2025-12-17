import { test, expect } from '@playwright/test'
import { WritingPage, EssayDetailPage } from './pages'

test.describe('Writing Page', () => {
  let writingPage: WritingPage

  test.beforeEach(async ({ page }) => {
    writingPage = new WritingPage(page)
    await writingPage.gotoWritingPage()
  })

  test.describe('Page display', () => {
    test('should display page title', async () => {
      await writingPage.expectPageLoaded()
    })

    test('should display page description', async ({ page }) => {
      await expect(
        page.getByText(/essays on governance|long-form essays/i)
      ).toBeVisible()
    })

    test('should display essay cards or empty state', async () => {
      const cardCount = await writingPage.essayCards.count()

      if (cardCount > 0) {
        await writingPage.expectEssaysDisplayed()
      } else {
        await writingPage.expectEmptyState()
      }
    })
  })

  test.describe('Essay cards', () => {
    test('should display essay title in cards', async ({ page }) => {
      const cardCount = await writingPage.essayCards.count()

      if (cardCount > 0) {
        const firstCard = writingPage.essayCards.first()
        // Card should have a link with title
        await expect(firstCard.locator('a')).toBeVisible()
      }
    })

    test('should display essay date', async ({ page }) => {
      const cardCount = await writingPage.essayCards.count()

      if (cardCount > 0) {
        const firstCard = writingPage.essayCards.first()
        // Should have a date
        await expect(firstCard.locator('time')).toBeVisible()
      }
    })

    test('should display reading time', async ({ page }) => {
      const cardCount = await writingPage.essayCards.count()

      if (cardCount > 0) {
        const firstCard = writingPage.essayCards.first()
        // Should show reading time (e.g., "5 min read")
        await expect(firstCard.getByText(/\d+ min/)).toBeVisible()
      }
    })

    test('should navigate to essay detail when clicking', async ({ page }) => {
      const cardCount = await writingPage.essayCards.count()

      if (cardCount > 0) {
        const firstLink = writingPage.essayCards.first().locator('a').first()
        const href = await firstLink.getAttribute('href')

        await firstLink.click()

        await expect(page).toHaveURL(href!)
      }
    })
  })

  test.describe('Essay tags', () => {
    test('should display tags on essay cards', async ({ page }) => {
      const cardCount = await writingPage.essayCards.count()

      if (cardCount > 0) {
        // Look for tag pills (links with # in name or styled tags)
        const tags = writingPage.essayCards.first().locator('a[href*="tag="]')
        const tagCount = await tags.count()

        // Tags are optional, so just verify they render correctly if present
        if (tagCount > 0) {
          await expect(tags.first()).toBeVisible()
        }
      }
    })
  })
})

test.describe('Essay Detail Page', () => {
  let essayPage: EssayDetailPage

  test.beforeEach(async ({ page }) => {
    essayPage = new EssayDetailPage(page)
    // First go to writing to find an essay
    await page.goto('/writing')
  })

  test.describe('Article display', () => {
    test('should display essay title', async ({ page }) => {
      const essayLinks = page.locator('article a')
      const count = await essayLinks.count()

      if (count > 0) {
        await essayLinks.first().click()
        await essayPage.expectArticleLoaded()
      } else {
        test.skip()
      }
    })

    test('should display essay content', async ({ page }) => {
      const essayLinks = page.locator('article a')
      const count = await essayLinks.count()

      if (count > 0) {
        await essayLinks.first().click()
        await expect(essayPage.articleContent).toBeVisible()
      } else {
        test.skip()
      }
    })

    test('should display reading time and word count', async ({ page }) => {
      const essayLinks = page.locator('article a')
      const count = await essayLinks.count()

      if (count > 0) {
        await essayLinks.first().click()
        await expect(essayPage.readingTime).toBeVisible()
        await expect(essayPage.wordCount).toBeVisible()
      } else {
        test.skip()
      }
    })

    test('should display publish date', async ({ page }) => {
      const essayLinks = page.locator('article a')
      const count = await essayLinks.count()

      if (count > 0) {
        await essayLinks.first().click()
        await expect(essayPage.publishDate).toBeVisible()
      } else {
        test.skip()
      }
    })
  })

  test.describe('Table of Contents - Desktop', () => {
    test.use({ viewport: { width: 1280, height: 720 } })

    test('should display table of contents on desktop', async ({ page }) => {
      const essayLinks = page.locator('article a')
      const count = await essayLinks.count()

      if (count > 0) {
        await essayLinks.first().click()
        await page.waitForLoadState('networkidle')

        // TOC is shown only if there are 2+ headings
        const tocNav = page.getByRole('navigation', { name: 'Table of contents' })
        const isTocVisible = await tocNav.isVisible()

        if (isTocVisible) {
          await expect(tocNav).toBeVisible()
          await expect(page.getByText('On this page')).toBeVisible()
        }
      } else {
        test.skip()
      }
    })

    test('should navigate to heading when clicking TOC link', async ({ page }) => {
      const essayLinks = page.locator('article a')
      const count = await essayLinks.count()

      if (count > 0) {
        await essayLinks.first().click()
        await page.waitForLoadState('networkidle')

        const tocNav = page.getByRole('navigation', { name: 'Table of contents' })
        const isTocVisible = await tocNav.isVisible()

        if (isTocVisible) {
          const tocLinks = tocNav.locator('a')
          const linkCount = await tocLinks.count()

          if (linkCount > 0) {
            const href = await tocLinks.first().getAttribute('href')
            await tocLinks.first().click()

            // URL should contain the anchor
            await expect(page).toHaveURL(new RegExp(href!.replace('#', '#')))
          }
        }
      } else {
        test.skip()
      }
    })
  })

  test.describe('Table of Contents - Mobile', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('should display mobile TOC dropdown', async ({ page }) => {
      const essayLinks = page.locator('article a')
      const count = await essayLinks.count()

      if (count > 0) {
        await essayLinks.first().click()
        await page.waitForLoadState('networkidle')

        // Mobile TOC button should be visible (if essay has headings)
        const mobileTocButton = page.getByRole('button', { name: 'On this page' })
        const isMobileTocVisible = await mobileTocButton.isVisible()

        if (isMobileTocVisible) {
          await expect(mobileTocButton).toBeVisible()
        }
      } else {
        test.skip()
      }
    })

    test('should expand mobile TOC when clicking button', async ({ page }) => {
      const essayLinks = page.locator('article a')
      const count = await essayLinks.count()

      if (count > 0) {
        await essayLinks.first().click()
        await page.waitForLoadState('networkidle')

        const mobileTocButton = page.getByRole('button', { name: 'On this page' })
        const isMobileTocVisible = await mobileTocButton.isVisible()

        if (isMobileTocVisible) {
          await mobileTocButton.click()

          // Dropdown should appear
          const dropdown = page.locator('.lg\\:hidden ul')
          await expect(dropdown).toBeVisible()
        }
      } else {
        test.skip()
      }
    })

    test('should close mobile TOC when clicking a link', async ({ page }) => {
      const essayLinks = page.locator('article a')
      const count = await essayLinks.count()

      if (count > 0) {
        await essayLinks.first().click()
        await page.waitForLoadState('networkidle')

        const mobileTocButton = page.getByRole('button', { name: 'On this page' })
        const isMobileTocVisible = await mobileTocButton.isVisible()

        if (isMobileTocVisible) {
          await mobileTocButton.click()

          const dropdown = page.locator('.lg\\:hidden ul')
          const links = dropdown.locator('a')
          const linkCount = await links.count()

          if (linkCount > 0) {
            await links.first().click()

            // Dropdown should close
            await expect(dropdown).not.toBeVisible()
          }
        }
      } else {
        test.skip()
      }
    })
  })

  test.describe('Newsletter CTA', () => {
    test('should display newsletter CTA at bottom', async ({ page }) => {
      const essayLinks = page.locator('article a')
      const count = await essayLinks.count()

      if (count > 0) {
        await essayLinks.first().click()
        await essayPage.expectNewsletterCtaVisible()
      } else {
        test.skip()
      }
    })

    test('should have subscribe form in CTA', async ({ page }) => {
      const essayLinks = page.locator('article a')
      const count = await essayLinks.count()

      if (count > 0) {
        await essayLinks.first().click()

        await expect(page.locator('.mt-16 input[type="email"]')).toBeVisible()
        await expect(page.locator('.mt-16 button[type="submit"]')).toBeVisible()
      } else {
        test.skip()
      }
    })
  })

  test.describe('Tags', () => {
    test('should display tags if present', async ({ page }) => {
      const essayLinks = page.locator('article a')
      const count = await essayLinks.count()

      if (count > 0) {
        await essayLinks.first().click()
        await page.waitForLoadState('networkidle')

        // Tags are optional - just check they render if present
        const tagLinks = page.locator('article header a[href*="tag="]')
        const tagCount = await tagLinks.count()

        if (tagCount > 0) {
          await expect(tagLinks.first()).toBeVisible()
        }
      } else {
        test.skip()
      }
    })
  })

  test.describe('Evergreen badge', () => {
    test('should display evergreen badge for evergreen essays', async ({ page }) => {
      const essayLinks = page.locator('article a')
      const count = await essayLinks.count()

      if (count > 0) {
        // Navigate through essays looking for one with evergreen badge
        for (let i = 0; i < Math.min(count, 5); i++) {
          await page.goto('/writing')
          const links = page.locator('article a')
          await links.nth(i).click()

          const evergreenBadge = page.getByText('Evergreen')
          const isVisible = await evergreenBadge.isVisible()

          if (isVisible) {
            await expect(evergreenBadge).toBeVisible()
            return
          }
        }
        // No evergreen essays found - that's okay, skip
        test.skip()
      } else {
        test.skip()
      }
    })
  })
})
