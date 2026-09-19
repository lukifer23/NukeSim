import type { CityBiome } from '../data/cities'
import { classifyTimeOfDay } from '../sim/timeline'

export type AtmosphereLook = {
  sky: string
  fog: string
  fogNear: number
  fogFar: number
  hemiSky: string
  hemiGround: string
  hemiInt: number
  ambient: number
  sun: string
  sunInt: number
  sunPos: [number, number, number]
  ground: string
  exposure: number
  envInt: number
  envKey: string
  turbidity: number
  rayleigh: number
  mieCoefficient: number
}

/** Map slider 0–1 (night → dawn → noon → dusk) onto a lighting amount 0–1. */
export function lightingAmount(day: number): number {  const u = Math.min(1, Math.max(0, day))
  if (u <= 0.66) return u / 0.66
  return Math.max(0.12, 1 - ((u - 0.66) / 0.34) * 0.85)
}

// Called several times per frame by lighting-driven layers (water, mushroom,
// exposure). Memoize the last (day, biome) so those frames reuse one object
// instead of rebuilding HSL strings and an allocation each time.
let lookKey = ''
let lookCache: AtmosphereLook | null = null

/** Documentary lighting from time-of-day (0 night → dawn → noon → dusk) and biome climate. */
export function atmosphereLook(day: number, biome: CityBiome): AtmosphereLook {
  const key = `${day}|${biome.id}`
  if (lookCache && lookKey === key) return lookCache
  const result = computeAtmosphereLook(day, biome)
  lookKey = key
  lookCache = result
  return result
}

function computeAtmosphereLook(day: number, biome: CityBiome): AtmosphereLook {
  const t = lightingAmount(day)
  const haze = 1 - Math.min(1, biome.visibilityKm / 28)
  const bucket = classifyTimeOfDay(day)
  const dusk = bucket === 'dawn' || bucket === 'dusk'
  const night = bucket === 'night'
  const hue = dusk ? 0.06 : biome.id === 'dune' ? 0.1 : 0.58
  const sat = night ? 0.16 : dusk ? 0.32 : 0.2 + (1 - haze) * 0.08
  const light = 0.035 + t * 0.36 - haze * 0.05
  const sky = hsl(hue, sat, light)
  const fog = hsl(hue, sat * 0.7, Math.max(0.03, light - 0.03))
  const visM = biome.visibilityKm * 1000
  // Solar arc: the sun rises low in front of the default harbor view, climbs
  // through noon, and sets behind the camera at dusk, so elevation sweeps a
  // real dawn → noon → dusk path instead of a fixed high angle.
  const solar = Math.min(1, Math.max(0, (day - 0.14) / 0.78))
  const altitude = Math.sin(Math.PI * solar) ** 1.5
  const azimuth = 2.35 - solar * 3.6
  const sunR = 5200
  return {
    sky,
    fog,
    fogNear: 2200 + t * 1800 + haze * 800,
    fogFar: Math.min(46000, Math.max(30000, visM * 0.8 + 22000)),
    hemiSky: night ? '#1a2430' : dusk ? '#c9a888' : '#c5d0d8',
    hemiGround: biome.id === 'dune' ? '#3a3024' : '#2a2620',
    hemiInt: 0.5 + t * 0.45,
    ambient: 0.22 + t * 0.28,
    sun: night ? '#8aa0c0' : dusk ? '#ffb070' : biome.id === 'dune' ? '#ffe2b8' : '#fff4e0',
    sunInt: night ? 0.22 : 0.85 + t * 1.05,
    sunPos: [Math.cos(azimuth) * sunR, 260 + altitude * 5200, Math.sin(azimuth) * sunR],
    ground: biome.id === 'dune' ? '#6a5a40' : biome.id === 'atoll' ? '#3a4a40' : '#3a3d36',
    exposure: 1.05 + t * 0.22,
    envInt: 0.65 + t * 0.35,
    envKey: `${biome.id}-${Math.round(t * 12)}`,
    turbidity: night ? 1.6 : dusk ? 7.5 : 3.4 + haze * 6,
    rayleigh: night ? 0.18 : dusk ? 0.7 : 0.85 + (1 - haze) * 0.4,
    mieCoefficient: 0.004 + haze * 0.012,
  }
}

function hsl(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l)
  return `#${hex(r)}${hex(g)}${hex(b)}`
}

function hslToRgb(h: number, s: number, l: number) {
  const hue = ((h % 1) + 1) % 1
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + hue * 12) % 12
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
  }
  return { r: f(0), g: f(8), b: f(4) }
}

function hex(v: number): string {
  return Math.round(Math.min(1, Math.max(0, v)) * 255)
    .toString(16)
    .padStart(2, '0')
}
