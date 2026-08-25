/**
 * Prompt (initial) nuclear radiation — neutrons + gammas in the first minute.
 *
 * dose = A · W · ff · exp(−R/λ) / R²
 * Tuned so 1 kt, 100% fission ≈ 500 rem at 1.0 km, and so that
 * 10 kt surface 500-rem outranges 5 psi while 300 kt airburst does not.
 *
 * Source family: Glasstone Ch. VIII / Fletcher CEX-62.2.
 */
const A = 1.2e4 // rem · km² / kt
const LAMBDA_KM = 0.32

export function promptDoseRem(
  yieldKt: number,
  slantM: number,
  fissionFraction: number,
): number {
  const rKm = Math.max(slantM, 1) / 1000
  const source = Math.max(yieldKt, 1e-6) * Math.max(fissionFraction, 0.05)
  return (A * source * Math.exp(-rKm / LAMBDA_KM)) / (rKm * rKm)
}

export function promptSlantForRemM(yieldKt: number, rem: number, fissionFraction: number): number {
  let lo = 10
  let hi = 80_000
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2
    if (promptDoseRem(yieldKt, mid, fissionFraction) > rem) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export function promptGroundRangeM(
  yieldKt: number,
  hobM: number,
  rem: number,
  fissionFraction: number,
): number {
  const slant = promptSlantForRemM(yieldKt, rem, fissionFraction)
  if (slant <= hobM) return 0
  return Math.sqrt(slant * slant - hobM * hobM)
}

export const PROMPT_LEVELS = [1000, 500, 100, 10] as const
