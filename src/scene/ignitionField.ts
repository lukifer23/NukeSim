import { burnThresholds, ignites, thermalFluenceCalCm2 } from '../sim'
import type { BuildingClass } from '../sim/types'

type Sample = {
  yieldKt: number
  hob: number
  visibilityKm: number
  ox: number
  oz: number
  ridge: boolean
  lineOfSight: (ax: number, ay: number, az: number, bx: number, by: number, bz: number) => boolean
}

const cache = new Map<string, boolean>()
let signature = ''

export function resetIgnitionCache(next: string) {
  if (next === signature) return
  signature = next
  cache.clear()
}

export function ignitesAt(
  x: number,
  z: number,
  y: number,
  cls: BuildingClass | string,
  sample: Sample,
): boolean {
  const key = `${Math.round(x)}:${Math.round(z)}:${cls}`
  const hit = cache.get(key)
  if (hit !== undefined) return hit
  const r = Math.hypot(x - sample.ox, z - sample.oz)
  const losClear = sample.ridge
    ? sample.lineOfSight(sample.ox, Math.max(sample.hob, 12), sample.oz, x, y, z)
    : true
  const flu =
    thermalFluenceCalCm2(sample.yieldKt, Math.hypot(r, sample.hob), sample.visibilityKm, sample.hob <= 1) *
    (losClear ? 1 : 0.02)
  const th = burnThresholds(sample.yieldKt)
  const on = ignites(flu, th.ignition, cls as BuildingClass)
  cache.set(key, on)
  return on
}

export function ignitionSampleFromStore(s: {
  yieldKt: number
  hobResolved: () => number
  visibilityKm: number
  impactOffset: { x: number; z: number }
  city: { biome: { id: string }; lineOfSight: Sample['lineOfSight'] }
}): Sample {
  return {
    yieldKt: s.yieldKt,
    hob: s.hobResolved(),
    visibilityKm: s.visibilityKm,
    ox: s.impactOffset.x,
    oz: s.impactOffset.z,
    ridge: s.city.biome.id === 'saddle',
    lineOfSight: s.city.lineOfSight,
  }
}
