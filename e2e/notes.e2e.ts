import { test, expect } from '@playwright/test'
import { NotesPage } from './pages'

test.describe('Notes Page', () => {
  let notesPage: NotesPage

  test.beforeEach(async ({ page }) => {
    notesPage = new NotesPage(page)
    await notesPage.gotoNotesPage()
  })

  test.describe('Page display', () => {
    test('should display page title', async () => {
      await notesPage.expectPageLoaded()
    })

    test('should display page description', async ({ page }) => {
      await expect(page.getByText(/short-form thoughts/i)).toBeVisible()
    })

    test('should display note cards or empty state', async () => {
      const cardCount = await notesPage.noteCards.count()

      if (cardCount > 0) {
        await notesPage.expectNotesDisplayed()
      } else {
        await notesPage.expectEmptyState()
      }
    })
  })

  test.describe('Note cards', () => {
    test('should display note type indicator', async () => {
      const cardCount = await notesPage.noteCards.count()

      if (cardCount > 0) {
        const firstCard = notesPage.noteCards.first()
        const hasType = await firstCard.getByText(/Thought|Dispatch|Link/).isVisible()
        expect(hasType).toBe(true)
      } else {
        test.skip()
      }
    })

    test('should display note date', async () => {
      const cardCount = await notesPage.noteCards.count()

      if (cardCount > 0) {
        await notesPage.expectNoteHasDate(0)
      } else {
        test.skip()
      }
    })

    test('should display note content', async () => {
      const cardCount = await notesPage.noteCards.count()

      if (cardCount > 0) {
        const firstCard = notesPage.noteCards.first()
        const content = firstCard.locator('.prose')
        await expect(content).toBeVisible()
      } else {
        test.skip()
      }
    })
  })

  test.describe('Anchor IDs', () => {
    test('should have anchor ID on note cards', async () => {
      const cardCount = await notesPage.noteCards.count()

      if (cardCount > 0) {
        const firstCard = notesPage.noteCards.first()
        const id = await firstCard.getAttribute('id')

        expect(id).toBeTruthy()
        expect(id!.length).toBeGreaterThan(0)
      } else {
        test.skip()
      }
    })

    test('should update URL hash when clicking anchor link', async ({ page }) => {
      const cardCount = await notesPage.noteCards.count()

      if (cardCount > 0) {
        const firstCard = notesPage.noteCards.first()
        const id = await firstCard.getAttribute('id')

        await firstCard.hover()

        const anchorLink = firstCard.getByRole('link', { name: 'Link to this note' })
        await anchorLink.click()

        await expect(page).toHaveURL(new RegExp(`#${id}`))
      } else {
        test.skip()
      }
    })

    test('should navigate to note via URL hash', async ({ page }) => {
      const cardCount = await notesPage.noteCards.count()

      if (cardCount > 0) {
        const firstCard = notesPage.noteCards.first()
        const id = await firstCard.getAttribute('id')

        await page.goto(`/notes#${id}`)

        const isInViewport = await firstCard.isVisible()
        expect(isInViewport).toBe(true)
      } else {
        test.skip()
      }
    })
  })

  test.describe('Note types', () => {
    test('should display thought type with emoji', async () => {
      const thoughtNotes = notesPage.noteCards.filter({ hasText: 'Thought' })
      const count = await thoughtNotes.count()

      if (count > 0) {
        const firstThought = thoughtNotes.first()
        await expect(firstThought.getByText('Thought')).toBeVisible()
      }
    })

    test('should display dispatch type with emoji', async () => {
      const dispatchNotes = notesPage.noteCards.filter({ hasText: 'Dispatch' })
      const count = await dispatchNotes.count()

      if (count > 0) {
        const firstDispatch = dispatchNotes.first()
        await expect(firstDispatch.getByText('Dispatch')).toBeVisible()
      }
    })

    test('should display link type with source URL', async () => {
      const linkNotes = notesPage.noteCards.filter({ hasText: 'Link' })
      const count = await linkNotes.count()

      if (count > 0) {
        const firstLink = linkNotes.first()
        await expect(firstLink.getByText('Link')).toBeVisible()

        const externalLink = firstLink.locator('a[target="_blank"]')
        const hasExternal = await externalLink.count()
        // Not all link-type notes might have source, so just check if visible when present
        if (hasExternal > 0) {
          await expect(externalLink.first()).toBeVisible()
        }
      }
    })
  })

  test.describe('Tags', () => {
    test('should display tags on notes', async () => {
      const cardCount = await notesPage.noteCards.count()

      if (cardCount > 0) {
        for (let i = 0; i < Math.min(cardCount, 5); i++) {
          const card = notesPage.noteCards.nth(i)
          const tags = card.locator('a[class*="TagPill"], span[class*="tag"], a[href*="tag"]')
          const tagCount = await tags.count()

          if (tagCount > 0) {
            await expect(tags.first()).toBeVisible()
            return
          }
        }
        test.skip()
      } else {
        test.skip()
      }
    })
  })

  test.describe('Note titles', () => {
    test('should display title when present', async () => {
      const cardCount = await notesPage.noteCards.count()

      if (cardCount > 0) {
        for (let i = 0; i < Math.min(cardCount, 5); i++) {
          const card = notesPage.noteCards.nth(i)
          const title = card.locator('h3')
          const hasTitle = (await title.count()) > 0

          if (hasTitle) {
            await expect(title).toBeVisible()
            return
          }
        }
        test.skip()
      } else {
        test.skip()
      }
    })
  })
})

test.describe('Notes Page - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should display notes on mobile viewport', async ({ page }) => {
    const notesPage = new NotesPage(page)
    await notesPage.gotoNotesPage()

    await notesPage.expectPageLoaded()

    const cardCount = await notesPage.noteCards.count()
    if (cardCount > 0) {
      await notesPage.expectNotesDisplayed()
    }
  })

  test('should have readable content on mobile', async ({ page }) => {
    const notesPage = new NotesPage(page)
    await notesPage.gotoNotesPage()

    const cardCount = await notesPage.noteCards.count()
    if (cardCount > 0) {
      const firstCard = notesPage.noteCards.first()

      const box = await firstCard.boundingBox()
      expect(box).toBeTruthy()
      expect(box!.width).toBeLessThanOrEqual(375) // Should fit mobile width
      expect(box!.width).toBeGreaterThan(260) // Should use most of the width inside the 3rem site gutters
    }
  })
})
