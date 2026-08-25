import { FT_TO_M } from './units'

/**
 * Fireball radii from Glasstone & Dolan 1977 §2.05.
 *   R_breakaway ≈ 90 W^0.4 ft  (thermal minimum)
 *   R_max      ≈ 180 W^0.4 ft  (matches 1 Mt ≈ 2,850 ft radius / 5,700 ft across)
 */
export function fireballBreakawayM(yieldKt: number): number {
  return 90 * yieldKt ** 0.4 * FT_TO_M
}

/** Physical maximum fireball radius used by the model and fallout coupling switch. */
export function fireballPhysicalRadiusM(yieldKt: number): number {
  return 180 * yieldKt ** 0.4 * FT_TO_M
}

/** Rendered ground footprint for a surface burst. */
export function fireballGroundFootprintRadiusM(yieldKt: number): number {
  return fireballPhysicalRadiusM(yieldKt) * 1.15
}

/**
 * Compatibility helper for existing visual consumers. Model decisions should use
 * fireballPhysicalRadiusM so a rendering footprint cannot alter fallout behavior.
 */
export function fireballMaxRadiusM(yieldKt: number, surface = false): number {
  return surface ? fireballGroundFootprintRadiusM(yieldKt) : fireballPhysicalRadiusM(yieldKt)
}

export function fireballTouchesGround(yieldKt: number, hobM: number): boolean {
  return hobM < fireballPhysicalRadiusM(yieldKt)
}

/** Thermal-pulse duration, Glasstone §7.85: t ≈ 0.417 W^0.44 s. */
export function thermalPulseDurationS(yieldKt: number): number {
  return 0.417 * yieldKt ** 0.44
}

/** Visual fireball radius at sim-time t (grows then holds). */
export function fireballRadiusAtTimeM(yieldKt: number, tS: number, surface: boolean): number {
  const rMax = fireballMaxRadiusM(yieldKt, surface)
  const grow = Math.max(0.4, 1.8 * yieldKt ** 0.4) // seconds to max
  const u = Math.min(1, Math.max(0, tS / grow))
  const ease = 1 - (1 - u) ** 3
  return rMax * ease
}
