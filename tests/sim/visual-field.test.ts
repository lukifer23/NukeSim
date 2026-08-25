import { describe, expect, it } from 'vitest'
import { CITIES } from '../../src/data/cities'
import { generateCity } from '../../src/city/generate'
import { vegetationPoints } from '../../src/scene/vegPoints'
import { atmosphereLook } from '../../src/scene/atmosphere'
import { makeDrapedRing, roadMidpointIsWater } from '../../src/scene/drape'
import { craterFor } from '../../src/sim'
import { damagePose } from '../../src/scene/damagePose'
import { DamageState } from '../../src/sim/types'
import { District } from '../../src/city/types'
import { craterReliefM } from '../../src/scene/craterRelief'
import { massingGeometry, topFootprint } from '../../src/scene/massing'
import { buildShore } from '../../src/scene/shore'

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
  it('collapsed pose is intact at k=0 and flattened at k=1', () => {
    const b = {
      x: 0, z: 0, w: 20, d: 16, h: 40, yaw: 0, class: 'masonry' as const,
      occupancy: 10, district: District.Core, variant: 'walkup' as const,
    }
    const a = damagePose(b, DamageState.Collapsed, 0)
    const z = damagePose(b, DamageState.Collapsed, 1)
    expect(a.scaleY).toBeCloseTo(1)
    expect(z.scaleY).toBeLessThan(0.3)
  })
})
