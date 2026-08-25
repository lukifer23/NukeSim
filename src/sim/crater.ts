/**
 * Apparent crater for surface / near-surface bursts.
 * Engineering fit around Sedan-class (100 kt → ~390 m diameter).
 * Airbursts produce no crater.
 */
export function craterFor(yieldKt: number, hobM: number, fireballR: number): { diameterM: number; depthM: number } | null {
  if (hobM > fireballR * 0.35) return null
  const couple = hobM <= 1 ? 1 : Math.max(0.15, 1 - hobM / (fireballR * 0.35))
  const diameterM = 90 * yieldKt ** 0.3 * couple
  return { diameterM, depthM: diameterM / 5 }
}
