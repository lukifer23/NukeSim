import * as THREE from 'three'
import type { BuildingVariant } from '../city/types'

/** Unit massing in a 1×1×1 box so instance scale (w, h, d) still applies. */
export function massingGeometry(variant: BuildingVariant): THREE.BufferGeometry {
  switch (variant) {
    case 'tower':
      return taperedBlock(0.3, 0.12)
    case 'slab':
      return taperedBlock(0.07, 0.28)
    case 'bunker':
      return taperedBlock(0.16, -0.05)
    case 'shed':
      return taperedBlock(0.05, 0.2)
    case 'house':
      return taperedBlock(0.04, 0.28)
    default:
      return taperedBlock(0.06, 0.32)
  }
}

/** Inset vertices above `yStart` (−0.5…0.5) by `inset` toward the Y axis. */
export function taperedBlock(inset: number, yStart: number): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(1, 1, 1, 1, 6, 1)
  const pos = g.attributes.position
  const top = 0.5
  const span = Math.max(0.08, top - yStart)
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    if (y <= yStart) continue
    const t = Math.min(1, (y - yStart) / span)
    const s = 1 - inset * t
    pos.setX(i, pos.getX(i) * s)
    pos.setZ(i, pos.getZ(i) * s)
  }
  pos.needsUpdate = true
  g.computeVertexNormals()
  return g
}

export function topFootprint(geo: THREE.BufferGeometry): number {
  const pos = geo.attributes.position
  let maxY = -Infinity
  let r = 0
  for (let i = 0; i < pos.count; i++) maxY = Math.max(maxY, pos.getY(i))
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) < maxY - 0.02) continue
    r = Math.max(r, Math.hypot(pos.getX(i), pos.getZ(i)))
  }
  return r
}
