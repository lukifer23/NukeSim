import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSim, isLiveField } from '../state/store'
import { isSurfaceBurst, blastGroundRangeM, fireballRadiusAtTimeM, shockRadiusAtTimeM } from '../sim'
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
        tmp.copy(pal.grass).lerp(pal.dry, city.biome.humidity < 0.3 ? 0.72 : 0.24)
        tmp.lerp(pal.rock, Math.min(1, h / 180))
        const d = city.districtAt(x, z)
        if (d === 'park') tmp.copy(pal.park).lerp(pal.dry, 0.12)
        else if (d === 'industrial') tmp.lerp(pal.industry, 0.5)
        else if (d === 'core') tmp.lerp(pal.urban, 0.58)
        else if (d === 'waterfront') tmp.lerp(pal.urban, 0.34)
        else if (d === 'residential') tmp.lerp(pal.urban, 0.4)
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
    const live = isLiveField(s.phase)
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
    u.uGrain.value = s.city.biome.id === 'dune' ? 1.25 : 1
    if (!live) {
      u.uShock.value = 0
      if (crater) {
        u.uCraterR.value = crater.diameterM * 0.5
        u.uCraterD.value = crater.depthM
      } else {
        u.uCraterR.value = 0
        u.uCraterD.value = 0
      }
      phase.current = s.phase
      return
    }
    phase.current = s.phase
    const hob = s.hobResolved()
    const t = getRenderTime()
    const surface = isSurfaceBurst(hob)
    u.uShock.value = shockRadiusAtTimeM(s.yieldKt, hob, t)
    // Scorch and the bowl form on their own fronts instead of appearing whole
    // at t=0: the fireball grows, and the crater opens as the shock passes.
    u.uFireball.value = fireballRadiusAtTimeM(s.yieldKt, t, surface)
    u.uPsi20.value = blastGroundRangeM(s.yieldKt, hob, 20)
    const craterProgress = THREE.MathUtils.smoothstep(t, 0, 2.4)
    u.uCraterR.value = crater ? crater.diameterM * 0.5 * (0.35 + 0.65 * craterProgress) : 0
    u.uCraterD.value = crater ? crater.depthM * craterProgress : 0
  })

  const picker = useProbePicker()
  return (
    <mesh geometry={geo} material={mat} receiveShadow castShadow {...picker} />
  )
}

function palette(id: string) {
  if (id === 'dune') {
    return { grass: new THREE.Color('#b09468'), dry: new THREE.Color('#c9ad7c'), rock: new THREE.Color('#8a7348'), wet: new THREE.Color('#1a2428'), industry: new THREE.Color('#6a5a40'), park: new THREE.Color('#8f7f4e'), urban: new THREE.Color('#9a8a68') }
  }
  if (id === 'foundry') {
    return { grass: new THREE.Color('#46463c'), dry: new THREE.Color('#514b40'), rock: new THREE.Color('#40444a'), wet: new THREE.Color('#1a2226'), industry: new THREE.Color('#332d28'), park: new THREE.Color('#3c4a36'), urban: new THREE.Color('#4a4a48') }
  }
  if (id === 'saddle') {
    return { grass: new THREE.Color('#3c4a34'), dry: new THREE.Color('#5a5340'), rock: new THREE.Color('#6a7074'), wet: new THREE.Color('#1a2428'), industry: new THREE.Color('#3a3a36'), park: new THREE.Color('#33502f'), urban: new THREE.Color('#565a52') }
  }
  if (id === 'atoll') {
    return { grass: new THREE.Color('#6e7452'), dry: new THREE.Color('#b8a87e'), rock: new THREE.Color('#8a8070'), wet: new THREE.Color('#0e3a44'), industry: new THREE.Color('#3a403c'), park: new THREE.Color('#4f6a42'), urban: new THREE.Color('#7a7866') }
  }
  return { grass: new THREE.Color('#565043'), dry: new THREE.Color('#6b604c'), rock: new THREE.Color('#4e5254'), wet: new THREE.Color('#1a2428'), industry: new THREE.Color('#3a3834'), park: new THREE.Color('#3f5a38'), urban: new THREE.Color('#565654') }
}
