import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useSim } from '../state/store'
import { makeRoadRibbon } from './drape'
import type { GeneratedCity } from '../city/types'

type RoadKind = 'asphalt' | 'walk' | 'mark'

const MATERIALS: Record<RoadKind, THREE.MeshStandardMaterialParameters> = {
  asphalt: { color: '#22252a', roughness: 0.97, metalness: 0.03, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 },
  walk: { color: '#4a4d51', roughness: 0.95, metalness: 0.04, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 },
  mark: { color: '#d7b965', roughness: 0.55, metalness: 0.02, transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 },
}

export function Roads() {
  const city = useSim((s) => s.city)
  const geometries = useMemo(() => buildRoads(city), [city])
  return (
    <group>
      {(Object.keys(MATERIALS) as RoadKind[]).map((kind) => {
        const geo = geometries[kind]
        if (!geo) return null
        return (
          <mesh key={kind} geometry={geo} receiveShadow>
            <meshStandardMaterial {...MATERIALS[kind]} />
          </mesh>
        )
      })}
    </group>
  )
}

function buildRoads(city: GeneratedCity): Record<RoadKind, THREE.BufferGeometry | null> {
  const ext = city.biome.extentM
  const half = ext / 2
  const buckets: Record<RoadKind, THREE.BufferGeometry[]> = { asphalt: [], walk: [], mark: [] }
  const push = (ax: number, az: number, bx: number, bz: number, w: number, kind: RoadKind, lift: number) => {
    const len = Math.hypot(bx - ax, bz - az)
    const samples = Math.max(24, Math.round(len / 55))
    const geo = makeRoadRibbon(ax, az, bx, bz, w, samples, city.heightAt, city.waterAt, lift)
    if (geo) buckets[kind].push(geo)
  }
  for (const r of city.roads) {
    const ns = r.d > r.w
    const w = Math.min(r.w, r.d)
    if (ns) {
      push(r.x, -half, r.x, half, w + 7, 'walk', 1.02)
      push(r.x, -half, r.x, half, w, 'asphalt', 1.16)
      if (w >= 18) push(r.x, -half, r.x, half, Math.max(1.6, w * 0.05), 'mark', 1.34)
    } else {
      push(-half, r.z, half, r.z, w + 7, 'walk', 1.02)
      push(-half, r.z, half, r.z, w, 'asphalt', 1.16)
      if (w >= 18) push(-half, r.z, half, r.z, Math.max(1.6, w * 0.05), 'mark', 1.34)
    }
  }
  const merge = (list: THREE.BufferGeometry[]) => (list.length ? mergeGeometries(list, false) : null)
  return { asphalt: merge(buckets.asphalt), walk: merge(buckets.walk), mark: merge(buckets.mark) }
}
