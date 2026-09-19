import { describe, expect, it } from 'vitest'
import { parseDraft } from '../../src/state/draft'

const valid = {
  schemaVersion: 1,
  cityId: 'harbor',
  munitionId: 'gravity-b61',
  yieldKt: 1000,
  hobMode: 'custom',
  customHobM: 0,
  fissionFraction: 0.5,
  windSpeedMps: 6,
  windDirDeg: 35,
  visibilityKm: 12,
  timeOfDay: 0.6,
  overlays: { blast: true, thermal: true, radiation: false, fallout: false, fireball: true },
  cameraMode: 'cloud',
}

describe('scenario draft', () => {
  it('round-trips a valid draft', () => {
    const parsed = parseDraft(JSON.stringify(valid))
    expect(parsed).toEqual(valid)
  })

  it('treats view state as optional for older drafts', () => {
    const legacy: Record<string, unknown> = { ...valid }
    delete legacy.overlays
    delete legacy.cameraMode
    expect(parseDraft(JSON.stringify(legacy))).toEqual(legacy)

    const malformed = parseDraft(JSON.stringify({ ...legacy, overlays: { blast: 'yes' }, cameraMode: 'orbit' }))
    expect(malformed).not.toBeNull()
    expect(malformed?.overlays).toBeUndefined()
    expect(malformed?.cameraMode).toBeUndefined()
  })

  it('rejects missing, malformed, and unknown-field data', () => {
    expect(parseDraft(null)).toBeNull()
    expect(parseDraft('not json')).toBeNull()
    expect(parseDraft('{}')).toBeNull()
    expect(parseDraft(JSON.stringify({ ...valid, schemaVersion: 2 }))).toBeNull()
    expect(parseDraft(JSON.stringify({ ...valid, cityId: 'atlantis' }))).toBeNull()
    expect(parseDraft(JSON.stringify({ ...valid, munitionId: 'nope' }))).toBeNull()
    expect(parseDraft(JSON.stringify({ ...valid, hobMode: 'teleport' }))).toBeNull()
    expect(parseDraft(JSON.stringify({ ...valid, yieldKt: Number.NaN }))).toBeNull()
  })

  it('clamps out-of-range numbers into the model envelope', () => {
    const parsed = parseDraft(JSON.stringify({ ...valid, yieldKt: 9e9, visibilityKm: -4, timeOfDay: 3, windDirDeg: 900 }))
    expect(parsed?.yieldKt).toBe(50_000)
    expect(parsed?.visibilityKm).toBe(2)
    expect(parsed?.timeOfDay).toBe(1)
    expect(parsed?.windDirDeg).toBe(359)
  })
})
