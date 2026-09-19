import { gzipSync } from 'node:zlib'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const assetDir = join(process.cwd(), 'dist', 'assets')
const javascript = readdirSync(assetDir).filter((name) => name.endsWith('.js'))
const scene = javascript.find((name) => name.startsWith('Scene-'))
const main = javascript.find((name) => name.startsWith('index-'))

if (!scene || !main) {
  console.error('Bundle budget check requires a fresh Vite production build.')
  process.exit(1)
}

// 110 KiB leaves the shell a few KiB of headroom for icons/among otherwise
// lazy-loaded panels, instead of sitting at the edge of the budget.
const budgets = [
  { label: 'main application', file: main, max: 110 * 1024 },
  { label: 'lazy 3D scene', file: scene, max: 360 * 1024 },
]

let failed = false
for (const budget of budgets) {
  const bytes = gzipSync(readFileSync(join(assetDir, budget.file))).byteLength
  const kib = bytes / 1024
  const maxKib = budget.max / 1024
  console.log(`${budget.label}: ${kib.toFixed(1)} KiB gzip / ${maxKib.toFixed(0)} KiB budget`)
  if (bytes > budget.max) {
    failed = true
    console.error(`${budget.label} exceeds its gzip budget by ${(kib - maxKib).toFixed(1)} KiB.`)
  }
}

if (failed) process.exit(1)
