/** Simulation clock constants and the shared playback-rate schedule. */
export const MAX_SIM_TIME_S = 48 * 3600

export type TimeOfDay = 'night' | 'dawn' | 'day' | 'dusk'

/**
 * Single time-of-day classifier shared by the lighting model and the HUD, so
 * the Setup label cannot disagree with what the scene renders.
 */
export function classifyTimeOfDay(day: number): TimeOfDay {
  if (day < 0.18 || day > 0.92) return 'night'
  if (day < 0.34) return 'dawn'
  if (day <= 0.72) return 'day'
  return 'dusk'
}

/**
 * Playback multiplier: near wall-clock for the first 20 s so the flash and
 * fireball read at human speed, then accelerating to compress the hour/day
 * tail. The HUD and the clock must use this one function so the displayed rate
 * cannot drift from the actual clock.
 */
export function playbackRate(simTimeS: number, speed: number): number {
  return speed * (simTimeS < 20 ? 1 : simTimeS < 90 ? 3 : 24)
}
