import { expect, test } from '@playwright/test'

test('shortcut panel opens from the header and closes with Escape', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'Phones do not load the sandbox header.')
  await page.goto('/')
  await page.getByRole('button', { name: 'I understand — continue' }).click({ force: true })
  await page.getByRole('button', { name: 'Keyboard shortcuts' }).click({ force: true })
  const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('Play or pause the field')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
})

test('the ? key opens the shortcut panel', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'Phones do not load the sandbox header.')
  await page.goto('/')
  await page.getByRole('button', { name: 'I understand — continue' }).click({ force: true })
  await page.keyboard.press('Shift+/')
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible()
})

test('a reload restores the last scenario setup', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'Phones do not load the 3D field.')
  await page.goto('/')
  await page.getByRole('button', { name: 'I understand — continue' }).click({ force: true })
  await page.getByRole('button', { name: 'Configure detonation' }).click({ force: true })
  await page.getByRole('button', { name: '1 Mt', exact: true }).click({ force: true })
  await expect(page.locator('.scenario-readout')).toContainText('1.00 Mt')

  await page.reload()
  await expect(page.locator('.scenario-readout')).toContainText('1.00 Mt')
})

test('reset setup returns the scenario to the free-play defaults', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'Phones do not load the sandbox header.')
  await page.goto('/')
  await page.getByRole('button', { name: 'I understand — continue' }).click({ force: true })
  await page.getByRole('button', { name: 'Configure detonation' }).click({ force: true })
  await page.getByRole('button', { name: '1 Mt', exact: true }).click({ force: true })
  await expect(page.locator('.scenario-readout')).toContainText('1.00 Mt')

  await page.getByRole('button', { name: 'Reset setup' }).click({ force: true })
  await expect(page.locator('.scenario-readout')).toContainText('10 kt')
})

test('the first-run hint dismisses and quick scenarios drive the setup', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'Phones do not load the sandbox header.')
  await page.goto('/')
  await page.getByRole('button', { name: 'I understand — continue' }).click({ force: true })
  await page.getByRole('button', { name: 'Configure detonation' }).click({ force: true })

  const hint = page.getByRole('note')
  await expect(hint).toBeVisible()
  await hint.getByRole('button', { name: 'Got it' }).click({ force: true })
  await expect(hint).toHaveCount(0)

  await page.getByRole('button', { name: 'Thermal pulse' }).click({ force: true })
  await expect(page.locator('.scenario-readout')).toContainText('1.00 Mt')
})
