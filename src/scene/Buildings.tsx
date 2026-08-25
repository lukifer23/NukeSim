import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useSim } from '../state/store'
import { BuildingClass, DamageState } from '../sim/types'
import {
  arrivalTimeS,
  damageFromOverpressure,
  fireballMaxRadiusM,
  overpressureAtRangePsi,
  shockRadiusAtTimeM,
} from '../sim'
import type { Building } from '../city/types'
import { getRenderTime } from './runtimeClock'
import { damagePose } from './damagePose'
import { makeFacadeMaterial, styleId } from './shaders/facadeMat'
import { buildingAtlas } from './windowAtlas'
import { ignitesAt, ignitionSampleFromStore, resetIgnitionCache } from './ignitionField'
import { massingGeometry } from './massing'

const CLASS_COLOR: Record<string, string> = {
  [BuildingClass.Wood]: '#9a7348',
  [BuildingClass.Masonry]: '#8a5544',
  [BuildingClass.Steel]: '#6a7884',
  [BuildingClass.Concrete]: '#8a8680',
  [BuildingClass.Heavy]: '#4a5056',
}

function wallColor(cls: string, biomeId: string): string {
  if (biomeId === 'dune') {
    if (cls === BuildingClass.Wood) return '#c4a06a'
    if (cls === BuildingClass.Masonry) return '#d2b48c'
    if (cls === BuildingClass.Concrete) return '#c2b49a'
    if (cls === BuildingClass.Steel) return '#8a8070'
  }
  if (biomeId === 'saddle') {
    if (cls === BuildingClass.Wood) return '#6e4a30'
    if (cls === BuildingClass.Masonry) return '#6a5044'
  }
  if (biomeId === 'foundry') {
    if (cls === BuildingClass.Steel) return '#4a5258'
    if (cls === BuildingClass.Masonry) return '#5a4840'
    if (cls === BuildingClass.Concrete) return '#6a6660'
  }
  if (biomeId === 'atoll') {
    if (cls === BuildingClass.Wood) return '#8a6e4e'
    if (cls === BuildingClass.Masonry) return '#9a8068'
  }
  return CLASS_COLOR[cls] ?? '#666'
}

function dummy() {
  return new THREE.Object3D()
}

function hidden(tmp: THREE.Object3D) {
  tmp.scale.set(0, 0, 0)
  tmp.updateMatrix()
  return tmp.matrix
}

export function Buildings() {
  const city = useSim((s) => s.city)
  const groups = useMemo(() => {
    const map = new Map<string, Building[]>()
    for (const b of city.buildings) {
      const key = `${b.class}:${b.variant}`
      const list = map.get(key) ?? []
      list.push(b)
      map.set(key, list)
    }
    return map
  }, [city])

  return (
    <>
      {[...groups.entries()].map(([cls, list]) => (
        <group key={cls}>
          <BuildingLayer list={list} />
          <PodiumLayer list={list.filter((b) => b.podiumH > 4)} />
          <RoofLayer list={list} />
        </group>
      ))}
    </>
  )
}

function bindFacade(mesh: THREE.InstancedMesh, list: Building[]) {
  const floors = new Float32Array(list.length)
  const seed = new Float32Array(list.length)
  const cols = new Float32Array(list.length)
  const style = new Float32Array(list.length)
  list.forEach((b, i) => {
    floors[i] = b.floors
    seed[i] = b.seed
    cols[i] = b.cols
    style[i] = styleId(b.variant)
  })
  mesh.geometry.setAttribute('aFloors', new THREE.InstancedBufferAttribute(floors, 1))
  mesh.geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 1))
  mesh.geometry.setAttribute('aCols', new THREE.InstancedBufferAttribute(cols, 1))
  mesh.geometry.setAttribute('aStyle', new THREE.InstancedBufferAttribute(style, 1))
}

function BuildingLayer({ list }: { list: Building[] }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const cls = list[0]?.class ?? BuildingClass.Masonry
  const tmp = useMemo(() => dummy(), [])
  const cTmp = useMemo(() => new THREE.Color(), [])
  const ignite = useMemo(() => new THREE.Color('#c44b2b'), [])
  const city = useSim((s) => s.city)
  const base = useMemo(() => new THREE.Color(wallColor(cls, city.biome.id)), [cls, city.biome.id])
  const atlas = useMemo(() => buildingAtlas(cls, city.biome.id), [cls, city.biome.id])
  const geo = useMemo(() => massingGeometry(list[0]?.variant ?? 'walkup'), [list])
  const mat = useMemo(
    () =>
      makeFacadeMaterial({
        metalness: cls === BuildingClass.Steel ? 0.38 : 0.07,
        roughness: 0.84,
        map: atlas?.facade ?? null,
      }),
    [cls, atlas],
  )
  const lastK = useRef(new Float32Array(list.length))
  const done = useRef(new Uint8Array(list.length))
  const fieldSig = useSim((s) => s.runRevision)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    lastK.current = new Float32Array(list.length)
    done.current = new Uint8Array(list.length)
    resetIgnitionCache(String(fieldSig))
    bindFacade(mesh, list)
    if (!mesh.instanceColor) {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(list.length * 3), 3)
    }
    list.forEach((b, i) => {
      const y = city.heightAt(b.x, b.z)
      const towerW = b.podiumH > 4 ? b.w * 0.68 : b.w
      const towerD = b.podiumH > 4 ? b.d * 0.68 : b.d
      tmp.position.set(b.x, y + b.h / 2, b.z)
      tmp.rotation.set(0, b.yaw, 0)
      tmp.scale.set(towerW, b.h, towerD)
      tmp.updateMatrix()
      mesh.setMatrixAt(i, tmp.matrix)
      const tint = base.clone().offsetHSL((b.seed % 1) * 0.04 - 0.02, 0, ((b.seed * 0.37) % 1) * 0.08 - 0.04)
      mesh.setColorAt(i, tint)
    })
    mesh.count = list.length
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [list, tmp, base, city, fieldSig])

  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    const s = useSim.getState()
    const dayU = mat.userData.uDay as { value: number } | undefined
    if (dayU) dayU.value = s.timeOfDay
    if (s.phase !== 'detonate' && s.phase !== 'explore' && s.phase !== 'debrief') return
    const hob = s.hobResolved()
    const t = getRenderTime()
    const shock = shockRadiusAtTimeM(s.yieldKt, hob, t)
    const fb = fireballMaxRadiusM(s.yieldKt, hob <= 1)
    const ox = s.impactOffset.x
    const oz = s.impactOffset.z
    let wrote = false
    list.forEach((b, i) => {
      if (done.current[i]) return
      const r = Math.hypot(b.x - ox, b.z - oz)
      if (r > shock + 90 && lastK.current[i] === 0) return
      const y0 = city.heightAt(b.x, b.z)
      const psi = overpressureAtRangePsi(s.yieldKt, hob, r)
      const damage = damageFromOverpressure(cls as Building['class'], psi, r < fb)
      const arrival = arrivalTimeS(s.yieldKt, hob, r)
      const k = damage === DamageState.Intact ? 0 : THREE.MathUtils.smoothstep(t - arrival, 0, 0.55)
      lastK.current[i] = k
      const pose = damagePose(b, damage, k)
      cTmp.copy(base)
      if (damage === DamageState.Vaporized) cTmp.set('#1a120c')
      else if (damage === DamageState.Collapsed) cTmp.set('#2a2018')
      else if (damage === DamageState.Severe) cTmp.offsetHSL(0, -0.12, -0.18)
      else if (damage === DamageState.Moderate || damage === DamageState.Glass) cTmp.offsetHSL(0.02, -0.08, -0.1)
      const sample = ignitionSampleFromStore(s)
      if (ignitesAt(b.x, b.z, y0 + b.h * 0.5, cls, sample) && pose.scaleY > 0.2) cTmp.lerp(ignite, 0.4)
      const towerW = b.podiumH > 4 ? b.w * 0.68 : b.w
      const towerD = b.podiumH > 4 ? b.d * 0.68 : b.d
      tmp.position.set(b.x, y0 + (b.h * pose.scaleY) / 2 - pose.sunk, b.z)
      tmp.rotation.set(pose.tiltX, b.yaw, pose.tiltZ)
      tmp.scale.set(towerW * pose.scaleX, b.h * pose.scaleY, towerD * pose.scaleZ)
      tmp.updateMatrix()
      mesh.setMatrixAt(i, tmp.matrix)
      mesh.setColorAt(i, cTmp)
      wrote = true
      if (k >= 1 || (k === 0 && r + 90 < shock)) done.current[i] = 1
    })
    if (wrote) {
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
  })

  return <instancedMesh ref={ref} args={[geo, mat, list.length]} material={mat} castShadow receiveShadow />
}

function PodiumLayer({ list }: { list: Building[] }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const cls = list[0]?.class ?? BuildingClass.Masonry
  const tmp = useMemo(() => dummy(), [])
  const city = useSim((s) => s.city)
  const done = useRef(new Uint8Array(list.length))
  const fieldSig = useSim((s) => s.runRevision)
  const atlas = useMemo(() => buildingAtlas(cls, city.biome.id), [cls, city.biome.id])
  const mat = useMemo(
    () => makeFacadeMaterial({ metalness: 0.12, roughness: 0.88, map: atlas?.facade ?? null }),
    [atlas],
  )
  const base = useMemo(() => new THREE.Color(wallColor(cls, city.biome.id)).multiplyScalar(0.85), [cls, city.biome.id])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    done.current = new Uint8Array(list.length)
    bindFacade(mesh, list)
    if (!mesh.instanceColor) mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(list.length * 3), 3)
    list.forEach((b, i) => {
      const y = city.heightAt(b.x, b.z)
      tmp.position.set(b.x, y + b.podiumH / 2, b.z)
      tmp.rotation.set(0, b.yaw, 0)
      tmp.scale.set(b.w, b.podiumH, b.d)
      tmp.updateMatrix()
      mesh.setMatrixAt(i, tmp.matrix)
      mesh.setColorAt(i, base)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [list, city, tmp, base, fieldSig])

  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    const s = useSim.getState()
    if (s.phase !== 'detonate' && s.phase !== 'explore' && s.phase !== 'debrief') return
    const hob = s.hobResolved()
    const t = getRenderTime()
    const shock = shockRadiusAtTimeM(s.yieldKt, hob, t)
    const fb = fireballMaxRadiusM(s.yieldKt, hob <= 1)
    let wrote = false
    list.forEach((b, i) => {
      if (done.current[i]) return
      const r = Math.hypot(b.x - s.impactOffset.x, b.z - s.impactOffset.z)
      if (r > shock + 80) return
      const y0 = city.heightAt(b.x, b.z)
      const psi = overpressureAtRangePsi(s.yieldKt, hob, r)
      const damage = damageFromOverpressure(b.class, psi, r < fb)
      const arrival = arrivalTimeS(s.yieldKt, hob, r)
      const k = damage === DamageState.Intact ? 0 : THREE.MathUtils.smoothstep(t - arrival, 0, 0.55)
      const pose = damagePose(b, damage, k)
      tmp.position.set(b.x, y0 + (b.podiumH * pose.scaleY) / 2 - pose.sunk * 0.4, b.z)
      tmp.rotation.set(pose.tiltX * 0.4, b.yaw, pose.tiltZ * 0.4)
      tmp.scale.set(b.w * pose.scaleX, b.podiumH * Math.max(0.12, pose.scaleY), b.d * pose.scaleZ)
      tmp.updateMatrix()
      mesh.setMatrixAt(i, tmp.matrix)
      wrote = true
      if (k >= 1 || (k === 0 && r + 80 < shock)) done.current[i] = 1
    })
    if (wrote) mesh.instanceMatrix.needsUpdate = true
  })

  if (list.length === 0) return null
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, list.length]} material={mat} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  )
}

function RoofLayer({ list }: { list: Building[] }) {
  const roofs = useRef<THREE.InstancedMesh>(null)
  const equipment = useRef<THREE.InstancedMesh>(null)
  const gables = useRef<THREE.InstancedMesh>(null)
  const tmp = useMemo(() => dummy(), [])
  const city = useSim((s) => s.city)
  const cls = list[0]?.class ?? BuildingClass.Masonry
  const atlas = useMemo(() => buildingAtlas(cls, city.biome.id), [cls, city.biome.id])
  const roofColor = useMemo(() => new THREE.Color(CLASS_COLOR[cls] ?? '#666').multiplyScalar(0.42), [cls])
  const last = useRef(new Float32Array(list.length))
  const done = useRef(new Uint8Array(list.length))
  const fieldSig = useSim((s) => s.runRevision)

  const writeRoofs = useCallback((t: number, force: boolean) => {
    const s = useSim.getState()
    const live = s.phase === 'detonate' || s.phase === 'explore' || s.phase === 'debrief'
    const hob = s.hobResolved()
    const shock = live ? shockRadiusAtTimeM(s.yieldKt, hob, t) : 0
    const fb = fireballMaxRadiusM(s.yieldKt, hob <= 1)
    const ox = s.impactOffset.x
    const oz = s.impactOffset.z
    list.forEach((b, i) => {
      if (!force && done.current[i]) return
      const r = Math.hypot(b.x - ox, b.z - oz)
      const y0 = city.heightAt(b.x, b.z)
      let k = 0
      let damage: DamageState = DamageState.Intact
      if (live) {
        const psi = overpressureAtRangePsi(s.yieldKt, hob, r)
        damage = damageFromOverpressure(b.class, psi, r < fb)
        k = damage === DamageState.Intact ? 0 : THREE.MathUtils.smoothstep(t - arrivalTimeS(s.yieldKt, hob, r), 0, 0.55)
      }
      if (!force && last.current[i] === k && r > shock + 90) return
      last.current[i] = k
      if (live && (k >= 1 || (k === 0 && r + 90 < shock))) done.current[i] = 1
      const pose = damagePose(b, damage, k)
      const hide = pose.scaleY < 0.08
      const tw = b.podiumH > 4 ? b.w * 0.68 : b.w
      const td = b.podiumH > 4 ? b.d * 0.68 : b.d
      if (b.variant === 'house') {
        if (gables.current) {
          tmp.position.set(b.x, y0 + b.h * pose.scaleY + 1.6 - pose.sunk, b.z)
          tmp.rotation.set(pose.tiltX, b.yaw + Math.PI / 4, pose.tiltZ)
          tmp.scale.set(hide ? 0 : tw * 0.74, hide ? 0 : 3.6 * pose.scaleY, hide ? 0 : td * 0.74)
          tmp.updateMatrix()
          gables.current.setMatrixAt(i, tmp.matrix)
        }
        roofs.current?.setMatrixAt(i, hidden(tmp))
        equipment.current?.setMatrixAt(i, hidden(tmp))
        return
      }
      if (roofs.current) {
        tmp.position.set(b.x, y0 + b.h * pose.scaleY + 1.05 - pose.sunk, b.z)
        tmp.rotation.set(pose.tiltX, b.yaw, pose.tiltZ)
        tmp.scale.set(hide ? 0 : tw * pose.scaleX * 0.96, hide ? 0 : 1.8 * pose.scaleY, hide ? 0 : td * pose.scaleZ * 0.96)
        tmp.updateMatrix()
        roofs.current.setMatrixAt(i, tmp.matrix)
      }
      if (equipment.current) {
        if (i % 4 === 0 && b.h >= 28 && pose.scaleY > 0.55 && !hide) {
          tmp.position.set(b.x + Math.sin(b.seed) * tw * 0.16, y0 + b.h * pose.scaleY + 2.4 - pose.sunk, b.z + Math.cos(b.seed) * td * 0.16)
          tmp.rotation.set(0, b.yaw, 0)
          tmp.scale.set(Math.max(3, tw * 0.18), 2.4, Math.max(3, td * 0.16))
        } else tmp.scale.set(0, 0, 0)
        tmp.updateMatrix()
        equipment.current.setMatrixAt(i, tmp.matrix)
      }
      gables.current?.setMatrixAt(i, hidden(tmp))
    })
    for (const mesh of [roofs.current, equipment.current, gables.current]) {
      if (!mesh) continue
      mesh.count = list.length
      mesh.instanceMatrix.needsUpdate = true
    }
  }, [city, list, tmp])

  useLayoutEffect(() => {
    last.current = new Float32Array(list.length)
    done.current = new Uint8Array(list.length)
    writeRoofs(0, true)
  }, [fieldSig, list.length, writeRoofs])

  useFrame(() => {
    const s = useSim.getState()
    if (s.phase !== 'detonate' && s.phase !== 'explore' && s.phase !== 'debrief') return
    writeRoofs(getRenderTime(), false)
  })

  return (
    <>
      <instancedMesh ref={roofs} args={[undefined, undefined, list.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={atlas?.roof ?? null} color={roofColor} roughness={0.92} metalness={0.06} />
      </instancedMesh>
      <instancedMesh ref={equipment} args={[undefined, undefined, list.length]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#2e3234" roughness={0.7} metalness={0.25} />
      </instancedMesh>
      <instancedMesh ref={gables} args={[undefined, undefined, list.length]} castShadow>
        <coneGeometry args={[1, 1, 4]} />
        <meshStandardMaterial map={atlas?.roof ?? null} color={roofColor} roughness={0.88} />
      </instancedMesh>
    </>
  )
}
