import { describe, expect, it } from 'vitest'
import { cloudCameraFrame, detonationCameraFrame } from '../../src/scene/cameraFrame'
import { cloudHeightAtTimeM, mushroomCloud } from '../../src/sim/cloud'

describe('detonation camera framing', () => {
  it('backs away as yield and burst height increase', () => {
    const small = detonationCameraFrame(10, 442)
    const large = detonationCameraFrame(1000, 2052)
    expect(large.startDistance).toBeGreaterThan(small.startDistance * 3)
    expect(large.cameraHeight).toBeGreaterThan(small.cameraHeight)
  })

  it('allocates more distance to a narrow viewport', () => {
    const wide = detonationCameraFrame(300, 1300, 46, 16 / 9)
    const narrow = detonationCameraFrame(300, 1300, 46, 1)
    expect(narrow.startDistance).toBeGreaterThan(wide.startDistance)
  })
})

describe('cloud camera framing', () => {
  it('looks at the visual cap of a risen 10 kt cloud, not the fireball foot', () => {
    const cloud = mushroomCloud(10)
    const height = cloudHeightAtTimeM(cloud, 90)
    const fire = detonationCameraFrame(10, 442)
    const cam = cloudCameraFrame(height)
    expect(height).toBeGreaterThan(4000)
    expect(cam.lookY).toBeGreaterThan(fire.lookY * 4)
    // The look target sits above the cap centre-line of the full column.
    expect(cam.lookY).toBeGreaterThan(height * 0.6)
    expect(cam.cameraHeight).toBeLessThan(cam.lookY)
  })

  it('keeps a megaton cap inside fog range with the look target in the cap', () => {
    const cloud = mushroomCloud(1000)
    const height = cloudHeightAtTimeM(cloud, 90)
    const cam = cloudCameraFrame(height)
    expect(height).toBeGreaterThan(12000)
    expect(cam.lookY).toBeGreaterThan(height * 0.6)
    expect(cam.endDistance).toBeLessThanOrEqual(34000)
    expect(cam.cameraHeight).toBeLessThan(cam.lookY)
  })

  it('raises the look target as the cloud grows, then clamps a 50 km cap', () => {
    const early = cloudCameraFrame(800)
    const late = cloudCameraFrame(9000)
    const huge = cloudCameraFrame(50000)
    expect(late.lookY).toBeGreaterThan(early.lookY * 8)
    expect(huge.endDistance).toBeLessThanOrEqual(34000)
    expect(huge.lookY).toBeCloseTo(18000 * 1.22 * 0.5, 0)
  })
})
