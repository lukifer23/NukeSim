import * as THREE from 'three'

/** Closed ribbon that follows the height field so rings sit on the ground. */
export function makeDrapedRing(
  radius: number,
  width: number,
  segs: number,
  heightAt: (x: number, z: number) => number,
  ox: number,
  oz: number,
  lift: number,
): THREE.BufferGeometry {
  const inner = Math.max(1, radius - width / 2)
  const outer = radius + width / 2
  const positions = new Float32Array((segs + 1) * 2 * 3)
  const uvs = new Float32Array((segs + 1) * 2 * 2)
  const indices: number[] = []
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2
    const c = Math.cos(a)
    const s = Math.sin(a)
    const ix = c * inner
    const iz = s * inner
    const oxw = c * outer
    const ozw = s * outer
    const yi = heightAt(ox + ix, oz + iz) + lift
    const yo = heightAt(ox + oxw, oz + ozw) + lift
    const i0 = i * 2
    positions[i0 * 3] = ix
    positions[i0 * 3 + 1] = yi
    positions[i0 * 3 + 2] = iz
    positions[(i0 + 1) * 3] = oxw
    positions[(i0 + 1) * 3 + 1] = yo
    positions[(i0 + 1) * 3 + 2] = ozw
    uvs[i0 * 2] = i / segs
    uvs[i0 * 2 + 1] = 0
    uvs[(i0 + 1) * 2] = i / segs
    uvs[(i0 + 1) * 2 + 1] = 1
    if (i < segs) {
      const a0 = i * 2
      const b0 = a0 + 1
      const c0 = a0 + 2
      const d0 = a0 + 3
      indices.push(a0, b0, c0, b0, d0, c0)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

/** Rewrite a draped ring in place so an expanding shock samples the real height field. */
export function updateDrapedRing(
  geo: THREE.BufferGeometry,
  radius: number,
  width: number,
  heightAt: (x: number, z: number) => number,
  ox: number,
  oz: number,
  lift: number,
  computeNormals = true,
) {
  const pos = geo.attributes.position
  const segs = pos.count / 2 - 1
  const inner = Math.max(1, radius - width / 2)
  const outer = radius + width / 2
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2
    const c = Math.cos(a)
    const s = Math.sin(a)
    const ix = c * inner
    const iz = s * inner
    const oxw = c * outer
    const ozw = s * outer
    const i0 = i * 2
    pos.setXYZ(i0, ix, heightAt(ox + ix, oz + iz) + lift, iz)
    pos.setXYZ(i0 + 1, oxw, heightAt(ox + oxw, oz + ozw) + lift, ozw)
  }
  pos.needsUpdate = true
  if (computeNormals) geo.computeVertexNormals()
}

/** Road ribbon from A→B, skipping water, following terrain. */
export function makeRoadRibbon(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  width: number,
  samples: number,
  heightAt: (x: number, z: number) => number,
  waterAt: (x: number, z: number) => number,
  lift: number,
): THREE.BufferGeometry | null {
  const dx = bx - ax
  const dz = bz - az
  const len = Math.hypot(dx, dz)
  if (len < 8) return null
  const tx = dx / len
  const tz = dz / len
  const nx = -tz
  const nz = tx
  const hw = width / 2
  const pts: Array<{ x: number; z: number; y: number }> = []
  for (let i = 0; i <= samples; i++) {
    const u = i / samples
    const x = ax + dx * u
    const z = az + dz * u
    if (waterAt(x, z) > 0.5) {
      if (pts.length > 1) break
      pts.length = 0
      continue
    }
    pts.push({ x, z, y: heightAt(x, z) + lift })
  }
  if (pts.length < 2) return null
  const positions = new Float32Array(pts.length * 2 * 3)
  const uvs = new Float32Array(pts.length * 2 * 2)
  const indices: number[] = []
  const run = pts.length - 1
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]
    positions[i * 6] = p.x + nx * hw
    positions[i * 6 + 1] = p.y
    positions[i * 6 + 2] = p.z + nz * hw
    positions[i * 6 + 3] = p.x - nx * hw
    positions[i * 6 + 4] = p.y
    positions[i * 6 + 5] = p.z - nz * hw
    const v = i / run
    uvs[i * 4] = 0
    uvs[i * 4 + 1] = v * (len / 40)
    uvs[i * 4 + 2] = 1
    uvs[i * 4 + 3] = v * (len / 40)
    if (i < run) {
      const a0 = i * 2
      indices.push(a0, a0 + 1, a0 + 2, a0 + 1, a0 + 3, a0 + 2)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

export function roadMidpointIsWater(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  waterAt: (x: number, z: number) => number,
): boolean {
  return waterAt((ax + bx) / 2, (az + bz) / 2) > 0.5
}
