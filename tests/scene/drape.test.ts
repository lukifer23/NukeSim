import { describe, expect, it } from 'vitest'
import { makeDrapedRing, makeRoadRibbon, roadMidpointIsWater, updateDrapedRing } from '../../src/scene/drape'

const flat = () => 0
const ramp = (x: number, z: number) => x * 0.001 + z * 0.002

describe('draped geometry', () => {
  it('builds a closed ribbon that follows the height field', () => {
    const segs = 8
    const geo = makeDrapedRing(100, 2, segs, ramp, 10, -20, 1)
    const pos = geo.attributes.position
    expect(pos.count).toBe((segs + 1) * 2)
    expect(geo.attributes.uv.count).toBe((segs + 1) * 2)
    expect(geo.index?.count).toBe(segs * 6)
    expect(geo.attributes.normal).toBeTruthy()
    // First inner vertex sits where the height field plus lift says it should.
    expect(pos.getY(0)).toBeCloseTo(ramp(10 + 99, -20) + 1, 5)
  })

  it('rewrites a ring in place without changing its topology', () => {
    const geo = makeDrapedRing(50, 2, 6, flat, 0, 0, 0)
    const before = geo.attributes.position.count
    updateDrapedRing(geo, 200, 2, flat, 0, 0, 5)
    expect(geo.attributes.position.count).toBe(before)
    expect(geo.attributes.position.getY(0)).toBeCloseTo(5, 5)
  })

  it('skips road ribbons that are too short or cross water', () => {
    expect(makeRoadRibbon(0, 0, 4, 0, 4, 8, flat, () => 0, 0)).toBeNull()
    expect(makeRoadRibbon(0, 0, 100, 0, 4, 8, flat, () => 1, 0)).toBeNull()
  })

  it('builds a road ribbon across clear ground', () => {
    const geo = makeRoadRibbon(0, 0, 100, 0, 4, 8, flat, () => 0, 0.5)
    expect(geo).not.toBeNull()
    expect(geo!.attributes.position.count).toBe(9 * 2)
    expect(geo!.attributes.position.getY(0)).toBeCloseTo(0.5, 5)
  })

  it('stops a road ribbon where water begins downstream', () => {
    const waterAt = (x: number) => (x > 50 ? 1 : 0)
    const geo = makeRoadRibbon(0, 0, 100, 0, 4, 20, flat, waterAt, 0)
    expect(geo).not.toBeNull()
    expect(geo!.attributes.position.count).toBeLessThan(21 * 2)
  })

  it('reports whether a road midpoint is water', () => {
    expect(roadMidpointIsWater(0, 0, 100, 0, (x) => (x > 10 ? 1 : 0))).toBe(true)
    expect(roadMidpointIsWater(0, 0, 10, 0, () => 0)).toBe(false)
  })
})
