import { describe, expect, it } from 'vitest'
import {
  blastGroundRangeM,
  fireballMaxRadiusM,
  fireballPhysicalRadiusM,
  fireballTouchesGround,
  promptGroundRangeM,
  hasLocalFallout,
  resolveHob,
  BurstMode,
  cubeRoot,
  sampleCasualties,
  decodeScenario,
  encodeScenario,
} from '../../src/sim'
import { LESSONS, resolvedLessonSetup } from '../../src/data/lessons'

const approx = (value: number, target: number, tol: number) => {
  const rel = Math.abs(value - target) / Math.max(target, 1e-9)
  expect(rel, `${value} vs ${target} (rel ${rel.toFixed(3)})`).toBeLessThan(tol)
}

describe('cube-root blast scaling', () => {
  it('15 kt ~600 m HOB has 5 psi around 1.6–2.0 km', () => {
    const r = blastGroundRangeM(15, 600, 5)
    expect(r).toBeGreaterThan(1600)
    expect(r).toBeLessThan(2100)
  })

  it('1 Mt optimized airburst has 5 psi around 7 km', () => {
    const hob = resolveHob(1000, BurstMode.OptimizeBlast, 0, 16)
    const r = blastGroundRangeM(1000, hob, 5)
    expect(r).toBeGreaterThan(6000)
    expect(r).toBeLessThan(8500)
  })

  it('1 kt vs 1000 kt 5 psi radius ratio ≈ 10, not 1000', () => {
    const hob1 = resolveHob(1, BurstMode.OptimizeBlast, 0, 16)
    const hob2 = resolveHob(1000, BurstMode.OptimizeBlast, 0, 16)
    const ratio = blastGroundRangeM(1000, hob2, 5) / blastGroundRangeM(1, hob1, 5)
    approx(ratio, 10, 0.12)
    expect(cubeRoot(1000)).toBeCloseTo(10, 5)
  })
})

describe('scenario coordinates', () => {
  it('samples population around the actual ground zero, not the city origin', () => {
    const densityAt = (x: number, z: number) => (Math.hypot(x - 4000, z) < 900 ? 10_000 : 0)
    const atOrigin = sampleCasualties(10, 0, densityAt, 1400, 80)
    const atDistrict = sampleCasualties(10, 0, densityAt, 1400, 80, { x: 4000, z: 0 })
    expect(atDistrict.population).toBeGreaterThan(atOrigin.population * 20)
  })
})

describe('lesson setups', () => {
  it('cube-root day is 1 kt, optimized 5 psi, Port Meridian', () => {
    const setup = resolvedLessonSetup(LESSONS[0])
    expect(setup.cityId).toBe('harbor')
    expect(setup.yieldKt).toBe(1)
    expect(setup.hobMode).toBe(BurstMode.OptimizeBlast)
  })
})

describe('shared scenarios', () => {
  it('round-trips a bounded educational scenario', () => {
    const encoded = encodeScenario({ cityId: 'saddle', munitionId: 'little-boy', yieldKt: 15, hobM: 580, fissionFraction: 1, windSpeedMps: 4, windDirDeg: 180, visibilityKm: 8 })
    expect(decodeScenario(encoded)).toMatchObject({ cityId: 'saddle', yieldKt: 15, hobM: 580, munitionId: 'little-boy' })
  })
})

describe('fireball', () => {
  it('1 Mt max radius is 0.8–1.0 km class', () => {
    const r = fireballMaxRadiusM(1000, false)
    expect(r).toBeGreaterThan(750)
    expect(r).toBeLessThan(1100)
  })

  it('uses the physical radius, not the enlarged surface footprint, for ground coupling', () => {
    const physical = fireballPhysicalRadiusM(300)
    expect(fireballTouchesGround(300, physical * 0.99)).toBe(true)
    expect(fireballTouchesGround(300, physical * 1.01)).toBe(false)
    expect(fireballMaxRadiusM(300, true)).toBeGreaterThan(physical)
  })
})

describe('airburst vs surface', () => {
  it('surface 5 psi is smaller; fallout only when fireball touches', () => {
    const airHob = resolveHob(300, BurstMode.OptimizeBlast, 0, 16)
    const air = blastGroundRangeM(300, airHob, 5)
    const surface = blastGroundRangeM(300, 0, 5)
    expect(surface).toBeLessThan(air)
    expect(hasLocalFallout(300, 0)).toBe(true)
    expect(hasLocalFallout(300, airHob)).toBe(false)
    expect(fireballTouchesGround(300, 0)).toBe(true)
    expect(fireballTouchesGround(300, airHob)).toBe(false)
  })
})

describe('prompt radiation vs blast', () => {
  it('10 kt surface 500 rem outranges 5 psi', () => {
    const rem = promptGroundRangeM(10, 0, 500, 1)
    const blast = blastGroundRangeM(10, 0, 5)
    expect(rem).toBeGreaterThan(blast)
  })

  it('300 kt airburst 500 rem sits inside 5 psi', () => {
    const hob = resolveHob(300, BurstMode.OptimizeBlast, 0, 16)
    const rem = promptGroundRangeM(300, hob, 500, 0.5)
    const blast = blastGroundRangeM(300, hob, 5)
    expect(rem).toBeLessThan(blast)
  })
})
