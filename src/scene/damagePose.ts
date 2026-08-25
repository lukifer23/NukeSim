import { DamageState } from '../sim/types'
import type { Building } from '../city/types'

export function damagePose(b: Building, damage: DamageState, k: number) {
  let scaleY = 1
  let sunk = 0
  let tiltX = 0
  let tiltZ = 0
  let scaleX = 1
  let scaleZ = 1
  if (damage === DamageState.Vaporized) {
    scaleY = 1 - k * 0.98
    scaleX = 1 + k * 0.35
    scaleZ = 1 + k * 0.35
    sunk = b.h * 0.42 * k
  } else if (damage === DamageState.Collapsed) {
    scaleY = 1 - k * 0.82
    scaleX = 1 + k * 0.45
    scaleZ = 1 + k * 0.25
    sunk = b.h * 0.34 * k
    tiltX = (((b.x * 0.013) % 0.5) - 0.18) * k
    tiltZ = (((b.z * 0.011) % 0.5) - 0.18) * k
  } else if (damage === DamageState.Severe) {
    scaleY = 1 - k * 0.28
    sunk = b.h * 0.08 * k
    tiltX = 0.06 * k
  }
  return { scaleY, sunk, tiltX, tiltZ, scaleX, scaleZ }
}
