export const SOUND_MPS = 340
export const FT_TO_M = 0.3048

export function cubeRoot(wKt: number): number {
  return Math.cbrt(Math.max(wKt, 1e-9))
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

export function degToRad(d: number): number {
  return (d * Math.PI) / 180
}

/** Format a meters value for HUD. */
export function formatRange(m: number): string {
  if (!Number.isFinite(m) || m <= 0) return '—'
  if (m < 1000) return `${Math.round(m)} m`
  return `${(m / 1000).toFixed(m >= 10000 ? 0 : 2)} km`
}

export function formatYield(kt: number): string {
  if (kt >= 1000) {
    const mt = kt / 1000
    return `${mt >= 10 ? mt.toFixed(0) : mt.toFixed(2)} Mt`
  }
  if (kt >= 10) return `${kt.toFixed(0)} kt`
  if (kt >= 1) return `${kt.toFixed(1)} kt`
  return `${kt.toFixed(2)} kt`
}

export function formatTime(s: number): string {
  if (s < 1e-3) return `${(s * 1e6).toFixed(0)} µs`
  if (s < 1) return `${(s * 1e3).toFixed(0)} ms`
  if (s < 60) return `${s.toFixed(s < 10 ? 1 : 0)} s`
  if (s < 3600) return `${(s / 60).toFixed(1)} min`
  return `${(s / 3600).toFixed(1)} h`
}
