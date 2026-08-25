import { cubeRoot } from './units'

/**
 * Height-of-burst "knee" model.
 *
 * Glasstone Fig. 3.73-class charts show that a given overpressure
 * reaches farther on the ground when the burst is at an intermediate
 * height (Mach reflection). This is an interpolated approximation of
 * those curves, not a digitised reprint.
 *
 * Scaled HOB z = H / W^(1/3)  [meters per kt^(1/3)]
 */

export function optimalScaledHobM(psi: number): number {
  // Higher overpressure optima sit lower. 5 psi ≈ 205 m·kt^(-1/3)
  return 80 + 280 / Math.sqrt(Math.max(psi, 0.1))
}

export function surfaceMultiplier(psi: number): number {
  // Surface burst loses 15–35% of ground range vs the airburst optimum.
  if (psi >= 20) return 0.65
  if (psi >= 12) return 0.68
  if (psi >= 5) return 0.72
  if (psi >= 3) return 0.75
  if (psi >= 1) return 0.8
  return 0.85
}

/** Range relative to the 1-kt *optimum* for this psi. 1 = full airburst range. */
export function hobRangeFactor(scaledHobM: number, psi: number): number {
  const zOpt = optimalScaledHobM(psi)
  const surface = surfaceMultiplier(psi)
  if (scaledHobM <= 0) return surface
  if (scaledHobM <= zOpt) {
    const t = scaledHobM / zOpt
    return surface + (1 - surface) * (t * (2 - t))
  }
  const u = (scaledHobM - zOpt) / Math.max(zOpt, 1)
  return Math.max(0.04, Math.exp(-0.85 * u * u))
}

export function scaledHob(hobM: number, yieldKt: number): number {
  return hobM / cubeRoot(yieldKt)
}

export function optimumHobForPsi(yieldKt: number, psi: number): number {
  return optimalScaledHobM(psi) * cubeRoot(yieldKt)
}

/** Golden-section search that maximises ground range of a callback. */
export function searchOptimumHob(
  yieldKt: number,
  rangeAtHob: (hobM: number) => number,
  loM = 0,
  hiM = 4000 * cubeRoot(yieldKt),
): number {
  const phi = (1 + Math.sqrt(5)) / 2
  let a = loM
  let b = hiM
  let c = b - (b - a) / phi
  let d = a + (b - a) / phi
  for (let i = 0; i < 28; i++) {
    if (rangeAtHob(c) > rangeAtHob(d)) b = d
    else a = c
    c = b - (b - a) / phi
    d = a + (b - a) / phi
  }
  return (a + b) / 2
}
