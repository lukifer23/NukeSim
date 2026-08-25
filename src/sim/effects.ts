import { BLAST_PSI, BLAST_RING_META, blastGroundRangeM, overpressureAtRangePsi, arrivalTimeS, dynamicPressurePsi, equivalentWindMph } from './blast'
import { fireballMaxRadiusM, fireballTouchesGround, fireballBreakawayM } from './fireball'
import { burnThresholds, thermalFluenceCalCm2, thermalGroundRangeM, THERMAL_RING_COLORS } from './thermal'
import { promptDoseRem, promptGroundRangeM, PROMPT_LEVELS } from './radiation'
import { craterFor } from './crater'
import { mushroomCloud } from './cloud'
import { falloutContours, falloutRateAtH1, integratedDoseRad, arrivalHours, SHELTER_FACTOR } from './fallout'
import { damageFromOverpressure, fatalityFraction, injuryFraction } from './casualties'
import { BurstMode, Confidence, type BurstMode as BurstModeT, type EffectsReport, type ProbeResult, type ScenarioInput, type Shelter, type BuildingClass } from './types'
import { BuildingClass as BC } from './types'
import { optimumHobForPsi, searchOptimumHob } from './hob'
import { cubeRoot } from './units'
import { ridgeBlastFactor } from './los'

export function resolveHob(yieldKt: number, mode: BurstModeT, customM: number, visibilityKm: number): number {
  if (mode === BurstMode.Surface) return 0
  if (mode === BurstMode.Custom) return Math.max(0, customM)
  if (mode === BurstMode.OptimizeBlast) return optimumHobForPsi(yieldKt, 5)
  const th = burnThresholds(yieldKt)
  return searchOptimumHob(yieldKt, (h) => thermalGroundRangeM(yieldKt, h, th.second, visibilityKm))
}

export function computeEffects(input: ScenarioInput): EffectsReport {
  const { yieldKt, hobM, fissionFraction, windSpeedMps, windDirDeg, visibilityKm } = input
  const surface = hobM <= 1
  const fireballR = fireballMaxRadiusM(yieldKt, surface)
  const touches = fireballTouchesGround(yieldKt, hobM)
  const th = burnThresholds(yieldKt)

  const rings = [
    {
      id: 'fireball',
      kind: 'fireball' as const,
      label: 'Fireball',
      radiusM: fireballR,
      color: '#fff4d6',
      detail: touches
        ? 'Fireball touches the ground — local fallout is on.'
        : 'Airburst fireball. No significant local fallout.',
      source: 'Glasstone & Dolan 1977 §2.05',
      confidence: Confidence.StandardScaling,
    },
    ...BLAST_PSI.map((psi) => ({
      id: `blast-${psi}`,
      kind: 'blast' as const,
      label: BLAST_RING_META[psi].label,
      radiusM: blastGroundRangeM(yieldKt, hobM, psi),
      color: BLAST_RING_META[psi].color,
      detail: BLAST_RING_META[psi].detail,
      psi,
      source: 'Glasstone & Dolan 1977 Ch. III; cube-root scaling + HOB knee',
      confidence: Confidence.Interpolated,
    })),
    {
      id: 'thermal-3',
      kind: 'thermal' as const,
      label: '3rd-degree burns (exposed skin)',
      radiusM: thermalGroundRangeM(yieldKt, hobM, th.third, visibilityKm),
      color: THERMAL_RING_COLORS.third,
      detail: `${th.third.toFixed(1)} cal/cm² — yield-dependent threshold.`,
      fluence: th.third,
      source: 'Glasstone 1977 thermal revision; eqn. 7.96.1',
      confidence: Confidence.StandardScaling,
    },
    {
      id: 'thermal-2',
      kind: 'thermal' as const,
      label: '2nd-degree burns',
      radiusM: thermalGroundRangeM(yieldKt, hobM, th.second, visibilityKm),
      color: THERMAL_RING_COLORS.second,
      detail: `${th.second.toFixed(1)} cal/cm²`,
      fluence: th.second,
      source: 'Glasstone 1977 thermal revision; eqn. 7.96.1',
      confidence: Confidence.StandardScaling,
    },
    {
      id: 'thermal-ignition',
      kind: 'thermal' as const,
      label: 'Urban ignition / superfire candidate',
      radiusM: thermalGroundRangeM(yieldKt, hobM, th.ignition, visibilityKm),
      color: THERMAL_RING_COLORS.ignition,
      detail: `${th.ignition.toFixed(1)} cal/cm² — fuel-load dependent.`,
      fluence: th.ignition,
      source: 'Glasstone tables 7.35 / 7.40 (heuristic ignition)',
      confidence: Confidence.Heuristic,
    },
    ...PROMPT_LEVELS.filter((rem) => rem >= 100).map((rem) => ({
      id: `rad-${rem}`,
      kind: 'radiation' as const,
      label: `Prompt ${rem} rem`,
      radiusM: promptGroundRangeM(yieldKt, hobM, rem, fissionFraction),
      color: rem >= 500 ? '#7ec8c9' : '#3dbebf',
      detail: rem >= 500 ? 'Acute radiation sickness likely if unsheltered.' : 'Elevated prompt dose.',
      rem,
      source: 'Glasstone Ch. VIII / Fletcher CEX-62.2 (curve fit)',
      confidence: Confidence.Interpolated,
    })),
  ].filter((r) => r.radiusM > 1)

  return {
    yieldKt,
    hobM,
    scaledHobM: hobM / cubeRoot(yieldKt),
    fireballTouchesGround: touches,
    fireballRadiusM: fireballBreakawayM(yieldKt),
    fireballMaxRadiusM: fireballR,
    rings,
    cloud: mushroomCloud(yieldKt),
    crater: craterFor(yieldKt, hobM, fireballR),
    fallout: falloutContours(yieldKt, hobM, windSpeedMps, windDirDeg, fissionFraction),
    optimumHob5PsiM: optimumHobForPsi(yieldKt, 5),
    optimumHobThermalM: resolveHob(yieldKt, BurstMode.OptimizeThermal, 0, visibilityKm),
  }
}

export function probeAt(
  input: ScenarioInput,
  x: number,
  z: number,
  opts?: { shelter?: Shelter; hoursOut?: number; buildingClass?: BuildingClass; losClear?: boolean },
): ProbeResult {
  const groundRangeM = Math.hypot(x, z)
  const slantRangeM = Math.hypot(groundRangeM, input.hobM)
  const report = computeEffects(input)
  const losClear = opts?.losClear ?? true
  let psi = overpressureAtRangePsi(input.yieldKt, input.hobM, groundRangeM) * ridgeBlastFactor(losClear)
  const q = dynamicPressurePsi(psi)
  let thermal = thermalFluenceCalCm2(
    input.yieldKt,
    Math.max(slantRangeM, 1),
    input.visibilityKm,
    input.hobM <= 1,
  )
  let rem = promptDoseRem(input.yieldKt, slantRangeM, input.fissionFraction)
  if (!losClear) {
    thermal *= 0.02
    rem *= 0.02
  }
  const rate = falloutRateAtH1(x, z, report.fallout)
  const shelter = opts?.shelter ?? 'open'
  const hours = opts?.hoursOut ?? 24
  const tArr = arrivalHours(groundRangeM, input.windSpeedMps)
  const rawDose = integratedDoseRad(rate, Math.max(tArr, 1 / 60), Math.max(tArr, 1 / 60) + hours)
  const dose = rawDose * (SHELTER_FACTOR[shelter] ?? 1)
  const insideFireball = groundRangeM < report.fireballMaxRadiusM && input.hobM < report.fireballMaxRadiusM
  const cls = opts?.buildingClass ?? BC.Masonry
  const notes: string[] = []
  if (report.fireballTouchesGround) notes.push('Local fallout is active (fireball on ground).')
  else notes.push('Airburst — negligible local fallout.')
  if (rem > 500 && psi < 5) notes.push('Prompt radiation outranges severe blast — a low-yield signature.')
  if (thermal > burnThresholds(input.yieldKt).third) notes.push('Third-degree burns on exposed skin.')
  if (!losClear) notes.push('Ridge between you and the fireball — thermal/prompt shadowed. Blast only knocked down (heuristic).')

  return {
    x,
    z,
    groundRangeM,
    slantRangeM,
    arrivalS: arrivalTimeS(input.yieldKt, input.hobM, groundRangeM),
    overpressurePsi: psi,
    dynamicPressurePsi: q,
    equivalentWindMph: equivalentWindMph(psi),
    thermalCalCm2: thermal,
    promptRem: rem,
    falloutRateH1RadH: rate,
    falloutDoseRad: dose,
    buildingDamage: damageFromOverpressure(cls, psi, insideFireball),
    fatalityFrac: fatalityFraction(insideFireball ? 80 : psi),
    injuryFrac: injuryFraction(insideFireball ? 80 : psi),
    notes,
    losClear,
    confidence: report.fireballTouchesGround ? Confidence.Heuristic : Confidence.Interpolated,
  }
}
