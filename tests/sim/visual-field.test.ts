import { describe, expect, it } from 'vitest'
import { CITIES } from '../../src/data/cities'
import { generateCity } from '../../src/city/generate'
import { vegetationPoints } from '../../src/scene/vegPoints'
import { atmosphereLook } from '../../src/scene/atmosphere'
import { makeDrapedRing, roadMidpointIsWater } from '../../src/scene/drape'
import { craterFor } from '../../src/sim'
import { damageAmount, damagePose, damageProgress } from '../../src/scene/damagePose'
import { DamageState } from '../../src/sim/types'
import { District } from '../../src/city/types'
import { craterReliefM } from '../../src/scene/craterRelief'
import { massingGeometry, topFootprint } from '../../src/scene/massing'
import { buildShore } from '../../src/scene/shore'
import { buildingVisualEvent } from '../../src/scene/buildingVisualEvent'

describe('atmosphere', () => {
  it('returns finite lighting for night and noon on every biome', () => {
    for (const biome of CITIES) {
      const night = atmosphereLook(0.05, biome)
      const noon = atmosphereLook(0.9, biome)
      expect(night.sunInt).toBeLessThan(noon.sunInt)
      expect(night.fogFar).toBeGreaterThan(25000)
      expect(noon.fogFar).toBeGreaterThan(25000)
      expect(noon.exposure).toBeGreaterThan(0.5)
    }
  })
})

describe('vegetation', () => {
  it('harbor parks grow trees; dune is sparse scrub', () => {
    const harbor = vegetationPoints(generateCity(CITIES[0]))
    const dune = vegetationPoints(generateCity(CITIES[2]))
    expect(harbor.length).toBeGreaterThan(dune.length)
    expect(dune.every((p) => p.kind === 'scrub' || p.kind === 'yard')).toBe(true)
  })
})

describe('roads vs water', () => {
  it('a segment whose midpoint is water is flagged', () => {
    const city = generateCity(CITIES[0])
    const wet = city.waterAt(0, -city.biome.extentM * 0.45) > 0.5
    if (wet) {
      expect(roadMidpointIsWater(0, -city.biome.extentM * 0.5, 0, -city.biome.extentM * 0.4, city.waterAt)).toBe(true)
    }
    expect(roadMidpointIsWater(0, 400, 0, 800, city.waterAt)).toBe(false)
  })
})

describe('draped shock ring', () => {
  it('samples terrain at the requested radius, not at 1 m', () => {
    const heightAt = (x: number, z: number) => (Math.hypot(x, z) > 80 ? 25 : 0)
    const geo = makeDrapedRing(100, 12, 16, heightAt, 0, 0, 0)
    const y = geo.attributes.position.getY(0)
    expect(y).toBeGreaterThan(20)
  })
})

describe('crater visual contract', () => {
  it('airburst has no crater; surface burst does', () => {
    expect(craterFor(300, 2000, 400)).toBeNull()
    const c = craterFor(300, 0, 400)
    expect(c).not.toBeNull()
    expect(c!.diameterM).toBeGreaterThan(50)
  })

  it('relief is a smooth bowl with a lip, not a faceted step', () => {
    const c = craterFor(1000, 0, 400)!
    const r = c.diameterM / 2
    expect(craterReliefM(0, r, c.depthM)).toBeLessThan(-c.depthM * 0.9)
    expect(craterReliefM(r, r, c.depthM)).toBeGreaterThan(0)
    expect(craterReliefM(r * 1.4, r, c.depthM)).toBe(0)
    const a = craterReliefM(r * 0.4, r, c.depthM)
    const b = craterReliefM(r * 0.41, r, c.depthM)
    expect(Math.abs(a - b)).toBeLessThan(c.depthM * 0.05)
  })
})

describe('building massing', () => {
  it('towers inset the crown; walkups stay closer to a block', () => {
    const tower = massingGeometry('tower')
    const walkup = massingGeometry('walkup')
    expect(topFootprint(tower)).toBeLessThan(topFootprint(walkup) * 0.85)
  })
})

describe('ocean shore', () => {
  it('harbor water follows a meandering shoreline, not a rectangle', () => {
    const city = generateCity(CITIES[0])
    const shoreZ = (x: number) => {
      let lo = -city.biome.extentM
      let hi = city.biome.extentM
      for (let i = 0; i < 28; i++) {
        const mid = (lo + hi) / 2
        if (city.waterAt(x, mid) > 0.5) lo = mid
        else hi = mid
      }
      return lo
    }
    const samples = []
    for (let x = -2600; x <= 2600; x += 200) samples.push(shoreZ(x))
    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(50)
    const mesh = buildShore(city)
    expect(mesh).not.toBeNull()
    expect(mesh!.getAttribute('position').count).toBeGreaterThan(80)
  })
})

describe('damage interpolation', () => {
  it('crushes a collapsing building progressively instead of swapping instantly', () => {
    const b = {
      x: 0, z: 0, w: 20, d: 16, h: 40, yaw: 0, class: 'masonry' as const,
      occupancy: 10, district: District.Core, variant: 'walkup' as const,
      seed: 0.42, podiumH: 0,
    }
    const a = damagePose(b, DamageState.Collapsed, 0)
    const mid = damagePose(b, DamageState.Collapsed, 0.5)
    const z = damagePose(b, DamageState.Collapsed, 1)
    expect(a.scaleY).toBeCloseTo(1)
    expect(mid.scaleY).toBeLessThan(1)
    expect(mid.scaleY).toBeGreaterThan(0.3)
    expect(z.scaleY).toBeLessThan(0.3)
    // The mound spreads as the floors pancake.
    expect(z.scaleX).toBeGreaterThan(1)
    expect(z.sunk).toBeGreaterThan(0)
  })

  it('creates deterministic visual events from the same field', () => {
    const b = {
      x: 120, z: -80, w: 20, d: 16, h: 40, yaw: 0, class: 'masonry' as const,
      occupancy: 10, district: District.Core, variant: 'walkup' as const,
      seed: 0.42, podiumH: 0,
    }
    const field = { yieldKt: 100, hobM: 0, fireballRadiusM: 140, impactX: 0, impactZ: 0, ignites: () => true }
    expect(buildingVisualEvent(b, field)).toEqual(buildingVisualEvent(b, field))
    expect(buildingVisualEvent(b, field)).toMatchObject({ ignites: true, seed: 0.42 })
  })
})

describe('destruction depth', () => {
  const b = {
    x: 100, z: 0, w: 20, d: 16, h: 40, yaw: 0, class: 'masonry' as const,
    occupancy: 10, district: District.Core, variant: 'walkup' as const,
      seed: 0.42, podiumH: 0,
  }

  it('topples away from ground zero when a lean direction is given', () => {
    const outward = damagePose(b, DamageState.Collapsed, 1, { x: 1, z: 0 })
    const inward = damagePose(b, DamageState.Collapsed, 1, { x: -1, z: 0 })
    expect(outward.tiltZ).toBeLessThan(0)
    expect(inward.tiltZ).toBeGreaterThan(0)
    expect(Math.abs(outward.tiltX)).toBeLessThan(0.2)
  })

  it('staggers severe and collapsed failures but not glass', () => {
    expect(damageProgress(DamageState.Intact, 0.9, 5)).toBe(0)
    expect(damageProgress(DamageState.Collapsed, 0.9, 0)).toBe(0)
    expect(damageProgress(DamageState.Collapsed, 0.9, 5)).toBe(1)
    expect(damageProgress(DamageState.Severe, 0.9, 0)).toBe(0)
    expect(damageProgress(DamageState.Severe, 0.9, 5)).toBe(1)
    expect(damageProgress(DamageState.Glass, 0.9, 1)).toBe(1)
  })

  it('maps damage states to facade shatter', () => {
    expect(damageAmount(DamageState.Intact)).toBe(0)
    expect(damageAmount(DamageState.Glass)).toBeGreaterThan(0)
    expect(damageAmount(DamageState.Severe)).toBeGreaterThan(damageAmount(DamageState.Moderate))
    expect(damageAmount(DamageState.Collapsed)).toBe(1)
    expect(damageAmount(DamageState.Vaporized)).toBe(1)
  })
})
