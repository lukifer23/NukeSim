import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { collectBrowserErrors } from './browser-errors'

test.use({ launchOptions: { args: ['--disable-webgl'] } })

test('completes a real two-run mission and persists progress', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'The complete mission flow runs once at the primary target.')
  const browserErrors = collectBrowserErrors(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/academy')
  await page.getByRole('button', { name: 'Start mission' }).first().click()

  await expect(page.getByText('Predict before the spectacle')).toBeVisible()
  await page.getByRole('button', { name: '10×', exact: true }).click()
  await expect(page.getByText('Scenario ready')).toBeVisible()

  await page.getByRole('button', { name: 'Scenario', exact: true }).click()
  await page.getByRole('button', { name: 'Run baseline' }).click()
  await page.getByRole('button', { name: 'Pause' }).click()
  await page.getByRole('button', { name: 'Lesson', exact: true }).click()
  await expect(page.getByText('Baseline recorded')).toBeVisible()
  await page.getByRole('button', { name: 'Prepare comparison' }).click()

  await expect(page.getByText('Target: 1.00 Mt')).toBeVisible()
  await page.getByRole('button', { name: 'Scenario', exact: true }).click()
  await page.getByRole('button', { name: 'Run comparison' }).click()
  await page.getByRole('button', { name: 'Pause' }).click()
  await page.getByRole('button', { name: 'Lesson', exact: true }).click()
  await expect(page.getByText('10.0× severe-blast radius')).toBeVisible()
  await page.getByRole('button', { name: 'Explain the result' }).click()

  await expect(page.getByText('Matched the model')).toBeVisible()
  await page.getByRole('button', { name: 'Complete mission' }).click()
  await expect(page.getByText('Mission result · complete')).toBeVisible()
  await page.getByRole('link', { name: 'Academy progress' }).click()
  await expect(page.getByText('1/4 current-model missions complete')).toBeVisible()

  await page.reload()
  await expect(page.getByText('1/4 current-model missions complete')).toBeVisible()
  await expect(page.getByText('prediction correct')).toBeVisible()
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')).toEqual([])
  expect(browserErrors).toEqual([])
})
