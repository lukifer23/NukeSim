import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { collectBrowserErrors } from './browser-errors'

test('responsive product boundary and Academy accessibility', async ({ page }, testInfo) => {
  const browserErrors = collectBrowserErrors(page)
  await page.goto('/')
  if (testInfo.project.name === 'phone') {
    await expect(page.getByRole('heading', { name: 'NukeSim' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Open the Academy' })).toBeVisible()
    await expect(page.getByText('Port Meridian')).toBeVisible()
    await expect(page.getByText('Radius grows as the cube root of yield, not linearly.')).toBeVisible()
    await expect(page.locator('canvas')).toHaveCount(0)
  } else {
    await expect(page.getByRole('button', { name: 'I understand — continue' })).toBeVisible()
    await expect(page.locator('canvas')).toHaveCount(1)
  }

  await page.goto('/academy')
  await expect(page.getByRole('heading', { name: 'Predict first. Then make the field prove it.' })).toBeVisible()
  await expect(page.getByText('0/4 current-model missions complete')).toBeVisible()
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')).toEqual([])
  expect(browserErrors).toEqual([])
})

test('running the field does not throw WebGL errors', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'Phones do not load the 3D field.')
  const browserErrors = collectBrowserErrors(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'I understand — continue' }).click()
  await page.getByRole('button', { name: 'Configure detonation' }).click()
  await page.getByRole('button', { name: 'Run field' }).click()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  await page.waitForTimeout(1200)
  const blocking = browserErrors.filter((error) => error.includes('Shader Error') || error.startsWith('page:'))
  expect(blocking).toEqual([])
})

test('header is docs-only; debrief keeps timeline and inspect on the field', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'Phones do not load the 3D field.')
  test.setTimeout(120_000)
  const browserErrors = collectBrowserErrors(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'I understand — continue' }).click({ force: true })
  await page.getByRole('button', { name: 'Configure detonation' }).click({ force: true })
  const header = page.locator('header.app-header')
  await expect(header.getByRole('link', { name: 'Academy' })).toBeVisible()
  await expect(header.getByRole('button', { name: 'Investigate' })).toHaveCount(0)
  await expect(header.getByRole('button', { name: 'Learn' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Setup', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Run field' }).click({ force: true })
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  await page.getByRole('button', { name: 'Pause' }).click({ force: true })
  await page.getByRole('button', { name: 'Debrief' }).click({ force: true })
  await expect(page.getByText('After-action')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Stabilize' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Inspect' })).toBeVisible()
  await expect(page.getByText('Click the city to probe a point.')).toBeVisible()
  await expect(page.getByRole('heading', { name: /over Port Meridian/ })).toBeVisible()
  const blocking = browserErrors.filter((error) => error.includes('Shader Error') || error.startsWith('page:'))
  expect(blocking).toEqual([])
})
