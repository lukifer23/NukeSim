import { MODEL_VERSION } from '../data/model'
import { safeStorage } from '../state/storage'

export const LESSON_PROGRESS_KEY = 'nukesim.lesson-progress.v1'

export type LessonProgressRecord = {
  modelVersion: string
  completedAt: string
  attempts: number
  predictionCorrect: boolean
}

export type LessonProgressV1 = {
  schemaVersion: 1
  records: Record<string, LessonProgressRecord>
}

export function emptyLessonProgress(): LessonProgressV1 {
  return { schemaVersion: 1, records: {} }
}

export function loadLessonProgress(storage: Pick<Storage, 'getItem'> | null = safeStorage()): LessonProgressV1 {
  if (!storage) return emptyLessonProgress()
  const raw = storage.getItem(LESSON_PROGRESS_KEY)
  if (!raw) return emptyLessonProgress()
  try {
    const value = JSON.parse(raw) as Partial<LessonProgressV1>
    if (value.schemaVersion !== 1 || !value.records || typeof value.records !== 'object') return emptyLessonProgress()
    const records: Record<string, LessonProgressRecord> = {}
    for (const [id, record] of Object.entries(value.records)) {
      if (isProgressRecord(record)) records[id] = record
    }
    return { schemaVersion: 1, records }
  } catch {
    return emptyLessonProgress()
  }
}

function isProgressRecord(value: unknown): value is LessonProgressRecord {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return (
    typeof record.modelVersion === 'string' &&
    typeof record.completedAt === 'string' &&
    typeof record.attempts === 'number' &&
    Number.isFinite(record.attempts) &&
    record.attempts >= 0 &&
    typeof record.predictionCorrect === 'boolean'
  )
}

export function saveLessonProgress(progress: LessonProgressV1, storage: Pick<Storage, 'setItem'> | null = safeStorage()): void {
  if (!storage) return
  try {
    storage.setItem(LESSON_PROGRESS_KEY, JSON.stringify(progress))
  } catch {
    // Storage can be unavailable in private browsing. The mission still works for this session.
  }
}

export function completeLessonProgress(
  progress: LessonProgressV1,
  lessonId: string,
  predictionCorrect: boolean,
  now = new Date().toISOString(),
): LessonProgressV1 {
  const prior = progress.records[lessonId]
  // A prior run under an older model version is only a "revisit"; its
  // prediction must not count toward the current model's completion.
  const sameModel = prior?.modelVersion === MODEL_VERSION
  return {
    schemaVersion: 1,
    records: {
      ...progress.records,
      [lessonId]: {
        modelVersion: MODEL_VERSION,
        completedAt: now,
        attempts: (sameModel ? prior.attempts : 0) + 1,
        predictionCorrect: (sameModel && prior.predictionCorrect) || predictionCorrect,
      },
    },
  }
}

export function progressStatus(record: LessonProgressRecord | undefined): 'not-started' | 'completed' | 'revisit' {
  if (!record) return 'not-started'
  return record.modelVersion === MODEL_VERSION ? 'completed' : 'revisit'
}
