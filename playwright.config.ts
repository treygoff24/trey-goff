import { defineConfig, devices } from '@playwright/test'

const E2E_PORT = 3101
const E2E_BASE_URL = `http://localhost:${E2E_PORT}`

/**
 * Playwright configuration for trey-goff E2E tests.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Match .e2e.ts files */
  testMatch: '**/*.e2e.ts',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Keep local runs stable by limiting worker count */
  workers: process.env.CI ? 1 : 1,
  /* Reporter to use */
  reporter: process.env.CI ? 'github' : 'html',
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: E2E_BASE_URL,
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* Mobile viewports for responsive testing */
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: `pnpm exec next dev --turbopack --port ${E2E_PORT}`,
    url: E2E_BASE_URL,
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },
})
