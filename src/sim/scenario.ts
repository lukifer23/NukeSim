import { clamp } from './units'
import type { ScenarioInput } from './types'
import { CITIES, type CityId } from '../data/cities'
import { MUNITIONS } from '../data/munitions'

export type SharedScenario = ScenarioInput & { cityId: CityId; munitionId?: string }

const CITY_IDS = CITIES.map((city) => city.id) as readonly string[]

export function encodeScenario(scenario: SharedScenario): string {
  const params = new URLSearchParams({
    city: scenario.cityId,
    y: scenario.yieldKt.toPrecision(5),
    h: scenario.hobM.toFixed(0),
    f: scenario.fissionFraction.toFixed(2),
    w: scenario.windSpeedMps.toFixed(1),
    d: scenario.windDirDeg.toFixed(0),
    v: scenario.visibilityKm.toFixed(1),
  })
  if (scenario.munitionId && MUNITIONS.some((m) => m.id === scenario.munitionId)) {
    params.set('m', scenario.munitionId)
  }
  return params.toString()
}

export function decodeScenario(search: string): SharedScenario | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const cityId = params.get('city')
  const keys = ['y', 'h', 'f', 'w', 'd', 'v']
  const raw = keys.map((key) => params.get(key))
  // Every numeric field must be present and non-empty; a truncated link should
  // be rejected, not silently loaded at the envelope minimums.
  if (!cityId || !CITY_IDS.includes(cityId) || raw.some((value) => value === null || value.trim() === '')) return null
  const values = raw.map((value) => Number(value))
  if (values.some((value) => !Number.isFinite(value))) return null
  const [yieldKt, hobM, fissionFraction, windSpeedMps, windDirDeg, visibilityKm] = values
  const munitionId = params.get('m') ?? undefined
  return {
    cityId: cityId as CityId,
    munitionId: munitionId && MUNITIONS.some((m) => m.id === munitionId) ? munitionId : undefined,
    yieldKt: clamp(yieldKt, 0.1, 50_000),
    hobM: clamp(hobM, 0, 120_000),
    fissionFraction: clamp(fissionFraction, 0.03, 1),
    windSpeedMps: clamp(windSpeedMps, 0, 25),
    windDirDeg: clamp(windDirDeg, 0, 359),
    visibilityKm: clamp(visibilityKm, 2, 30),
  }
}
