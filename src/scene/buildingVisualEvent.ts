import type { Building } from '../city/types'
import { arrivalTimeS, damageFromOverpressure, overpressureAtRangePsi } from '../sim'
import type { DamageState } from '../sim/types'

export type BuildingVisualEvent = {
  damage: DamageState
  arrivalS: number
  rangeM: number
  ignites: boolean
  seed: number
}

/**
 * Single source of truth for a building's visual damage state. Every instanced
 * layer (tower, podium, roof, rubble) goes through this so the damage and
 * arrival rules cannot drift between layers. Callers that already computed the
 * ground range pass it in to avoid a second hypot.
 */
export function buildingVisualEvent(
  building: Building,
  field: {
    yieldKt: number
    hobM: number
    fireballRadiusM: number
    impactX: number
    impactZ: number
    ignites?: (building: Building) => boolean
  },
  rangeM = Math.hypot(building.x - field.impactX, building.z - field.impactZ),
): BuildingVisualEvent {
  const overpressurePsi = overpressureAtRangePsi(field.yieldKt, field.hobM, rangeM)
  return {
    damage: damageFromOverpressure(building.class, overpressurePsi, rangeM < field.fireballRadiusM),
    arrivalS: arrivalTimeS(field.yieldKt, field.hobM, rangeM),
    rangeM,
    ignites: field.ignites?.(building) ?? false,
    seed: building.seed,
  }
}
