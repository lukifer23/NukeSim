import { clamp } from './units'
import type { ScenarioInput } from './types'
import type { CityId } from '../data/cities'
import { MUNITIONS } from '../data/munitions'

export type SharedScenario = ScenarioInput & { cityId: CityId; munitionId?: string }

const CITY_IDS: CityId[] = ['harbor', 'foundry', 'dune', 'saddle', 'atoll']

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
  const cityId = params.get('city') as CityId | null
  const values = ['y', 'h', 'f', 'w', 'd', 'v'].map((key) => Number(params.get(key)))
  if (!cityId || !CITY_IDS.includes(cityId) || values.some((value) => !Number.isFinite(value))) return null
  const [yieldKt, hobM, fissionFraction, windSpeedMps, windDirDeg, visibilityKm] = values
  const munitionId = params.get('m') ?? undefined
  return {
    cityId,
    munitionId: munitionId && MUNITIONS.some((m) => m.id === munitionId) ? munitionId : undefined,
    yieldKt: clamp(yieldKt, 0.1, 50_000),
    hobM: clamp(hobM, 0, 120_000),
    fissionFraction: clamp(fissionFraction, 0.03, 1),
    windSpeedMps: clamp(windSpeedMps, 0, 25),
    windDirDeg: clamp(windDirDeg, 0, 359),
    visibilityKm: clamp(visibilityKm, 2, 30),
  }
}
