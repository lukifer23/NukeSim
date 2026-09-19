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

/**
 * Surface / near-surface burst flag. This is the *renderer's* ground-coupling
 * switch; the physical "fireball touches ground" test is fireballTouchesGround.
 */
export function isSurfaceBurst(hobM: number): boolean {
  return hobM <= 1
}

/** Thermal-pulse duration, Glasstone §7.85: t ≈ 0.417 W^0.44 s. */
export function thermalPulseDurationS(yieldKt: number): number {
  return 0.417 * yieldKt ** 0.44
}

/**
 * Seconds for the luminous fireball to reach its maximum radius. Hydrodynamic
 * expansion is fast; growth time scales with R_max (~W^0.4), not with the
 * thermal pulse. The old `1.8·W^0.4` put 1 Mt at ~37 s, so the fireball was
 * still inflating when it was hidden at t=24 and never read as a detonation.
 */
export function fireballGrowthDurationS(yieldKt: number): number {
  return Math.min(8, Math.max(0.28, 0.22 * yieldKt ** 0.4))
}

/** Visual fireball radius at sim-time t (grows then holds). */
export function fireballRadiusAtTimeM(yieldKt: number, tS: number, surface: boolean): number {
  const rMax = fireballMaxRadiusM(yieldKt, surface)
  const grow = fireballGrowthDurationS(yieldKt)
  const u = Math.min(1, Math.max(0, tS / grow))
  const ease = 1 - (1 - u) ** 2.6
  return rMax * ease
}

/**
 * Buoyant rise of the luminous fireball after breakaway. Returns metres above
 * the burst height; used so the glow visibly lifts into the stem instead of
 * freezing while the cloud rises away from it.
 */
export function fireballRiseM(yieldKt: number, tS: number, radiusM: number): number {
  const grow = fireballGrowthDurationS(yieldKt)
  const since = Math.max(0, tS - grow)
  const ceiling = Math.max(90, radiusM * 1.1)
  const u = Math.min(1, since / 22)
  return ceiling * (1 - (1 - u) ** 2)
}
