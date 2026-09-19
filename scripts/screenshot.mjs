/**
 * Visual-checkpoint harness. Drives the sandbox and writes stage captures
 * (flash, fireball, shock, cloud, 1 Mt aftermath) to `artifacts/hitlist/`.
 *
 * Usage: start the dev server, then
 *   NS_BASE=http://127.0.0.1:5173/ NS_TAG=mycheck npm run capture
 */
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const base = process.env.NS_BASE ?? 'http://127.0.0.1:4188/'
const out = process.env.NS_OUT ?? 'artifacts/hitlist'
const tag = process.env.NS_TAG ?? 'now'
mkdirSync(out, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1512, height: 850 } })
page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message.slice(0, 300)))
page.on('console', (m) => {
  if (m.type() === 'error' && !m.text().includes('THREE.Clock')) console.log('CONSOLE:', m.text().slice(0, 300))
})

const settle = () =>
  page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))))

async function shot(name) {
  await settle()
  await page.waitForTimeout(120)
  await page.screenshot({ path: `${out}/${tag}-${name}.png` })
  console.log('captured', name)
}

async function jump(label) {
  await page.getByRole('button', { name: label }).click({ force: true })
  await page.waitForTimeout(260)
}

await page.goto(base, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'I understand — continue' }).click({ force: true })
await page.getByRole('button', { name: 'Configure detonation' }).click({ force: true })
await page.waitForTimeout(500)
await shot('setup-bench')
await page.getByRole('button', { name: 'Run field' }).click({ force: true })
await page.getByRole('button', { name: 'Pause' }).click({ force: true })

for (const [name, label] of [
  ['flash-1ms', '1 ms'],
  ['fireball-1s', '1 s'],
  ['shock-10s', '10 s'],
  ['cloud-1min', '1 min'],
]) await (jump(label), shot(name))

await page.getByRole('button', { name: 'Cloud', exact: true }).click({ force: true })
await page.waitForTimeout(900)
await shot('cloud-view')
await page.getByRole('button', { name: 'Field', exact: true }).click({ force: true })
await page.waitForTimeout(600)

// 1 Mt surface burst
await page.getByRole('button', { name: 'Setup', exact: true }).click({ force: true })
await page.getByRole('button', { name: '1 Mt', exact: true }).click({ force: true })
await page.getByRole('button', { name: 'Surface' }).click({ force: true })
await page.getByRole('button', { name: 'Run field' }).click({ force: true })
await page.getByRole('button', { name: 'Pause' }).click({ force: true })
await (jump('1 s'), shot('1mt-surface-fireball'))
await (jump('1 min'), shot('1mt-surface-aftermath'))
await page.getByRole('button', { name: 'Ground zero', exact: true }).click({ force: true })
await page.waitForTimeout(900)
await shot('1mt-surface-groundzero')
await page.getByRole('button', { name: 'Field', exact: true }).click({ force: true })
await page.waitForTimeout(500)
await page.getByRole('button', { name: 'Cloud' }).click({ force: true })
await page.waitForTimeout(700)
await shot('1mt-surface-cloud')

await browser.close()
