import { useMemo } from 'react'
import { useSim } from '../state/store'
import { makeRoadRibbon } from './drape'
import type { GeneratedCity } from '../city/types'

export function Roads() {
  const city = useSim((s) => s.city)
  const meshes = useMemo(() => buildRoads(city), [city])
  return (
    <group>
      {meshes.map((m, i) => (
        <mesh key={i} geometry={m.geo} receiveShadow>
          <meshStandardMaterial
            color={m.kind === 'mark' ? '#d7b965' : m.kind === 'walk' ? '#3c3f42' : '#1f2226'}
            roughness={m.kind === 'mark' ? 0.5 : 0.96}
            metalness={0.04}
            transparent={m.kind === 'mark'}
            opacity={m.kind === 'mark' ? 0.4 : 1}
            depthWrite={m.kind !== 'mark'}
          />
        </mesh>
      ))}
    </group>
  )
}

function buildRoads(city: GeneratedCity) {
  const ext = city.biome.extentM
  const half = ext / 2
  const out: Array<{ geo: NonNullable<ReturnType<typeof makeRoadRibbon>>; kind: 'asphalt' | 'walk' | 'mark' }> = []
  const push = (
    ax: number,
    az: number,
    bx: number,
    bz: number,
    w: number,
    samples: number,
    kind: 'asphalt' | 'walk' | 'mark',
    lift: number,
  ) => {
    const geo = makeRoadRibbon(ax, az, bx, bz, w, samples, city.heightAt, city.waterAt, lift)
    if (geo) out.push({ geo, kind })
  }
  for (const r of city.roads) {
    const ns = r.d > r.w
    const w = Math.min(r.w, r.d)
    if (ns) {
      push(r.x, -half, r.x, half, w + 7, 40, 'walk', 1.02)
      push(r.x, -half, r.x, half, w, 40, 'asphalt', 1.16)
      if (w >= 18) push(r.x, -half, r.x, half, 1.8, 40, 'mark', 1.34)
    } else {
      push(-half, r.z, half, r.z, w + 7, 40, 'walk', 1.02)
      push(-half, r.z, half, r.z, w, 40, 'asphalt', 1.16)
      if (w >= 18) push(-half, r.z, half, r.z, 1.8, 40, 'mark', 1.34)
    }
  }
  return out
}
