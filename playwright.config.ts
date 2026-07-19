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
  /* Webpack-backed dev startup can be slower on the first route compile */
  timeout: 60 * 1000,
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
      use: {
        ...devices['Desktop Chrome'],
        // SwiftShader gives headless Chromium a software WebGL2 context so the
        // /machine live-simulation path renders in CI instead of falling back.
        launchOptions: { args: ['--enable-unsafe-swiftshader'] },
      },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* Mobile viewports for responsive testing */
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        launchOptions: { args: ['--enable-unsafe-swiftshader'] },
      },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: `pnpm exec next dev --webpack --port ${E2E_PORT}`,
    url: E2E_BASE_URL,
    reuseExistingServer: false,
    timeout: 120 * 1000,
    env: {
      ...process.env,
      // Lab features run enabled under e2e; dormant states are unit-tested.
      NEXT_PUBLIC_ENABLE_EDITION: 'true',
      NEXT_PUBLIC_ENABLE_RESIDENT: 'true',
      ANNEX_SECRET: 'e2e-annex-secret-with-at-least-thirty-two-chars',
      ANNEX_GITHUB_TOKEN: 'e2e-annex-github-token',
      ANNEX_CONTENT_REPO: 'e2e/annex-content',
      ANNEX_GITHUB_API_URL: 'http://127.0.0.1:3102',
    },
  },
})
