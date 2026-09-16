import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSim } from '../state/store'
import { blastGroundRangeM, fireballMaxRadiusM, shockRadiusAtTimeM } from '../sim'
import { makeTerrainMaterial } from './shaders/terrainMat'
import { getRenderTime } from './runtimeClock'
import { useProbePicker } from './probePicker'

export function Terrain() {
  const city = useSim((s) => s.city)
  const mat = useMemo(() => makeTerrainMaterial(), [])
  const geo = useMemo(() => {
    const seg = 192
    const g = new THREE.PlaneGeometry(city.biome.extentM * 1.35, city.biome.extentM * 1.35, seg, seg)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position
    const colors = new Float32Array(pos.count * 3)
    const pal = palette(city.biome.id)
    const tmp = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const h = city.heightAt(x, z)
      pos.setY(i, h)
      const wet = city.waterAt(x, z)
      if (wet > 0.5) tmp.set(pal.wet)
      else {
        tmp.copy(pal.grass).lerp(pal.dry, city.biome.humidity < 0.3 ? 0.78 : 0.18)
        tmp.lerp(pal.rock, Math.min(1, h / 180))
        const d = city.districtAt(x, z)
        if (d === 'industrial') tmp.lerp(pal.industry, 0.35)
        if (d === 'park') tmp.copy(pal.park)
        if (d === 'residential') tmp.lerp(pal.park, 0.18)
      }
      colors[i * 3] = tmp.r
      colors[i * 3 + 1] = tmp.g
      colors[i * 3 + 2] = tmp.b
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    g.computeVertexNormals()
    return g
  }, [city])

  const phase = useRef('')
  useFrame(() => {
    const s = useSim.getState()
    const live = s.phase === 'detonate' || s.phase === 'explore' || s.phase === 'debrief'
    const u = mat.userData.scorch as {
      uGz: { value: THREE.Vector3 }
      uShock: { value: number }
      uFireball: { value: number }
      uPsi20: { value: number }
      uGrain: { value: number }
      uCraterR: { value: number }
      uCraterD: { value: number }
    } | undefined
    if (!u) return
    const crater = s.hasRun ? s.report.crater : null
    u.uGz.value.set(s.impactOffset.x, 0, s.impactOffset.z)
    u.uCraterR.value = crater ? crater.diameterM * 0.5 : 0
    u.uCraterD.value = crater ? crater.depthM : 0
    u.uGrain.value = s.city.biome.id === 'dune' ? 1.25 : 1
    if (!live) {
      u.uShock.value = 0
      phase.current = s.phase
      return
    }
    phase.current = s.phase
    const hob = s.hobResolved()
    const t = getRenderTime()
    u.uShock.value = shockRadiusAtTimeM(s.yieldKt, hob, t)
    u.uFireball.value = fireballMaxRadiusM(s.yieldKt, hob <= 1)
    u.uPsi20.value = blastGroundRangeM(s.yieldKt, hob, 20)
  })

  const picker = useProbePicker()
  return (
    <mesh geometry={geo} material={mat} receiveShadow castShadow {...picker} />
  )
}

function palette(id: string) {
  if (id === 'dune') {
    return { grass: new THREE.Color('#c2a06a'), dry: new THREE.Color('#d8b878'), rock: new THREE.Color('#8a7348'), wet: new THREE.Color('#1a2428'), industry: new THREE.Color('#6a5a40'), park: new THREE.Color('#a09058') }
  }
  if (id === 'foundry') {
    return { grass: new THREE.Color('#3a3d32'), dry: new THREE.Color('#4a4538'), rock: new THREE.Color('#3e4244'), wet: new THREE.Color('#1a2226'), industry: new THREE.Color('#2e2824'), park: new THREE.Color('#3a4634') }
  }
  if (id === 'saddle') {
    return { grass: new THREE.Color('#2f4a30'), dry: new THREE.Color('#5a5340'), rock: new THREE.Color('#6a7074'), wet: new THREE.Color('#1a2428'), industry: new THREE.Color('#3a3a36'), park: new THREE.Color('#245028') }
  }
  if (id === 'atoll') {
    return { grass: new THREE.Color('#6a7a50'), dry: new THREE.Color('#c2b080'), rock: new THREE.Color('#8a8070'), wet: new THREE.Color('#0e3a44'), industry: new THREE.Color('#3a403c'), park: new THREE.Color('#4a6a40') }
  }
  return { grass: new THREE.Color('#4a5a3c'), dry: new THREE.Color('#6a5a40'), rock: new THREE.Color('#4a4e52'), wet: new THREE.Color('#1a2428'), industry: new THREE.Color('#3a3834'), park: new THREE.Color('#3d6a38') }
}
