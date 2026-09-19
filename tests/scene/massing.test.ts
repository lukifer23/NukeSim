import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { massingGeometry, topFootprint } from '../../src/scene/massing'
import type { BuildingVariant } from '../../src/city/types'

const VARIANTS: BuildingVariant[] = [
  'house',
  'rowhouse',
  'walkup',
  'courtyard',
  'tower',
  'stepped',
  'slab',
  'shed',
  'warehouse',
  'bunker',
  'civic',
]

describe('massing geometry', () => {
  it('builds a non-empty unit-boxed geometry for every variant', () => {
    for (const variant of VARIANTS) {
      const geo = massingGeometry(variant)
      expect(geo.attributes.position.count, variant).toBeGreaterThan(0)
      geo.computeBoundingBox()
      const bb = geo.boundingBox
      expect(bb, variant).not.toBeNull()
      expect(bb!.min.x, variant).toBeGreaterThanOrEqual(-0.6)
      expect(bb!.max.x, variant).toBeLessThanOrEqual(0.6)
      expect(bb!.min.z, variant).toBeGreaterThanOrEqual(-0.6)
      expect(bb!.max.z, variant).toBeLessThanOrEqual(0.6)
      expect(bb!.min.y, variant).toBeGreaterThanOrEqual(-0.6)
      expect(bb!.max.y, variant).toBeLessThanOrEqual(0.6)
      expect(topFootprint(geo), variant).toBeGreaterThan(0)
    }
  })

  it('measures the footprint of the highest silhouette ring', () => {
    const box = new THREE.BoxGeometry(1, 1, 1)
    expect(topFootprint(box)).toBeCloseTo(Math.hypot(0.5, 0.5), 5)
  })
})
