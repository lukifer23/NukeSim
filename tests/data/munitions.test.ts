import { describe, expect, it } from 'vitest'
import { MUNITIONS, YIELD_NOTCHES, munitionById, munitionLabel } from '../../src/data/munitions'

describe('munitions', () => {
  it('has well-formed, unique entries inside the yield envelope', () => {
    const ids = new Set<string>()
    for (const m of MUNITIONS) {
      expect(ids.has(m.id), m.id).toBe(false)
      ids.add(m.id)
      expect(m.yieldMinKt, m.id).toBeLessThanOrEqual(m.yieldKt)
      expect(m.yieldKt, m.id).toBeLessThanOrEqual(m.yieldMaxKt)
      expect(m.fissionFraction, m.id).toBeGreaterThan(0)
      expect(m.fissionFraction, m.id).toBeLessThanOrEqual(1)
      expect(m.blurb.length, m.id).toBeGreaterThan(0)
      expect(m.teaching.length, m.id).toBeGreaterThan(0)
    }
  })

  it('resolves by id and falls back to the first munition', () => {
    expect(munitionById('icbm-mm3').name).toBe('ICBM')
    expect(munitionById('does-not-exist')).toBe(MUNITIONS[0])
  })

  it('labels a preset only while the yield stays in its published band', () => {
    const icbm = munitionById('icbm-mm3')
    expect(munitionLabel('icbm-mm3', icbm.yieldKt)).toBe('ICBM')
    expect(munitionLabel('icbm-mm3', icbm.yieldMinKt)).toBe('ICBM')
    expect(munitionLabel('icbm-mm3', icbm.yieldMaxKt)).toBe('ICBM')
    expect(munitionLabel('icbm-mm3', icbm.yieldMaxKt * 1.5)).toBe('Custom')
    expect(munitionLabel('nope', 10)).toBe('Custom')
  })

  it('keeps every yield notch inside the slider range', () => {
    for (const notch of YIELD_NOTCHES) {
      expect(notch.kt).toBeGreaterThanOrEqual(0.1)
      expect(notch.kt).toBeLessThanOrEqual(50_000)
      expect(notch.label.length).toBeGreaterThan(0)
    }
  })
})
