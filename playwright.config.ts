import { defineConfig, devices } from '@playwright/test'

// Headless CI has no GPU, so Chrome needs to fall back to software WebGL.
const softwareWebgl = process.env.CI ? { launchOptions: { args: ['--enable-unsafe-swiftshader'] } } : {}

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4177',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4177',
    url: 'http://127.0.0.1:4177',
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1512, height: 850 }, ...softwareWebgl } },
    { name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 }, hasTouch: true, ...softwareWebgl } },
    { name: 'phone', use: { ...devices['Pixel 7'], ...softwareWebgl } },
  ],
})
