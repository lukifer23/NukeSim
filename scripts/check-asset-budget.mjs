import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../public/assets/', import.meta.url))
const budget = 6 * 1024 * 1024

async function bytes(path) {
  const entries = await readdir(path, { withFileTypes: true })
  let total = 0
  for (const entry of entries) {
    const target = join(path, entry.name)
    total += entry.isDirectory() ? await bytes(target) : (await stat(target)).size
  }
  return total
}

const total = await bytes(root)
console.log(`packaged visual assets: ${(total / 1024 / 1024).toFixed(2)} MiB / 6 MiB budget`)
if (total > budget) {
  console.error('Visual asset budget exceeded. Optimize or remove an asset before shipping.')
  process.exit(1)
}
