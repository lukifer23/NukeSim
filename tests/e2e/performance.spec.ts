import { expect, test, type Page } from '@playwright/test'

test('10 kt and 1 Mt playback hold the desktop frame budget', async ({ page }, testInfo) => {
  test.skip(process.env.NUKESIM_PERF !== '1', 'Run npm run test:perf on the documented desktop Chrome target.')
  test.skip(testInfo.project.name !== 'desktop', 'Runtime frame budget is calibrated for the primary desktop target.')
  await page.goto('/')
  await page.getByRole('button', { name: 'I understand — continue' }).click()
  await page.getByRole('button', { name: 'Configure detonation' }).click()
  await page.getByRole('button', { name: 'Run field' }).click()
  const tenKt = await frameStats(page)
  expect(tenKt.medianFps, `10 kt median ${tenKt.medianFps.toFixed(1)} FPS`).toBeGreaterThanOrEqual(55)

  await page.reload()
  await page.getByRole('button', { name: 'I understand — continue' }).click()
  await page.getByRole('button', { name: 'Configure detonation' }).click()
  await page.getByRole('button', { name: '1 Mt', exact: true }).click()
  await page.getByRole('button', { name: 'Run field' }).click()
  const oneMt = await frameStats(page)
  expect(oneMt.medianFps, `1 Mt median ${oneMt.medianFps.toFixed(1)} FPS`).toBeGreaterThanOrEqual(55)
  expect(oneMt.p95FrameMs, `1 Mt p95 ${oneMt.p95FrameMs.toFixed(1)} ms`).toBeLessThanOrEqual(50)
})

async function frameStats(page: Page): Promise<{ medianFps: number; p95FrameMs: number }> {
  return page.evaluate(() => new Promise((resolve) => {
    const samples: number[] = []
    let previous = performance.now()
    const tick = (now: number) => {
      if (samples.length > 8) samples.push(now - previous)
      else samples.push(0)
      previous = now
      if (samples.length < 90) requestAnimationFrame(tick)
      else {
        const clean = samples.slice(9).sort((a, b) => a - b)
        const median = clean[Math.floor(clean.length / 2)]
        const p95 = clean[Math.floor(clean.length * 0.95)]
        resolve({ medianFps: 1000 / median, p95FrameMs: p95 })
      }
    }
    requestAnimationFrame(tick)
  }))
}
