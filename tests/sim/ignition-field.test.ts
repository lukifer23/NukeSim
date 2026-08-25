import { describe, expect, it } from 'vitest'
import { BuildingClass } from '../../src/sim/types'
import { ignitesAt, resetIgnitionCache, ignitionSampleFromStore } from '../../src/scene/ignitionField'

describe('ignition field cache', () => {
  it('returns a stable answer for the same point across callers', () => {
    resetIgnitionCache('run-1')
    const sample = {
      yieldKt: 300,
      hob: 0,
      visibilityKm: 12,
      ox: 0,
      oz: 0,
      ridge: false,
      lineOfSight: () => true,
    }
    const a = ignitesAt(40, 0, 12, BuildingClass.Wood, sample)
    const b = ignitesAt(40, 0, 12, BuildingClass.Wood, sample)
    expect(a).toBe(b)
    expect(typeof a).toBe('boolean')
  })

  it('clears when the run signature changes', () => {
    resetIgnitionCache('run-2')
    const store = {
      yieldKt: 15,
      hobResolved: () => 600,
      visibilityKm: 12,
      impactOffset: { x: 0, z: 0 },
      city: { biome: { id: 'harbor' }, lineOfSight: () => true },
    }
    const sample = ignitionSampleFromStore(store)
    expect(sample.hob).toBe(600)
    expect(sample.ridge).toBe(false)
  })
})
