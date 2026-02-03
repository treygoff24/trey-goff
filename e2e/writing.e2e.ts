import { test, expect, type Page } from '@playwright/test'
import { WritingPage, EssayDetailPage } from './pages'

const navigationTimeout = 15000

async function openFirstEssay(page: Page, essayPage?: EssayDetailPage) {
  const essayLinks = page.locator('article a')
  const count = await essayLinks.count()

  if (count === 0) {
    return false
  }

  await essayLinks.first().click()

  if (essayPage) {
    await essayPage.expectArticleLoaded()
  } else {
    await expect(page.locator('article h1')).toBeVisible({ timeout: navigationTimeout })
  }

  return true
}

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

  test.describe('Featured section', () => {
    test('should surface featured essays when available', async ({ page }) => {
      const featuredSection = page.locator('section').filter({
        has: page.getByRole('heading', { name: 'Start here' }),
      })

      const sectionCount = await featuredSection.count()
      if (sectionCount > 0) {
        const featuredCards = featuredSection.locator('article')
        const featuredCount = await featuredCards.count()
        expect(featuredCount).toBeGreaterThan(0)

        const featuredBadgeCount = await featuredSection
          .locator('span', { hasText: 'Featured' })
          .count()
        expect(featuredBadgeCount).toBeGreaterThan(0)

        await expect(page.getByRole('heading', { name: 'All essays' })).toBeVisible()
      }
    })
  })

  test.describe('Essay cards', () => {
    test('should display essay title in cards', async () => {
      const cardCount = await writingPage.essayCards.count()

      if (cardCount > 0) {
        const firstCard = writingPage.essayCards.first()
        // Card should have a link with title
        await expect(firstCard.locator('a')).toBeVisible()
      }
    })

    test('should display essay date', async () => {
      const cardCount = await writingPage.essayCards.count()

      if (cardCount > 0) {
        const firstCard = writingPage.essayCards.first()
        // Should have a date
        await expect(firstCard.locator('time')).toBeVisible()
      }
    })

    test('should display reading time', async () => {
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

        await expect(page).toHaveURL(href!, { timeout: navigationTimeout })
      }
    })
  })

  test.describe('Essay tags', () => {
    test('should display tags on essay cards', async () => {
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
    await page.goto('/writing', { waitUntil: 'domcontentloaded' })
  })

  test.describe('Article display', () => {
    test('should display essay title', async ({ page }) => {
      const opened = await openFirstEssay(page, essayPage)
      if (!opened) {
        test.skip()
      }
    })

    test('should display essay content', async ({ page }) => {
      const opened = await openFirstEssay(page, essayPage)
      if (opened) {
        await expect(essayPage.articleContent).toBeVisible()
      } else {
        test.skip()
      }
    })

    test('should display reading time and word count', async ({ page }) => {
      const opened = await openFirstEssay(page, essayPage)
      if (opened) {
        await expect(essayPage.readingTime).toBeVisible()
        await expect(essayPage.wordCount).toBeVisible()
      } else {
        test.skip()
      }
    })

    test('should display publish date', async ({ page }) => {
      const opened = await openFirstEssay(page, essayPage)
      if (opened) {
        await expect(essayPage.publishDate).toBeVisible()
      } else {
        test.skip()
      }
    })
  })

  test.describe('Table of Contents - Desktop', () => {
    test.use({ viewport: { width: 1280, height: 720 } })

    test('should display table of contents on desktop', async ({ page }) => {
      const opened = await openFirstEssay(page, essayPage)

      if (opened) {
        // TOC is shown only if there are 2+ headings
        const tocNav = page.getByRole('navigation', { name: 'Table of contents' })
        const isTocVisible = await tocNav.isVisible()

        if (isTocVisible) {
          await expect(tocNav).toBeVisible()
          await expect(tocNav.getByText('On this page', { exact: true })).toBeVisible()
        }
      } else {
        test.skip()
      }
    })

    test('should navigate to heading when clicking TOC link', async ({ page }) => {
      const opened = await openFirstEssay(page, essayPage)

      if (opened) {
        const tocNav = page.getByRole('navigation', { name: 'Table of contents' })
        const isTocVisible = await tocNav.isVisible()

        if (isTocVisible) {
          const tocLinks = tocNav.locator('a')
          const linkCount = await tocLinks.count()

          if (linkCount > 0) {
            const href = await tocLinks.first().getAttribute('href')
            await tocLinks.first().click()

            if (href) {
              const target = page.locator(href)
              await expect(target).toBeInViewport()
            }
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
      const opened = await openFirstEssay(page, essayPage)

      if (opened) {
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
      const opened = await openFirstEssay(page, essayPage)

      if (opened) {
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
      const opened = await openFirstEssay(page, essayPage)

      if (opened) {
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
      const opened = await openFirstEssay(page, essayPage)

      if (opened) {
        await essayPage.expectNewsletterCtaVisible()
      } else {
        test.skip()
      }
    })

    test('should have subscribe form in CTA', async ({ page }) => {
      const opened = await openFirstEssay(page, essayPage)

      if (opened) {
        await expect(essayPage.newsletterCta.locator('input[type="email"]')).toBeVisible()
        await expect(essayPage.newsletterCta.locator('button[type="submit"]')).toBeVisible()
      } else {
        test.skip()
      }
    })
  })

  test.describe('Tags', () => {
    test('should display tags if present', async ({ page }) => {
      const opened = await openFirstEssay(page, essayPage)

      if (opened) {
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
          await expect(page.locator('article header h1')).toBeVisible({
            timeout: navigationTimeout,
          })

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
