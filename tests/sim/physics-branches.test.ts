import { describe, expect, it } from 'vitest'
import {
  BuildingClass,
  DamageState,
  arrivalTimeS,
  blastGroundRangeM,
  cloudHeightAtTimeM,
  damageFromOverpressure,
  dynamicPressurePsi,
  equivalentWindMph,
  fatalityFraction,
  fireballRadiusAtTimeM,
  formatRange,
  formatTime,
  formatYield,
  ignites,
  injuryFraction,
  mushroomCloud,
  overpressureAtRangePsi,
  shockRadiusAtTimeM,
  thermalPulseDurationS,
} from '../../src/sim'

describe('physics branch boundaries', () => {
  it('interpolates blast levels and inverts range and arrival', () => {
    expect(blastGroundRangeM(10, 0, 40)).toBeGreaterThan(0)
    expect(blastGroundRangeM(10, 0, 100)).toBeGreaterThan(0)
    expect(blastGroundRangeM(10, 0, 0.01)).toBeGreaterThan(0)
    expect(overpressureAtRangePsi(10, 0, 0)).toBe(200)
    expect(overpressureAtRangePsi(10, 0, 1e9)).toBeLessThan(0.1)
    expect(arrivalTimeS(10, 0, 1000)).toBeGreaterThan(0)
    expect(shockRadiusAtTimeM(10, 0, 0)).toBe(0)
    expect(shockRadiusAtTimeM(10, 0, 5)).toBeGreaterThan(0)
    expect(dynamicPressurePsi(-1)).toBe(0)
    expect(equivalentWindMph(5)).toBeGreaterThan(100)
  })

  it('covers fireball growth and cloud stabilization', () => {
    expect(thermalPulseDurationS(10)).toBeGreaterThan(0)
    const early = fireballRadiusAtTimeM(10, 0, false)
    const late = fireballRadiusAtTimeM(10, 100, false)
    expect(early).toBe(0)
    expect(late).toBeGreaterThan(early)
    expect(fireballRadiusAtTimeM(10, 100, true)).toBeGreaterThan(late)
    const cloud = mushroomCloud(1000)
    expect(cloudHeightAtTimeM(cloud, -1)).toBe(0)
    expect(cloudHeightAtTimeM(cloud, cloud.stabilizeS * 2)).toBeGreaterThan(cloud.capAltitudeM * 0.9)
  })

  it('covers casualty and material thresholds without mixing effects', () => {
    expect([0, 0.1, 0.2].map(fatalityFraction)).toEqual([0, 0, 0])
    expect(fatalityFraction(0.5)).toBeGreaterThan(0)
    expect(fatalityFraction(1.5)).toBeGreaterThan(0.01)
    expect(fatalityFraction(3)).toBeGreaterThan(0.05)
    expect(fatalityFraction(8)).toBeGreaterThan(0.5)
    expect(fatalityFraction(20)).toBe(0.98)
    expect([0.1, 0.5, 1.5, 3, 8, 20].map(injuryFraction)).toEqual([0, 0.08, 0.25, 0.45, 0.4, 0.02])
    expect(damageFromOverpressure(BuildingClass.Wood, 0, true)).toBe(DamageState.Vaporized)
    expect(damageFromOverpressure(BuildingClass.Wood, 4, false)).toBe(DamageState.Collapsed)
    expect(damageFromOverpressure(BuildingClass.Masonry, 4, false)).toBe(DamageState.Severe)
    expect(damageFromOverpressure(BuildingClass.Steel, 2.5, false)).toBe(DamageState.Moderate)
    expect(damageFromOverpressure(BuildingClass.Concrete, 1.5, false)).toBe(DamageState.Glass)
    expect(damageFromOverpressure(BuildingClass.Heavy, 0.2, false)).toBe(DamageState.Intact)
    expect(ignites(20, 10, BuildingClass.Wood)).toBe(true)
    expect(ignites(10, 10, BuildingClass.Steel)).toBe(false)
  })

  it('formats every public scale boundary', () => {
    expect(formatRange(0)).toBe('—')
    expect(formatRange(999)).toBe('999 m')
    expect(formatRange(1500)).toBe('1.50 km')
    expect(formatYield(0.3)).toBe('0.30 kt')
    expect(formatYield(2)).toBe('2.0 kt')
    expect(formatYield(20)).toBe('20 kt')
    expect(formatYield(1000)).toBe('1.00 Mt')
    expect(formatYield(20_000)).toBe('20 Mt')
    expect(formatTime(0.0001)).toBe('100 µs')
    expect(formatTime(0.5)).toBe('500 ms')
    expect(formatTime(5)).toBe('5.0 s')
    expect(formatTime(90)).toBe('1.5 min')
    expect(formatTime(7200)).toBe('2.0 h')
  })
})
