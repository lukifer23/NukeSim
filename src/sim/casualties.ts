import { overpressureAtRangePsi } from './blast'
import type { BuildingClass, DamageState } from './types'
import { DamageState as DS, BuildingClass as BC } from './types'

/**
 * Inside the fireball the overpressure is far beyond the tabulated range;
 * use a single high cap for casualty and damage decisions rather than
 * extrapolating the blast curve.
 */
export const FIREBALL_PSI = 80

/**
 * DCPA Attack Environment Manual (1973) / OTA 1979 fatality & injury
 * fractions, using peak overpressure as the proxy. Fire, fallout, and
 * medical-system collapse are NOT in the headline number.
 */
export function fatalityFraction(psi: number): number {  if (psi >= 12) return 0.98
  if (psi >= 5) return 0.5 + ((psi - 5) / 7) * 0.48
  if (psi >= 2) return 0.05 + ((psi - 2) / 3) * 0.45
  if (psi >= 1) return 0.01 + ((psi - 1) / 1) * 0.04
  if (psi >= 0.25) return ((psi - 0.25) / 0.75) * 0.01
  return 0
}

export function injuryFraction(psi: number): number {
  if (psi >= 12) return 0.02
  if (psi >= 5) return 0.4
  if (psi >= 2) return 0.45
  if (psi >= 1) return 0.25
  if (psi >= 0.25) return 0.08
  return 0
}

const THRESHOLDS: Record<BuildingClass, { collapse: number; severe: number; moderate: number; glass: number }> = {
  [BC.Wood]: { collapse: 3, severe: 2, moderate: 1, glass: 0.5 },
  [BC.Masonry]: { collapse: 5, severe: 3, moderate: 1.5, glass: 0.5 },
  [BC.Steel]: { collapse: 5, severe: 3, moderate: 2, glass: 0.5 },
  [BC.Concrete]: { collapse: 12, severe: 7, moderate: 3, glass: 1 },
  [BC.Heavy]: { collapse: 20, severe: 12, moderate: 5, glass: 2 },
}

export function damageFromOverpressure(cls: BuildingClass, psi: number, insideFireball: boolean): DamageState {
  if (insideFireball) return DS.Vaporized
  const t = THRESHOLDS[cls]
  if (psi >= t.collapse) return DS.Collapsed
  if (psi >= t.severe) return DS.Severe
  if (psi >= t.moderate) return DS.Moderate
  if (psi >= t.glass) return DS.Glass
  return DS.Intact
}

export function ignites(thermalCalCm2: number, ignitionThreshold: number, cls: BuildingClass): boolean {
  const fuel = cls === BC.Wood || cls === BC.Masonry ? 1 : cls === BC.Steel ? 0.6 : 0.35
  return thermalCalCm2 >= ignitionThreshold * (2 - fuel)
}

export function sampleCasualties(
  yieldKt: number,
  hobM: number,
  densityAt: (x: number, z: number) => number,
  cityRadiusM: number,
  fireballR: number,
  groundZero: { x: number; z: number } = { x: 0, z: 0 },
): { fatalities: number; injuries: number; population: number } {
  // Polar rings. densityAt returns people / km².
  let fatalities = 0
  let injuries = 0
  let population = 0
  const nR = 28
  const nA = 24
  for (let i = 0; i < nR; i++) {
    const r0 = (i / nR) * cityRadiusM
    const r1 = ((i + 1) / nR) * cityRadiusM
    const r = (r0 + r1) / 2
    const areaKm2 = (Math.PI * (r1 * r1 - r0 * r0)) / 1e6
    const psi = r < fireballR ? FIREBALL_PSI : overpressureAtRangePsi(yieldKt, hobM, r)
    const f = fatalityFraction(psi)
    const inj = injuryFraction(psi)
    for (let k = 0; k < nA; k++) {
      const a = ((k + 0.5) / nA) * Math.PI * 2
      const x = groundZero.x + Math.cos(a) * r
      const z = groundZero.z + Math.sin(a) * r
      const dens = densityAt(x, z)
      const pop = dens * (areaKm2 / nA)
      population += pop
      fatalities += pop * f
      injuries += pop * inj
    }
  }
  return {
    fatalities: Math.round(fatalities),
    injuries: Math.round(injuries),
    population: Math.round(population),
  }
}
