import { DamageState } from '../sim/types'
import type { Building } from '../city/types'

export type Lean = { x: number; z: number }

function smooth01(x: number): number {
  const u = Math.min(1, Math.max(0, x))
  return u * u * (3 - 2 * u)
}

/**
 * Damage is rendered as a progressive structural response, not a binary swap.
 * Severe buildings sag and crack; collapsed buildings crush into their own
 * footprint (leaving a rubble mound rather than vanishing); vaporized
 * buildings shrink away inside the fireball. When a `lean` direction is given
 * (outward from ground zero), structure topples away from the blast instead of
 * in an arbitrary seeded direction.
 */
export function damagePose(b: Building, damage: DamageState, k: number, lean?: Lean) {
  const kk = Math.min(1, Math.max(0, k))
  let scaleY = 1
  let sunk = 0
  let tiltX = 0
  let tiltZ = 0
  let scaleX = 1
  let scaleZ = 1
  const jitterX = (((b.seed * 9.7) % 0.08) - 0.04) * kk
  const jitterZ = (((b.seed * 5.3) % 0.08) - 0.04) * kk
  if (damage === DamageState.Vaporized) {
    const s = kk >= 0.42 ? 0.03 : 1 - kk * 0.35
    scaleX = scaleY = scaleZ = s
  } else if (damage === DamageState.Collapsed) {
    // Crush down into a mound and spread slightly as the floors pancake.
    scaleY = 1 - 0.8 * kk
    scaleX = 1 + 0.32 * kk
    scaleZ = 1 + 0.32 * kk
    sunk = b.h * 0.16 * kk
    const amount = 0.24 * kk
    tiltX = (lean ? lean.z * amount : (((b.x * 0.013) % 0.5) - 0.18) * kk) + jitterX
    tiltZ = (lean ? -lean.x * amount : (((b.z * 0.011) % 0.5) - 0.18) * kk) + jitterZ
  } else if (damage === DamageState.Severe) {
    scaleY = 1 - 0.24 * kk
    sunk = b.h * 0.07 * kk
    const amount = 0.07 * kk
    tiltX = (lean ? lean.z * amount : 0.045 * kk) + jitterX
    tiltZ = (lean ? -lean.x * amount : (((b.seed * 9.7) % 0.08) - 0.04) * kk) + jitterZ
  }
  return { scaleY, sunk, tiltX, tiltZ, scaleX, scaleZ }
}

/**
 * Time-to-damage curve since the shock arrived. Collapse and severe failures
 * are staggered by building seed so a block fails as a cascade rather than all
 * at once. Pure, so the timing contract can be unit-tested.
 */
export function damageProgress(damage: DamageState, seed: number, sinceArrivalS: number): number {
  if (damage === DamageState.Intact) return 0
  const staggered = damage === DamageState.Collapsed || damage === DamageState.Severe
  const delay = staggered ? 0.16 * ((seed * 13.7) % 1) : 0
  return smooth01((sinceArrivalS - delay) / 0.55)
}

/** How shattered the facade reads, 0 (intact) → 1 (gone). */
export function damageAmount(damage: DamageState): number {
  if (damage === DamageState.Collapsed || damage === DamageState.Vaporized) return 1
  if (damage === DamageState.Severe) return 0.8
  if (damage === DamageState.Moderate) return 0.5
  if (damage === DamageState.Glass) return 0.35
  return 0
}
