import { cubeRoot, SOUND_MPS } from './units'
import { hobRangeFactor, scaledHob } from './hob'

/**
 * 1-kt reference ground ranges (meters) at the *optimum* HOB for each
 * overpressure. Chosen so cube-root scaling recovers:
 *   - ~1.7 km 5-psi for 15 kt airburst (Hiroshima-class)
 *   - ~7 km 5-psi for 1 Mt optimized airburst
 *
 * Sources: Glasstone & Dolan 1977 Ch. III cube-root law; OTA 1979
 * destructive-radius figures; Fletcher CEX-62.2 curve-fit family.
 */
export const BLAST_PSI = [20, 12, 5, 3, 1, 0.25] as const

const REF_1KT_OPT_M: Record<number, number> = {
  20: 220,
  12: 340,
  5: 700,
  3: 980,
  1: 1720,
  0.25: 3460,
}

export function blastGroundRangeM(yieldKt: number, hobM: number, psi: number): number {
  const ref = REF_1KT_OPT_M[psi] ?? interpolateRef(psi)
  const factor = hobRangeFactor(scaledHob(hobM, yieldKt), psi)
  return ref * cubeRoot(yieldKt) * factor
}

function interpolateRef(psi: number): number {
  const keys = Object.keys(REF_1KT_OPT_M)
    .map(Number)
    .sort((a, b) => b - a)
  if (psi >= keys[0]) return REF_1KT_OPT_M[keys[0]]
  if (psi <= keys[keys.length - 1]) return REF_1KT_OPT_M[keys[keys.length - 1]]
  for (let i = 0; i < keys.length - 1; i++) {
    const hi = keys[i]
    const lo = keys[i + 1]
    if (psi <= hi && psi >= lo) {
      const t = (Math.log(psi) - Math.log(lo)) / (Math.log(hi) - Math.log(lo))
      return REF_1KT_OPT_M[lo] * (REF_1KT_OPT_M[hi] / REF_1KT_OPT_M[lo]) ** t
    }
  }
  return REF_1KT_OPT_M[5]
}

/** Invert range tables: peak overpressure at a ground range. */
const PSI_SAMPLES = [80, 40, 20, 12, 5, 3, 1, 0.5, 0.25, 0.1]

// The range table is pure in (yield, HOB); the scene samples it many times per
// frame for the same scenario, so build it once and reuse the array.
let rangeMemoKey = ''
let rangeMemoRanges: number[] = []

function tabulatedRanges(yieldKt: number, hobM: number): number[] {
  const key = `${yieldKt}|${hobM}`
  if (key === rangeMemoKey) return rangeMemoRanges
  rangeMemoKey = key
  rangeMemoRanges = PSI_SAMPLES.map((p) => blastGroundRangeM(yieldKt, hobM, p))
  return rangeMemoRanges
}

export function overpressureAtRangePsi(yieldKt: number, hobM: number, rangeM: number): number {
  if (rangeM <= 0) return 200
  const samples = PSI_SAMPLES
  const ranges = tabulatedRanges(yieldKt, hobM)
  if (rangeM <= ranges[0]) return samples[0]
  if (rangeM >= ranges[ranges.length - 1]) {
    // Beyond the tabulated 0.1 psi sample, the strong-shock R^-3 falloff
    // relaxes toward the acoustic R^-1 far field. Blend the local exponent so
    // distant overpressure is not wildly under-predicted.
    const rLast = ranges[ranges.length - 1]
    const u = rangeM / rLast
    const exponent = 1 + 2 / (1 + (u - 1) / 1.5)
    return samples[samples.length - 1] * u ** -exponent
  }
  for (let i = 0; i < samples.length - 1; i++) {
    if (rangeM >= ranges[i] && rangeM <= ranges[i + 1]) {
      const t = (rangeM - ranges[i]) / (ranges[i + 1] - ranges[i])
      const logP = Math.log(samples[i]) + t * (Math.log(samples[i + 1]) - Math.log(samples[i]))
      return Math.exp(logP)
    }
  }
  return 0.1
}

/**
 * Shock arrival. Strong shocks outrun sound; we blend a Mach-ish
 * early speed toward 340 m/s. Time scales as W^(1/3).
 */
export function arrivalTimeS(yieldKt: number, hobM: number, rangeM: number): number {
  const psi = overpressureAtRangePsi(yieldKt, hobM, rangeM)
  const machBoost = 1 + 0.18 * Math.sqrt(Math.max(psi, 0))
  return rangeM / (SOUND_MPS * machBoost)
}

/**
 * Invert arrival: ground radius of the shock front at time t.
 *
 * The scene evaluates this several times per frame (terrain, shock, fires,
 * debris, smoke, every building layer, camera). One memoized result per
 * unique (yield, HOB, time) collapses ~12 bisections into one without changing
 * any returned value.
 */
let shockMemoKey = ''
let shockMemoValue = 0

export function shockRadiusAtTimeM(yieldKt: number, hobM: number, tS: number): number {
  if (tS <= 0) return 0
  const key = `${yieldKt}|${hobM}|${tS}`
  if (key === shockMemoKey) return shockMemoValue
  let lo = 0
  let hi = blastGroundRangeM(yieldKt, hobM, 0.1) * 1.4
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2
    if (arrivalTimeS(yieldKt, hobM, mid) < tS) lo = mid
    else hi = mid
  }
  shockMemoKey = key
  shockMemoValue = (lo + hi) / 2
  return shockMemoValue
}

/**
 * Dynamic pressure from peak overpressure via Rankine–Hugoniot
 * (gamma=1.4 air). q = 2.5 * ΔP² / (7P0 + ΔP), P0 = 14.7 psi.
 */
export function dynamicPressurePsi(overpressurePsi: number): number {
  const dp = Math.max(overpressurePsi, 0)
  return (2.5 * dp * dp) / (7 * 14.7 + dp)
}

/** Equivalent peak wind (mph) from dynamic pressure. q(psf) ≈ 0.00256 V². */
export function equivalentWindMph(overpressurePsi: number): number {
  const qPsf = dynamicPressurePsi(overpressurePsi) * 144
  return Math.sqrt(Math.max(qPsf, 0) / 0.00256)
}

export const BLAST_RING_META: Record<number, { label: string; color: string; detail: string }> = {
  20: {
    label: '20 psi — heavy RC fails',
    color: '#f4d7c8',
    detail: 'Heavily built concrete demolished. Near-total fatalities in the open.',
  },
  12: {
    label: '12 psi — reinforced concrete severe',
    color: '#e8b298',
    detail: 'Most people killed. Reinforced concrete severely damaged.',
  },
  5: {
    label: '5 psi — most buildings collapse',
    color: '#d97a4a',
    detail: 'City-scale destruction contour. Injuries universal, fatalities widespread.',
  },
  3: {
    label: '3 psi — residences collapse',
    color: '#e4a04a',
    detail: 'Wood-frame and masonry housing collapse. Severe injuries common.',
  },
  1: {
    label: '1 psi — windows as weapons',
    color: '#c9b56a',
    detail: 'Glass fragments at hazardous velocity. Light frame damaged.',
  },
  0.25: {
    label: '0.25 psi — light damage',
    color: '#8a857a',
    detail: 'Some windows break. Overpressure comparable to a severe gust.',
  },
}
