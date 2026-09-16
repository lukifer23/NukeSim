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
    if (k >= 0.38) scaleX = scaleY = scaleZ = 0.001
  } else if (damage === DamageState.Collapsed) {
    if (k >= 0.62) scaleX = scaleY = scaleZ = 0.001
    tiltX = (((b.x * 0.013) % 0.5) - 0.18) * Math.min(k, 0.55)
    tiltZ = (((b.z * 0.011) % 0.5) - 0.18) * Math.min(k, 0.55)
  } else if (damage === DamageState.Severe) {
    tiltX = 0.045 * k
    tiltZ = (((b.seed * 9.7) % 0.08) - 0.04) * k
  }
  return { scaleY, sunk, tiltX, tiltZ, scaleX, scaleZ }
}
