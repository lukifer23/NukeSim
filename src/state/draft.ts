import { clamp } from '../sim/units'
import { BurstMode, type BurstMode as BurstModeT } from '../sim/types'
import { CITIES, type CityId } from '../data/cities'
import { MUNITIONS } from '../data/munitions'

export const SCENARIO_DRAFT_KEY = 'nukesim.scenario-draft.v1'

export type ScenarioDraft = {
  schemaVersion: 1
  cityId: CityId
  munitionId: string
  yieldKt: number
  hobMode: BurstModeT
  customHobM: number
  fissionFraction: number
  windSpeedMps: number
  windDirDeg: number
  visibilityKm: number
  timeOfDay: number
}

const CITY_IDS = CITIES.map((city) => city.id)
const HOB_MODES = new Set<string>(Object.values(BurstMode))

/** Parse an untrusted stored draft, or null when it is missing or invalid. */
export function parseDraft(raw: string | null): ScenarioDraft | null {
  if (!raw) return null
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof value !== 'object' || value === null) return null
  const draft = value as Partial<ScenarioDraft>
  if (draft.schemaVersion !== 1) return null
  if (typeof draft.cityId !== 'string' || !CITY_IDS.includes(draft.cityId as CityId)) return null
  if (typeof draft.munitionId !== 'string' || !MUNITIONS.some((m) => m.id === draft.munitionId)) return null
  if (typeof draft.hobMode !== 'string' || !HOB_MODES.has(draft.hobMode)) return null
  const numbers = [draft.yieldKt, draft.customHobM, draft.fissionFraction, draft.windSpeedMps, draft.windDirDeg, draft.visibilityKm, draft.timeOfDay]
  if (numbers.some((n) => typeof n !== 'number' || !Number.isFinite(n))) return null
  return {
    schemaVersion: 1,
    cityId: draft.cityId as CityId,
    munitionId: draft.munitionId,
    yieldKt: clamp(draft.yieldKt as number, 0.1, 50_000),
    hobMode: draft.hobMode as BurstModeT,
    customHobM: clamp(draft.customHobM as number, 0, 120_000),
    fissionFraction: clamp(draft.fissionFraction as number, 0.03, 1),
    windSpeedMps: clamp(draft.windSpeedMps as number, 0, 25),
    windDirDeg: clamp(draft.windDirDeg as number, 0, 359),
    visibilityKm: clamp(draft.visibilityKm as number, 2, 30),
    timeOfDay: clamp(draft.timeOfDay as number, 0, 1),
  }
}

export function loadDraft(storage: Pick<Storage, 'getItem'> | null = safeStorage()): ScenarioDraft | null {
  if (!storage) return null
  return parseDraft(storage.getItem(SCENARIO_DRAFT_KEY))
}

export function saveDraft(draft: ScenarioDraft, storage: Pick<Storage, 'setItem'> | null = safeStorage()): void {
  if (!storage) return
  try {
    storage.setItem(SCENARIO_DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // Private browsing can reject writes. The session still works.
  }
}

function safeStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage
}
