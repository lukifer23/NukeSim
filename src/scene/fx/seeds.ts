import type { GeneratedCity } from '../../city/types'

/**
 * Shared fire seed selection so smoke plumes rise from the same buildings
 * that are actually burning. Deterministic: same city, same order.
 */
export function selectFireSeeds(city: GeneratedCity, max: number) {
  const out: GeneratedCity['buildings'] = []
  for (const b of city.buildings) {
    if (b.district === 'park') continue
    if ((Math.abs(Math.floor(b.x) + Math.floor(b.z))) % 5 !== 0) continue
    out.push(b)
    if (out.length >= max) break
  }
  return out
}
