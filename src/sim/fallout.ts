import type { FalloutContour } from './types'
import { degToRad } from './units'
import { fireballTouchesGround } from './fireball'

/**
 * Miller Simplified Fallout Scaling System (SFSS) — same family NUKEMAP uses.
 *
 * This is an H+1 scaling cartoon: stem + downwind cloud smear, not a
 * weather-resolved DELFIC run. Contours are reference dose *rates* at
 * H+1 hour, assuming the pattern has already reached its final size.
 *
 * Airbursts whose fireball does not touch the ground produce negligible
 * *local* fallout (long-term global residual only).
 */
export const FALLOUT_RATES = [3000, 1000, 300, 100, 10] as const

const RATE_COLOR: Record<number, string> = {
  3000: '#5c1a1a',
  1000: '#8b2a1e',
  300: '#c44b2b',
  100: '#e07a3d',
  10: '#c9b56a',
}

export function hasLocalFallout(yieldKt: number, hobM: number): boolean {
  return fireballTouchesGround(yieldKt, hobM)
}

function contourLengthKm(yieldKt: number, windMps: number, rate: number, ff: number): number {
  const v = Math.max(windMps, 0.5)
  const wind = (v / 6.7) ** 0.55 // 15 mph ≈ 6.7 m/s
  const source = yieldKt * Math.max(ff, 0.2)
  const scale = {
    3000: 2.0 * source ** 0.38,
    1000: 3.6 * source ** 0.4,
    300: 6.5 * source ** 0.42,
    100: 10.5 * source ** 0.44,
    10: 18 * source ** 0.46,
  }[rate] ?? 8 * source ** 0.42
  return scale * wind
}

function contourHalfWidthKm(lengthKm: number, rate: number): number {
  const fat = rate >= 1000 ? 0.18 : rate >= 100 ? 0.22 : 0.28
  return Math.max(0.4, lengthKm * fat)
}

/** Build a Miller-like stem + cloud polygon in *unrotated* meters (+Z downwind). */
export function millerPolygon(lengthKm: number, halfWidthKm: number): Array<{ x: number; z: number }> {
  const L = lengthKm * 1000
  const W = halfWidthKm * 1000
  const stemR = Math.min(W * 1.1, L * 0.18)
  const upwind = stemR * 0.7
  const hot = L * 0.55
  const pts: Array<{ x: number; z: number }> = []
  // Upwind stem semicircle
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI + (i / 8) * Math.PI
    pts.push({ x: Math.sin(a) * stemR, z: Math.cos(a) * upwind })
  }
  // Cloud flare
  pts.push({ x: W * 0.55, z: L * 0.28 })
  pts.push({ x: W, z: hot })
  pts.push({ x: W * 0.45, z: L })
  pts.push({ x: 0, z: L * 1.04 })
  pts.push({ x: -W * 0.45, z: L })
  pts.push({ x: -W, z: hot })
  pts.push({ x: -W * 0.55, z: L * 0.28 })
  return pts
}

export function rotateToWind(
  points: Array<{ x: number; z: number }>,
  windDirDeg: number,
): Array<{ x: number; z: number }> {
  const a = degToRad(windDirDeg)
  const c = Math.cos(a)
  const s = Math.sin(a)
  return points.map((p) => ({
    x: p.x * c + p.z * s,
    z: -p.x * s + p.z * c,
  }))
}

export function falloutContours(
  yieldKt: number,
  hobM: number,
  windSpeedMps: number,
  windDirDeg: number,
  fissionFraction: number,
): FalloutContour[] {
  if (!hasLocalFallout(yieldKt, hobM)) return []
  return FALLOUT_RATES.map((rate) => {
    const L = contourLengthKm(yieldKt, windSpeedMps, rate, fissionFraction)
    const W = contourHalfWidthKm(L, rate)
    return {
      id: `fallout-${rate}`,
      rateRadH: rate,
      color: RATE_COLOR[rate],
      label: `${rate} rad/h at H+1`,
      points: rotateToWind(millerPolygon(L, W), windDirDeg),
    }
  })
}

/** Point-in-polygon (ray cast). */
export function pointInPoly(x: number, z: number, pts: Array<{ x: number; z: number }>): boolean {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x
    const zi = pts[i].z
    const xj = pts[j].x
    const zj = pts[j].z
    const intersect = zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi + 1e-12) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export function falloutRateAtH1(
  x: number,
  z: number,
  contours: FalloutContour[],
): number {
  // Contours are nested; first match is the hottest.
  for (const c of contours) {
    if (pointInPoly(x, z, c.points)) return c.rateRadH
  }
  return 0
}

/**
 * 7/10 rule: dose rate drops ~10× when time increases 7×.
 * Equivalent to R(t) = R(1h) · t^(−1.2) with t in hours.
 */
export function doseRateAtHour(rateH1: number, hours: number): number {
  const t = Math.max(hours, 1 / 60)
  return rateH1 * t ** -1.2
}

export function integratedDoseRad(rateH1: number, tStartH: number, tEndH: number): number {
  if (rateH1 <= 0 || tEndH <= tStartH) return 0
  const a = -1.2
  const F = (t: number) => (rateH1 * t ** (a + 1)) / (a + 1)
  return Math.max(0, F(Math.max(tEndH, 1e-3)) - F(Math.max(tStartH, 1e-3)))
}

export const SHELTER_FACTOR: Record<string, number> = {
  open: 1,
  wood: 0.5,
  basement: 0.1,
  heavy: 0.02,
}

export function arrivalHours(groundRangeM: number, windSpeedMps: number): number {
  const v = Math.max(windSpeedMps, 0.5)
  return groundRangeM / v / 3600
}

/**
 * Educational arrival/deposition progression for the rendered plume. It deliberately
 * separates plume arrival from the H+1 reference rate and never claims live-weather accuracy.
 */
export function falloutDepositionProgress(groundRangeM: number, windSpeedMps: number, simTimeS: number): number {
  const arrivalS = arrivalHours(groundRangeM, windSpeedMps) * 3600
  const spreadS = Math.max(180, arrivalS * 0.18)
  return Math.min(1, Math.max(0, (simTimeS - arrivalS + spreadS) / spreadS))
}

export function falloutRateAtTimeRadH(rateH1: number, groundRangeM: number, windSpeedMps: number, simTimeS: number): number {
  if (rateH1 <= 0) return 0
  const progress = falloutDepositionProgress(groundRangeM, windSpeedMps, simTimeS)
  const hoursSinceBurst = Math.max(simTimeS / 3600, 1 / 60)
  return rateH1 * progress * hoursSinceBurst ** -1.2
}
