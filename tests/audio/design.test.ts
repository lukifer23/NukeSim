import { describe, expect, it } from 'vitest'
import { blastSound } from '../../src/audio/design'

describe('blast sound scaling', () => {
  it('stays finite and bounded across the yield range', () => {
    for (const yieldKt of [0.05, 0.3, 10, 1000, 50_000]) {
      const s = blastSound(yieldKt)
      expect(Number.isFinite(s.size)).toBe(true)
      expect(s.size).toBeGreaterThanOrEqual(0.45)
      expect(s.size).toBeLessThanOrEqual(2.2)
      expect(s.rumbleLenS).toBeGreaterThan(3)
      expect(s.rumbleF0Hz).toBeGreaterThan(s.rumbleF1Hz)
      expect(s.whooshF0Hz).toBeGreaterThan(s.whooshF1Hz)
      expect(s.rumbleGain).toBeGreaterThan(0)
      expect(s.subF0Hz).toBeGreaterThan(0)
    }
  })

  it('grows longer and lower as yield rises', () => {
    const small = blastSound(1)
    const large = blastSound(1000)
    expect(large.size).toBeGreaterThan(small.size)
    expect(large.rumbleLenS).toBeGreaterThan(small.rumbleLenS)
    expect(large.rumbleF0Hz).toBeLessThan(small.rumbleF0Hz)
    expect(large.subF0Hz).toBeLessThan(small.subF0Hz)
  })

  it('clamps yields below the minimum', () => {
    expect(blastSound(0)).toEqual(blastSound(0.05))
    expect(blastSound(-4)).toEqual(blastSound(0.05))
  })
})
