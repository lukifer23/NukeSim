import { describe, expect, it } from 'vitest'
import {
  completeLessonProgress,
  emptyLessonProgress,
  loadLessonProgress,
  progressStatus,
  type LessonProgressV1,
} from '../../src/learn/progress'
import { MODEL_VERSION } from '../../src/data/model'

function storageReturning(raw: string) {
  return { getItem: () => raw }
}

describe('lesson progress', () => {
  it('counts attempts and ORs a same-model prediction', () => {
    let progress = completeLessonProgress(emptyLessonProgress(), 'knee', false)
    expect(progress.records.knee).toMatchObject({ attempts: 1, predictionCorrect: false, modelVersion: MODEL_VERSION })
    progress = completeLessonProgress(progress, 'knee', true)
    expect(progress.records.knee).toMatchObject({ attempts: 2, predictionCorrect: true })
  })

  it('resets the prediction when the record is from an older model', () => {
    const legacy: LessonProgressV1 = {
      schemaVersion: 1,
      records: {
        knee: { modelVersion: `${MODEL_VERSION}-old`, completedAt: '2020-01-01T00:00:00.000Z', attempts: 4, predictionCorrect: true },
      },
    }
    const next = completeLessonProgress(legacy, 'knee', false)
    expect(next.records.knee.modelVersion).toBe(MODEL_VERSION)
    expect(next.records.knee.attempts).toBe(1)
    expect(next.records.knee.predictionCorrect).toBe(false)
  })

  it('drops malformed records instead of trusting them', () => {
    const loaded = loadLessonProgress(
      storageReturning(
        JSON.stringify({
          schemaVersion: 1,
          records: {
            good: { modelVersion: 'x', completedAt: 'y', attempts: 1, predictionCorrect: true },
            missingFields: { modelVersion: 'x' },
            wrongTypes: { modelVersion: 'x', completedAt: 'y', attempts: 'many', predictionCorrect: true },
            notAnObject: 5,
          },
        }),
      ),
    )
    expect(Object.keys(loaded.records)).toEqual(['good'])
  })

  it('reports status against the current model version', () => {
    expect(progressStatus(undefined)).toBe('not-started')
    expect(progressStatus({ modelVersion: MODEL_VERSION, completedAt: 'x', attempts: 1, predictionCorrect: true })).toBe('completed')
    expect(progressStatus({ modelVersion: 'legacy', completedAt: 'x', attempts: 1, predictionCorrect: true })).toBe('revisit')
  })
})
