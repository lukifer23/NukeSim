import { describe, expect, it } from 'vitest'
import { LESSONS } from '../../src/data/lessons'
import {
  expectedMissionScenario,
  missionChangedInputs,
  missionObservation,
  missionScenarioMatches,
  newMissionSession,
  type MissionRunSnapshot,
} from '../../src/learn/mission'
import {
  completeLessonProgress,
  emptyLessonProgress,
  loadLessonProgress,
  progressStatus,
  saveLessonProgress,
} from '../../src/learn/progress'
import { computeEffects, resolveHob } from '../../src/sim'

function snapshot(lessonIndex: number, stage: 'baseline' | 'comparison'): MissionRunSnapshot {
  const lesson = LESSONS[lessonIndex]
  const expected = expectedMissionScenario(lesson, stage)
  const hobM = resolveHob(expected.yieldKt, expected.hobMode, expected.customHobM, 12)
  const input = { yieldKt: expected.yieldKt, hobM, fissionFraction: 1, windSpeedMps: 6, windDirDeg: 35, visibilityKm: 12 }
  return { label: stage, cityId: expected.cityId, hobMode: expected.hobMode, input, report: computeEffects(input) }
}

describe('guided missions', () => {
  it('creates a predictable initial mission and matches each declared scenario', () => {
    expect(newMissionSession('cube-root')).toMatchObject({ step: 'predict', predictionIndex: null })
    for (const lesson of LESSONS) {
      const expected = expectedMissionScenario(lesson, 'baseline')
      expect(missionScenarioMatches(lesson, 'baseline', expected)).toBe(true)
      expect(missionScenarioMatches(lesson, 'baseline', { ...expected, yieldKt: expected.yieldKt * 1.1 })).toBe(false)
    }
  })

  it('treats optimized HOB movement as derived rather than a direct change', () => {
    const a = snapshot(0, 'baseline')
    const b = snapshot(0, 'comparison')
    expect(a.input.hobM).not.toBe(b.input.hobM)
    expect(missionChangedInputs(a, b)).toEqual(['yield'])
  })

  it('computes observations from captured reports for all four lessons', () => {
    const observations = LESSONS.map((lesson, index) => missionObservation(lesson, snapshot(index, 'baseline'), snapshot(index, 'comparison')))
    expect(observations[0].headline).toMatch(/10\.0×/)
    expect(observations[1].headline).toBe('Local fallout switches off')
    expect(observations[2].headline).toBe('Local fallout switches off')
    expect(observations[3].headline).toBe('The dominant near-field effect changes')
  })
})

describe('local lesson progress', () => {
  it('round-trips versioned progress and preserves a correct best result', () => {
    let raw = ''
    const storage = {
      getItem: () => raw,
      setItem: (_key: string, value: string) => { raw = value },
    }
    let progress = completeLessonProgress(emptyLessonProgress(), 'cube-root', true, '2026-08-21T00:00:00.000Z')
    progress = completeLessonProgress(progress, 'cube-root', false, '2026-08-22T00:00:00.000Z')
    saveLessonProgress(progress, storage)
    const loaded = loadLessonProgress(storage)
    expect(loaded.records['cube-root']).toMatchObject({ attempts: 2, predictionCorrect: true })
    expect(progressStatus(loaded.records['cube-root'])).toBe('completed')
  })

  it('fails closed on corrupt storage', () => {
    expect(loadLessonProgress({ getItem: () => '{bad json' })).toEqual(emptyLessonProgress())
  })
})
