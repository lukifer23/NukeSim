import * as THREE from 'three'
import type { BuildingVariant } from '../city/types'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/** Unit massing in a 1×1×1 box so instance scale (w, h, d) still applies. */
export function massingGeometry(variant: BuildingVariant): THREE.BufferGeometry {
  switch (variant) {
    case 'tower':
      return taperedBlock(0.3, 0.12)
    case 'stepped':
      return steppedTower()
    case 'slab':
      return taperedBlock(0.07, 0.28)
    case 'courtyard':
      return courtyardBlock()
    case 'bunker':
      return taperedBlock(0.16, -0.05)
    case 'civic':
      return new THREE.CylinderGeometry(0.5, 0.5, 1, 8)
    case 'shed':
      return taperedBlock(0.05, 0.2)
    case 'warehouse':
      return taperedBlock(0.12, 0.05)
    case 'house':
      return taperedBlock(0.04, 0.28)
    case 'rowhouse':
      return taperedBlock(0.02, 0.38)
    default:
      return taperedBlock(0.06, 0.32)
  }
}

function steppedTower(): THREE.BufferGeometry {
  const lower = new THREE.BoxGeometry(1, 0.42, 1).translate(0, -0.29, 0)
  const middle = new THREE.BoxGeometry(0.78, 0.34, 0.82).translate(0, 0.09, 0)
  const crown = new THREE.BoxGeometry(0.56, 0.24, 0.62).translate(0, 0.38, 0)
  return mergeGeometries([lower, middle, crown], false)
}

function courtyardBlock(): THREE.BufferGeometry {
  const north = new THREE.BoxGeometry(1, 1, 0.28).translate(0, 0, -0.36)
  const south = new THREE.BoxGeometry(1, 1, 0.28).translate(0, 0, 0.36)
  const east = new THREE.BoxGeometry(0.28, 1, 0.44).translate(0.36, 0, 0)
  const west = new THREE.BoxGeometry(0.28, 1, 0.44).translate(-0.36, 0, 0)
  return mergeGeometries([north, south, east, west], false)
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
