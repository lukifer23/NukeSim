import * as THREE from 'three'
import type { BuildingVariant } from '../city/types'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

function merge(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = mergeGeometries(parts, false)
  if (!merged) throw new Error('massing merge failed')
  return merged
}

/**
 * Unit massing in a 1×1×1 box so instance scale (w, h, d) still applies.
 * Shapes are composed from slabs rather than a single tapered box: real
 * skylines read as stacked prisms with cornices and setbacks, not pyramids.
 */
export function massingGeometry(variant: BuildingVariant): THREE.BufferGeometry {
  switch (variant) {
    case 'tower':
      return merge([
        box(1, 0.74, 1, 0, -0.13, 0),
        box(0.78, 0.42, 0.8, 0, 0.29, 0),
        box(0.84, 0.045, 0.86, 0, 0.48, 0),
      ])
    case 'stepped':
      return steppedTower()
    case 'slab':
      return merge([
        box(1, 0.97, 1, 0, -0.015, 0),
        box(1.04, 0.045, 1.04, 0, 0.47, 0),
      ])
    case 'courtyard':
      return courtyardBlock()
    case 'bunker':
      return merge([
        box(1, 0.62, 1, 0, -0.19, 0),
        box(1.05, 0.05, 1.05, 0, 0.12, 0),
      ])
    case 'civic':
      return merge([
        box(1, 0.08, 1, 0, -0.46, 0),
        new THREE.CylinderGeometry(0.46, 0.5, 0.9, 16).translate(0, 0.03, 0),
        new THREE.CylinderGeometry(0.5, 0.44, 0.06, 16).translate(0, 0.5, 0),
      ])
    case 'shed':
      return merge([
        box(1, 0.84, 1, 0, -0.08, 0),
        box(1.03, 0.04, 1.03, 0, 0.35, 0),
      ])
    case 'warehouse':
      return merge([
        box(1, 0.9, 1, 0, -0.05, 0),
        box(1.03, 0.05, 1.03, 0, 0.42, 0),
        // Sawtooth strip along the long axis reads as an industrial roof.
        box(1.02, 0.12, 0.16, 0, 0.5, 0.42),
        box(1.02, 0.12, 0.16, 0, 0.5, 0.14),
        box(1.02, 0.12, 0.16, 0, 0.5, -0.14),
        box(1.02, 0.12, 0.16, 0, 0.5, -0.42),
      ])
    case 'house':
      return merge([
        box(1, 0.94, 1, 0, -0.03, 0),
        box(1.04, 0.05, 1.04, 0, 0.44, 0),
      ])
    case 'rowhouse':
      return merge([
        box(1, 0.94, 1, 0, -0.03, 0),
        box(1.05, 0.05, 1.05, 0, 0.44, 0),
        box(1.05, 0.06, 0.18, 0, -0.47, 0),
      ])
    default:
      // walkup
      return merge([
        box(1, 0.96, 1, 0, -0.02, 0),
        box(1.04, 0.05, 1.04, 0, 0.46, 0),
        box(1.04, 0.07, 1.04, 0, -0.465, 0),
      ])
  }
}

function box(w: number, h: number, d: number, cx: number, cy: number, cz: number): THREE.BufferGeometry {
  return new THREE.BoxGeometry(w, h, d).translate(cx, cy, cz)
}

function steppedTower(): THREE.BufferGeometry {
  return merge([
    box(1, 0.42, 1, 0, -0.29, 0),
    box(0.78, 0.34, 0.82, 0, 0.06, 0),
    box(0.58, 0.26, 0.62, 0, 0.35, 0),
    box(0.64, 0.04, 0.68, 0, 0.5, 0),
  ])
}

function courtyardBlock(): THREE.BufferGeometry {
  // Perimeter cornice strips only — a full top slab would read as a plate
  // floating over the courtyard.
  return merge([
    new THREE.BoxGeometry(1, 1, 0.26).translate(0, 0, -0.37),
    new THREE.BoxGeometry(1, 1, 0.26).translate(0, 0, 0.37),
    new THREE.BoxGeometry(0.26, 1, 0.48).translate(0.37, 0, 0),
    new THREE.BoxGeometry(0.26, 1, 0.48).translate(-0.37, 0, 0),
    new THREE.BoxGeometry(1.05, 0.05, 0.3).translate(0, 0.475, -0.37),
    new THREE.BoxGeometry(1.05, 0.05, 0.3).translate(0, 0.475, 0.37),
    new THREE.BoxGeometry(0.3, 0.05, 0.44).translate(0.37, 0.475, 0),
    new THREE.BoxGeometry(0.3, 0.05, 0.44).translate(-0.37, 0.475, 0),
  ])
}

/** Radius of the highest silhouette ring; used to check crown insets. */
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
