import { describe, expect, it } from 'vitest'
import { computeEffects, ringById, ringByPsi } from '../../src/sim'

describe('report ring lookup', () => {
  const report = computeEffects({
    yieldKt: 100,
    hobM: 0,
    fissionFraction: 0.5,
    windSpeedMps: 5,
    windDirDeg: 0,
    visibilityKm: 12,
  })

  it('finds blast rings by psi and named rings by id', () => {
    expect(ringByPsi(report, 5)?.psi).toBe(5)
    expect(ringById(report, 'fireball')?.id).toBe('fireball')
    expect(ringById(report, 'rad-500')?.id).toBe('rad-500')
  })

  it('returns undefined for absent rings', () => {
    expect(ringByPsi(report, 999)).toBeUndefined()
    expect(ringById(report, 'nope')).toBeUndefined()
  })
})
