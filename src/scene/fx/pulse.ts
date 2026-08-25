import { thermalPulseDurationS } from '../../sim/fireball'

/** Glasstone two-pulse: brief UV-hot, dip, longer thermal max, then soot. 0..1 cool. */
export function fireballPulse(tS: number, yieldKt: number): { pulse: number; cool: number } {
  const dur = Math.max(0.25, thermalPulseDurationS(yieldKt))
  const p1 = Math.exp(-tS / 0.04)
  const dip = 1 - Math.exp(-tS / 0.08)
  const p2 = Math.exp(-((tS - dur * 0.22) ** 2) / (dur * 0.18) ** 2)
  const pulse = Math.max(p1, p2 * 0.85) * (0.55 + 0.45 * (1 - dip * 0.3))
  const cool = Math.min(1, tS / (dur * 5.2))
  return { pulse, cool }
}
