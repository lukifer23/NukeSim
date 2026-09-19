import type { EffectRing, EffectsReport } from './types'

/** Blast ring at a given peak overpressure, e.g. 5 psi. */
export function ringByPsi(report: EffectsReport, psi: number): EffectRing | undefined {
  return report.rings.find((ring) => ring.psi === psi)
}

/** Named ring, e.g. 'fireball', 'thermal-3', 'rad-500'. */
export function ringById(report: EffectsReport, id: string): EffectRing | undefined {
  return report.rings.find((ring) => ring.id === id)
}
