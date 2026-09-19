import { expect, test } from '@playwright/test'
import { collectBrowserErrors } from './browser-errors'

test('a lost WebGL context surfaces a recoverable notice', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'Phones do not load the 3D field.')
  const errors = collectBrowserErrors(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'I understand — continue' }).click({ force: true })
  await page.getByRole('button', { name: 'Configure detonation' }).click({ force: true })
  const canvas = page.locator('canvas')
  await expect(canvas).toHaveCount(1)

  await canvas.evaluate((element) => {
    element.dispatchEvent(new Event('webglcontextlost'))
  })

  await expect(page.getByText('Graphics context lost')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reload field' })).toBeVisible()

  const blocking = errors.filter((error) => error.includes('Shader Error') || error.startsWith('page:'))
  expect(blocking).toEqual([])
})

test('fonts are self-hosted with no runtime CDN fetch', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'The compact landing still shares the self-hosted font stack.')
  const urls: string[] = []
  page.on('request', (request) => urls.push(request.url()))
  await page.goto('/')
  await page.getByRole('button', { name: 'I understand — continue' }).click({ force: true })
  await page.waitForLoadState('networkidle')

  const cdn = urls.filter((url) => /fonts\.(googleapis|gstatic)\.com/.test(url))
  expect(cdn).toEqual([])
  const local = urls.filter((url) => url.includes('/fonts/') && url.endsWith('.woff2'))
  expect(local.length).toBeGreaterThan(0)
})
