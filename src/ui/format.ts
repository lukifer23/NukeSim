export { formatRange, formatYield, formatTime } from '../sim/units'

export function formatNum(n: number): string {
  if (!Number.isFinite(n)) return '—'
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M`
  if (Math.abs(n) >= 10_000) return `${Math.round(n).toLocaleString()}`
  if (Math.abs(n) >= 100) return n.toFixed(0)
  if (Math.abs(n) >= 10) return n.toFixed(1)
  if (Math.abs(n) >= 1) return n.toFixed(2)
  return n.toFixed(3)
}

export function logYieldFromSlider(t: number, lo = 0.1, hi = 50000): number {
  const a = Math.log(lo)
  const b = Math.log(hi)
  return Math.exp(a + (b - a) * t)
}

export function sliderFromLogYield(kt: number, lo = 0.1, hi = 50000): number {
  const a = Math.log(lo)
  const b = Math.log(hi)
  return (Math.log(Math.min(hi, Math.max(lo, kt))) - a) / (b - a)
}
