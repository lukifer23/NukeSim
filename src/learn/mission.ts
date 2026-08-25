import type { Lesson } from '../data/lessons'
import { hobModeFromLesson } from '../data/lessons'
import type { CityId } from '../data/cities'
import type { BurstMode, EffectsReport, ScenarioInput } from '../sim/types'

export type MissionStep =
  | 'predict'
  | 'configure-baseline'
  | 'observe-baseline'
  | 'configure-comparison'
  | 'observe-comparison'
  | 'explain'
  | 'complete'

export type MissionScenarioState = {
  cityId: CityId
  munitionId: string
  yieldKt: number
  hobMode: BurstMode
  customHobM: number
}

export type MissionRunSnapshot = {
  label: string
  cityId: CityId
  hobMode: BurstMode
  input: ScenarioInput
  report: EffectsReport
}

export type MissionSession = {
  lessonId: string
  step: MissionStep
  predictionIndex: number | null
  baseline: MissionRunSnapshot | null
  comparison: MissionRunSnapshot | null
}

export type MissionObservation = {
  headline: string
  detail: string
  baselineValue: string
  comparisonValue: string
}

export function newMissionSession(lessonId: string): MissionSession {
  return { lessonId, step: 'predict', predictionIndex: null, baseline: null, comparison: null }
}

export function expectedMissionScenario(lesson: Lesson, stage: 'baseline' | 'comparison'): MissionScenarioState {
  const compare = stage === 'comparison' ? lesson.compare : undefined
  const hobMode = compare?.hobMode ? hobModeFromLesson(compare.hobMode) : hobModeFromLesson(lesson.setup.hobMode)
  const hobM = compare?.hobM ?? lesson.setup.hobM ?? 0
  return {
    cityId: lesson.setup.cityId as CityId,
    munitionId: lesson.setup.munitionId,
    yieldKt: compare?.yieldKt ?? lesson.setup.yieldKt,
    hobMode,
    customHobM: hobM,
  }
}

export function missionScenarioMatches(
  lesson: Lesson,
  stage: 'baseline' | 'comparison',
  actual: MissionScenarioState,
): boolean {
  const expected = expectedMissionScenario(lesson, stage)
  const yieldTolerance = Math.max(0.001, expected.yieldKt * 0.001)
  const customMatches = expected.hobMode !== 'custom' || Math.abs(expected.customHobM - actual.customHobM) <= 1
  return (
    actual.cityId === expected.cityId &&
    actual.munitionId === expected.munitionId &&
    Math.abs(actual.yieldKt - expected.yieldKt) <= yieldTolerance &&
    actual.hobMode === expected.hobMode &&
    customMatches
  )
}

export function missionChangedInputs(a: MissionRunSnapshot, b: MissionRunSnapshot): string[] {
  const changed: string[] = []
  if (a.cityId !== b.cityId) changed.push('city')
  if (a.input.yieldKt !== b.input.yieldKt) changed.push('yield')
  if (a.hobMode !== b.hobMode) changed.push('burst mode')
  else if (a.hobMode === 'custom' && a.input.hobM !== b.input.hobM) changed.push('height of burst')
  if (a.input.fissionFraction !== b.input.fissionFraction) changed.push('fission fraction')
  if (a.input.windSpeedMps !== b.input.windSpeedMps || a.input.windDirDeg !== b.input.windDirDeg) changed.push('wind')
  if (a.input.visibilityKm !== b.input.visibilityKm) changed.push('visibility')
  return changed
}

function ring(report: EffectsReport, predicate: (id: string, psi?: number) => boolean): number {
  return report.rings.find((item) => predicate(item.id, item.psi))?.radiusM ?? 0
}

function range(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(meters >= 10_000 ? 0 : 2)} km` : `${Math.round(meters)} m`
}

export function missionObservation(lesson: Lesson, baseline: MissionRunSnapshot, comparison: MissionRunSnapshot): MissionObservation {
  const blastA = ring(baseline.report, (_, psi) => psi === 5)
  const blastB = ring(comparison.report, (_, psi) => psi === 5)
  const promptA = ring(baseline.report, (id) => id === 'rad-500')
  const promptB = ring(comparison.report, (id) => id === 'rad-500')
  if (lesson.observation.kind === 'blast-scale') {
    const ratio = blastA > 0 ? blastB / blastA : 0
    return {
      headline: `${ratio.toFixed(1)}× severe-blast radius`,
      detail: lesson.observation.takeaway,
      baselineValue: range(blastA),
      comparisonValue: range(blastB),
    }
  }
  if (lesson.observation.kind === 'prompt-vs-blast') {
    return {
      headline: promptA > blastA && promptB < blastB ? 'The dominant near-field effect changes' : 'Compare prompt radiation with severe blast',
      detail: lesson.observation.takeaway,
      baselineValue: `500 rem ${range(promptA)} / 5 psi ${range(blastA)}`,
      comparisonValue: `500 rem ${range(promptB)} / 5 psi ${range(blastB)}`,
    }
  }
  const falloutA = baseline.report.fireballTouchesGround
  const falloutB = comparison.report.fireballTouchesGround
  return {
    headline: falloutA && !falloutB ? 'Local fallout switches off' : 'Ground coupling changed',
    detail: lesson.observation.takeaway,
    baselineValue: lesson.observation.kind === 'blast-fallout' ? `${range(blastA)} · fallout ${falloutA ? 'on' : 'off'}` : `fallout ${falloutA ? 'on' : 'off'}`,
    comparisonValue: lesson.observation.kind === 'blast-fallout' ? `${range(blastB)} · fallout ${falloutB ? 'on' : 'off'}` : `fallout ${falloutB ? 'on' : 'off'}`,
  }
}
