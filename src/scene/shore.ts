import * as THREE from 'three'

const GRID = 128

export function buildShore(city: {
  biome: { extentM: number }
  waterAt: (x: number, z: number) => number
  heightAt: (x: number, z: number) => number
}) {
  const ext = city.biome.extentM * 1.35
  const half = ext / 2
  const step = ext / GRID
  const positions: number[] = []
  const bases: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const indexAt = new Int32Array((GRID + 1) * (GRID + 1)).fill(-1)
  let n = 0
  for (let j = 0; j <= GRID; j++) {
    for (let i = 0; i <= GRID; i++) {
      const x = -half + i * step
      const z = -half + j * step
      if (city.waterAt(x, z) <= 0.5) continue
      const y = city.heightAt(x, z) + 0.7
      indexAt[j * (GRID + 1) + i] = n++
      positions.push(x, y, z)
      bases.push(y)
      uvs.push((x + half) / ext, (z + half) / ext)
    }
  }
  if (n < 3) return null
  for (let j = 0; j < GRID; j++) {
    for (let i = 0; i < GRID; i++) {
      const a = indexAt[j * (GRID + 1) + i]
      const b = indexAt[j * (GRID + 1) + i + 1]
      const c = indexAt[(j + 1) * (GRID + 1) + i]
      const d = indexAt[(j + 1) * (GRID + 1) + i + 1]
      if (a < 0 || b < 0 || c < 0 || d < 0) continue
      indices.push(a, c, b, b, c, d)
    }
  }
  if (indices.length < 3) return null
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
  g.setAttribute('baseY', new THREE.BufferAttribute(new Float32Array(bases), 1))
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2))
  g.setIndex(indices)
  g.computeVertexNormals()
  return g
}
