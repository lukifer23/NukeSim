import { describe, expect, it } from 'vitest'
import { fieldMoment } from '../../src/ui/fieldMoment'

describe('educational timeline moments', () => {
  it('moves from flash through shock and aftermath', () => {
    expect(fieldMoment(0, false).label).toBe('Flash')
    expect(fieldMoment(0.5, false).label).toBe('Fireball growth')
    expect(fieldMoment(4, false).label).toBe('Shock front')
    expect(fieldMoment(45, false).label).toBe('Cloud rise')
    expect(fieldMoment(120, false).label).toBe('Early aftermath')
  })

  it('only describes fallout progression when the field is active', () => {
    expect(fieldMoment(7200, true).label).toBe('Fallout progression')
    expect(fieldMoment(7200, false).label).toBe('Long-term view')
  })
})
