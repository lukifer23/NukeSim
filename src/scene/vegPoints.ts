import { District, type GeneratedCity } from '../city/types'
import { rng } from '../city/noise'

export type VegPoint = { x: number; z: number; y: number; kind: 'tree' | 'scrub' | 'yard'; scale: number }

export function vegetationPoints(city: GeneratedCity, max = 1400): VegPoint[] {
  const rand = rng(city.biome.seed + 91)
  const pts: VegPoint[] = []
  const arid = city.biome.humidity < 0.25
  const step = arid ? 100 : city.biome.id === 'saddle' ? 42 : city.biome.id === 'atoll' ? 48 : city.biome.id === 'foundry' ? 70 : 56
  const half = city.biome.extentM / 2
  const cap = arid ? Math.min(max, 420) : max
  for (let z = -half + 40; z < half - 40 && pts.length < cap; z += step) {
    for (let x = -half + 40; x < half - 40 && pts.length < cap; x += step) {
      const jx = x + (rand() - 0.5) * step * 0.8
      const jz = z + (rand() - 0.5) * step * 0.8
      if (city.waterAt(jx, jz) > 0.5) continue
      if (city.isStreet(jx, jz)) continue
      const d = city.districtAt(jx, jz)
      let p = 0
      if (d === District.Park) p = arid ? 0.4 : city.biome.id === 'saddle' ? 0.97 : city.biome.id === 'foundry' ? 0.45 : 0.94
      else if (d === District.Residential) p = arid ? 0.08 : city.biome.id === 'saddle' ? 0.42 : city.biome.id === 'foundry' ? 0.1 : 0.28
      if (rand() > p) continue
      const kind: VegPoint['kind'] = arid ? 'scrub' : d === District.Park ? 'tree' : 'yard'
      pts.push({
        x: jx,
        z: jz,
        y: city.heightAt(jx, jz),
        kind,
        scale: kind === 'tree' ? 7 + rand() * 5 : kind === 'yard' ? 4 + rand() * 2 : 2.2 + rand() * 1.4,
      })
    }
  }
  return pts
}
