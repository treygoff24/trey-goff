import { expect, test, type Page } from '@playwright/test'
import { BasePage } from './pages'

const mockEdition = {
  intent: 'You came to inspect the engineering.',
  opening: 'Here is the machinery with the casing left open.',
  sections: [
    {
      kind: 'essays',
      lede: 'Start with the account of an agent-memory system that has survived contact with use.',
      slugs: ['agent-long-term-memory'],
    },
    {
      kind: 'projects',
      lede: 'Then inspect a working surface rather than another claim about one.',
      slugs: ['the-control-room'],
    },
  ],
  closing: 'That is the shortest route through the workshop tonight.',
}

async function mockEditionApi(page: Page, chunks = [JSON.stringify(mockEdition)]) {
  await page.addInitScript((streamChunks: string[]) => {
    const originalFetch = window.fetch
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (!url.endsWith('/api/edition')) return originalFetch(input, init)

      const encoder = new TextEncoder()
      let index = 0
      return new Response(
        new ReadableStream({
          async pull(controller) {
            if (index >= streamChunks.length) {
              controller.close()
              return
            }
            if (index > 0) await new Promise((resolve) => window.setTimeout(resolve, 200))
            controller.enqueue(encoder.encode(streamChunks[index]!))
            index++
          },
        }),
        { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
      )
    }
  }, chunks)
}

test.describe('The Edition', () => {
  test('renders the standalone question with every way in', async ({ page }) => {
    const basePage = new BasePage(page)
    await basePage.goto('/edition')

    const main = page.locator('main')
    await expect(
      main.getByRole('heading', { name: 'What brought you here?', level: 1 }),
    ).toBeVisible()
    for (const label of [
      'Writing about Próspera',
      'Evaluating the engineering',
      'Policy & governance work',
      'Just curious',
    ]) {
      await expect(main.getByRole('button', { name: label })).toBeVisible()
    }
    await expect(main.getByRole('link', { name: /browse the usual way/i })).toHaveAttribute(
      'href',
      '/writing',
    )
  })

  test('renders a landed section before the streamed edition completes', async ({ page }) => {
    await mockEditionApi(page, [
      JSON.stringify({
        intent: mockEdition.intent,
        opening: mockEdition.opening,
        sections: [mockEdition.sections[0]],
      }),
      JSON.stringify(mockEdition),
    ])
    const basePage = new BasePage(page)
    await basePage.goto('/edition')
    await page.getByRole('button', { name: 'Evaluating the engineering' }).click()

    await expect(
      page.getByRole('heading', { name: 'You came to inspect the engineering.', level: 1 }),
    ).toBeFocused()
    await expect(page.getByRole('heading', { name: /agent long-term memory/i })).toBeVisible()
    await expect(page.getByText('Setting the next section')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Compose again' })).toBeVisible()
  })

  test('keeps landed sections when a malformed terminal chunk fails', async ({ page }) => {
    await mockEditionApi(page, [
      JSON.stringify({
        intent: mockEdition.intent,
        opening: mockEdition.opening,
        sections: [mockEdition.sections[0]],
      }),
      'not valid JSON',
    ])
    const basePage = new BasePage(page)
    await basePage.goto('/edition')
    await page.getByRole('button', { name: 'Just curious' }).click()

    await expect(page.getByRole('heading', { name: /agent long-term memory/i })).toBeVisible()
    await expect(page.getByText('The type slipped before the page was finished.')).toBeVisible()
    await expect(page.getByRole('heading', { name: /agent long-term memory/i })).toBeVisible()
  })

  test('keeps streaming usable with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await mockEditionApi(page)
    const basePage = new BasePage(page)
    await basePage.goto('/edition')
    await page.getByRole('button', { name: 'Just curious' }).click()

    const firstSection = page.locator('main section').first()
    await expect(firstSection).toBeVisible()
    const duration = await firstSection.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).animationDuration),
    )
    expect(duration).toBeLessThanOrEqual(0.001)
  })

  test('question remains usable at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const basePage = new BasePage(page)
    await basePage.goto('/edition')

    await expect(page.getByRole('heading', { name: 'What brought you here?' })).toBeVisible()
    await expect(page.getByLabel('Or say it your way')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Compose →' })).toBeVisible()
  })
})
