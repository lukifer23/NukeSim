/**
 * Thermal fluence.
 *
 * Q = f W τ / (4π D²)   [Glasstone eqn. 7.96.1]
 * Converted to cal/cm² with W in kt and D in meters. 2.786e6 already
 * includes f = 0.35, so the code multiplies by (f / 0.35).
 *
 * f ≈ 0.35 airburst below 15,000 ft; surface ≈ 0.7 of that.
 * τ from meteorological visibility.
 *
 * Burn thresholds grow with yield because the pulse is longer
 * (Glasstone 1977 revision — the set NUKEMAP adopted).
 */
export function thermalPartition(surface: boolean): number {
  return surface ? 0.35 * 0.7 : 0.35
}

export function transmittance(visibilityKm: number, slantM: number): number {
  // Simple Beer-like: clearer air, longer optical path still attenuates.
  const visM = Math.max(visibilityKm, 0.5) * 1000
  const tau0 = Math.min(0.9, 0.35 + 0.55 * (visibilityKm / 20))
  return tau0 * Math.exp(-slantM / (visM * 2.4))
}

export function thermalFluenceCalCm2(
  yieldKt: number,
  slantM: number,
  visibilityKm: number,
  surface: boolean,
): number {
  if (slantM < 1) return 1e6
  const f = thermalPartition(surface)
  const tau = transmittance(visibilityKm, slantM)
  // 1 kt = 1e12 cal; f of that over a sphere, D in cm.
  return (2.786e6 * (f / 0.35) * yieldKt * tau) / (slantM * slantM)
}

export function burnThresholds(yieldKt: number): { first: number; second: number; third: number; ignition: number } {
  const s = yieldKt ** 0.15
  return {
    first: 1.8 * s,
    second: 3.6 * s,
    third: 5.8 * s,
    ignition: 8.0 * yieldKt ** 0.12,
  }
}

export function thermalSlantForFluenceM(
  yieldKt: number,
  fluence: number,
  visibilityKm: number,
  surface: boolean,
): number {
  // Iterate because τ depends on D.
  let d = 1000
  for (let i = 0; i < 12; i++) {
    const q = thermalFluenceCalCm2(yieldKt, d, visibilityKm, surface)
    const ratio = Math.sqrt(Math.max(q, 1e-9) / Math.max(fluence, 1e-9))
    d = Math.max(10, d * (0.4 + 0.6 * ratio))
  }
  return d
}

export function thermalGroundRangeM(
  yieldKt: number,
  hobM: number,
  fluence: number,
  visibilityKm: number,
): number {
  const surface = hobM <= 1
  const slant = thermalSlantForFluenceM(yieldKt, fluence, visibilityKm, surface)
  if (slant <= hobM) return 0
  return Math.sqrt(slant * slant - hobM * hobM)
}

export const THERMAL_RING_COLORS = {
  first: '#f0c36a',
  second: '#e07a3d',
  third: '#c44b2b',
  ignition: '#8b1e1e',
} as const
