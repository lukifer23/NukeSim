import { expect, test } from '@playwright/test'
import { collectBrowserErrors } from './browser-errors'

async function settleRenderedFrame(page: import('@playwright/test').Page) {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
}

test('10 kt airburst and 1 Mt surface produce a readable field', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Visual field capture is calibrated for the desktop target.')
  test.skip(process.env.NUKESIM_VISUAL !== '1', 'Run NUKESIM_VISUAL=1 npx playwright test tests/e2e/visual-field.spec.ts --project=desktop')
  test.setTimeout(300_000)
  const errors = collectBrowserErrors(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'I understand — continue' }).click({ force: true })
  await page.getByRole('button', { name: 'Configure detonation' }).click({ force: true })
  await page.getByRole('button', { name: 'Run field' }).click({ force: true })
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  await page.getByRole('button', { name: 'Pause' }).click({ force: true })
  for (const [label, jump] of [['flash', '1 ms'], ['fireball', '1 s'], ['shock', '10 s'], ['aftermath', '1 min']] as const) {
    await page.getByRole('button', { name: jump, exact: true }).click({ force: true })
    await settleRenderedFrame(page)
    await page.screenshot({ path: testInfo.outputPath(`10kt-${label}.png`), timeout: 8_000 })
  }

  await page.getByRole('button', { name: 'Setup', exact: true }).click({ force: true })
  await page.getByRole('button', { name: '1 Mt', exact: true }).click({ force: true })
  await page.getByRole('button', { name: 'Surface' }).click({ force: true })
  await page.getByRole('button', { name: 'Run field' }).click({ force: true })
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  await page.getByRole('button', { name: 'Pause' }).click()
  for (const [label, jump] of [['fireball', '1 s'], ['aftermath', '1 min']] as const) {
    await page.getByRole('button', { name: jump, exact: true }).click({ force: true })
    await settleRenderedFrame(page)
    await page.screenshot({ path: testInfo.outputPath(`1mt-surface-${label}.png`), timeout: 8_000 })
  }

  const blocking = errors.filter((error) => error.includes('Shader Error') || error.startsWith('page:'))
  expect(blocking).toEqual([])
})
