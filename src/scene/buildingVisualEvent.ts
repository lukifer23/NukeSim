import type { Building } from '../city/types'
import { arrivalTimeS, damageFromOverpressure, overpressureAtRangePsi } from '../sim'
import type { DamageState } from '../sim/types'

export type BuildingVisualEvent = {
  damage: DamageState
  arrivalS: number
  ignites: boolean
  seed: number
}

export function buildingVisualEvent(
  building: Building,
  field: {
    yieldKt: number
    hobM: number
    fireballRadiusM: number
    impactX: number
    impactZ: number
    ignites: (building: Building) => boolean
  },
): BuildingVisualEvent {
  const rangeM = Math.hypot(building.x - field.impactX, building.z - field.impactZ)
  const overpressurePsi = overpressureAtRangePsi(field.yieldKt, field.hobM, rangeM)
  return {
    damage: damageFromOverpressure(building.class, overpressurePsi, rangeM < field.fireballRadiusM),
    arrivalS: arrivalTimeS(field.yieldKt, field.hobM, rangeM),
    ignites: field.ignites(building),
    seed: building.seed,
  }
}
