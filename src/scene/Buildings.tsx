import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useSim, isLiveField } from '../state/store'
import { BuildingClass, DamageState } from '../sim/types'
import {
  fireballMaxRadiusM,
  isSurfaceBurst,
  shockRadiusAtTimeM,
} from '../sim'
import type { Building } from '../city/types'
import { getRenderTime } from './runtimeClock'
import { damageAmount, damagePose, damageProgress } from './damagePose'
import { makeFacadeMaterial, styleId } from './shaders/facadeMat'
import { buildingAtlas } from './windowAtlas'
import { ignitesAt, ignitionSampleFromStore, resetIgnitionCache } from './ignitionField'
import { massingGeometry } from './massing'
import { dummy, hidden } from './instancing'
import { buildingVisualEvent } from './buildingVisualEvent'
import { useProbePicker } from './probePicker'

const CLASS_COLOR: Record<string, string> = {
  [BuildingClass.Wood]: '#b48e67',
  [BuildingClass.Masonry]: '#b99b8b',
  [BuildingClass.Steel]: '#929da4',
  [BuildingClass.Concrete]: '#c4beb4',
  [BuildingClass.Heavy]: '#8f969b',
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
  return CLASS_COLOR[cls] ?? '#aaa69e'
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
          <PodiumLayer list={list.filter(hasPodium)} />
          <RoofLayer list={list} />
          <RubbleLayer list={list} />
        </group>
      ))}
    </>
  )
}

/** One window cell per ~3.4 m keeps window proportions square on every face. */
const WINDOW_SPACING_M = 3.4

/** Extra margin past the shock front before a building is culled from updates. */
const SHOCK_CULL_M = 90

/** Podiums only read as a distinct base above this height. */
const PODIUM_MIN_H = 4

function hasPodium(b: Building): boolean {
  return b.podiumH > PODIUM_MIN_H
}

/** Towers inset their footprint when they sit on a podium. */
function towerFootprint(b: Building): { w: number; d: number } {
  return hasPodium(b) ? { w: b.w * 0.68, d: b.d * 0.68 } : { w: b.w, d: b.d }
}

function bindFacade(mesh: THREE.InstancedMesh, list: Building[], mode: 'tower' | 'podium') {
  const floors = new Float32Array(list.length)
  const seed = new Float32Array(list.length)
  const cols = new Float32Array(list.length * 2)
  const style = new Float32Array(list.length)
  list.forEach((b, i) => {
    const h = mode === 'podium' ? b.podiumH : b.h
    floors[i] = Math.max(1, Math.round(h / WINDOW_SPACING_M))
    seed[i] = b.seed
    cols[i * 2] = Math.max(1, Math.round(b.w / WINDOW_SPACING_M))
    cols[i * 2 + 1] = Math.max(1, Math.round(b.d / WINDOW_SPACING_M))
    style[i] = styleId(b.variant)
  })
  mesh.geometry.setAttribute('aFloors', new THREE.InstancedBufferAttribute(floors, 1))
  mesh.geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 1))
  mesh.geometry.setAttribute('aCols', new THREE.InstancedBufferAttribute(cols, 2))
  mesh.geometry.setAttribute('aStyle', new THREE.InstancedBufferAttribute(style, 1))
  // Window shatter is driven per instance and grows as the shock passes.
  mesh.geometry.setAttribute('aDamage', new THREE.InstancedBufferAttribute(new Float32Array(list.length), 1))
}

function BuildingLayer({ list }: { list: Building[] }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const cls = list[0]?.class ?? BuildingClass.Masonry
  const tmp = useMemo(() => dummy(), [])
  const cTmp = useMemo(() => new THREE.Color(), [])
  const cDamage = useMemo(() => new THREE.Color(), [])
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
        normalMap: atlas?.facadeNormal ?? null,
        armMap: atlas?.facadeArm ?? null,
      }),
    [cls, atlas],
  )
  const lastK = useRef(new Float32Array(list.length))
  const done = useRef(new Uint8Array(list.length))
  const remaining = useRef(list.length)
  const dmg = useRef<THREE.InstancedBufferAttribute | null>(null)
  const fieldSig = useSim((s) => s.runRevision)
  const picker = useProbePicker()

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    lastK.current = new Float32Array(list.length)
    done.current = new Uint8Array(list.length)
    remaining.current = list.length
    resetIgnitionCache(String(fieldSig))
    bindFacade(mesh, list, 'tower')
    dmg.current = mesh.geometry.getAttribute('aDamage') as THREE.InstancedBufferAttribute
    if (!mesh.instanceColor) {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(list.length * 3), 3)
    }
    list.forEach((b, i) => {
      const y = city.heightAt(b.x, b.z)
      const { w: towerW, d: towerD } = towerFootprint(b)
      tmp.position.set(b.x, y + b.h / 2, b.z)
      tmp.rotation.set(0, b.yaw, 0)
      tmp.scale.set(towerW, b.h, towerD)
      tmp.updateMatrix()
      mesh.setMatrixAt(i, tmp.matrix)
      const tint = base.clone().offsetHSL(
        ((b.seed * 7.3) % 1) * 0.08 - 0.04,
        ((b.seed * 3.1) % 1) * 0.12 - 0.05,
        ((b.seed * 0.37) % 1) * 0.15 - 0.075,
      )
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
    if (!isLiveField(s.phase)) return
    if (remaining.current === 0) return
    const hob = s.hobResolved()
    const t = getRenderTime()
    const shock = shockRadiusAtTimeM(s.yieldKt, hob, t)
    const fb = fireballMaxRadiusM(s.yieldKt, isSurfaceBurst(hob))
    const ox = s.impactOffset.x
    const oz = s.impactOffset.z
    const sample = ignitionSampleFromStore(s)
    let wrote = false
    list.forEach((b, i) => {
      if (done.current[i]) return
      const r = Math.hypot(b.x - ox, b.z - oz)
      if (r > shock + SHOCK_CULL_M && lastK.current[i] === 0) return
      const y0 = city.heightAt(b.x, b.z)
      const event = buildingVisualEvent(b, {
        yieldKt: s.yieldKt,
        hobM: hob,
        fireballRadiusM: fb,
        impactX: ox,
        impactZ: oz,
        ignites: (building) => ignitesAt(building.x, building.z, y0 + building.h * 0.5, building.class, sample),
      }, r)
      const damage = event.damage
      const arrival = event.arrivalS
      const k = damageProgress(damage, event.seed, t - arrival)
      lastK.current[i] = k
      const lean = r > 1 ? { x: (b.x - ox) / r, z: (b.z - oz) / r } : undefined
      const pose = damagePose(b, damage, k, lean)
      if (dmg.current) dmg.current.array[i] = damageAmount(damage) * k
      // Damage colour arrives with the shock, so a doomed building is not dark
      // before the blast wave touches it.
      const colorK = damage === DamageState.Intact ? 0 : THREE.MathUtils.smoothstep(t - arrival, 0, 0.45)
      const igniteK = THREE.MathUtils.smoothstep(t - arrival, 0, 1.6)
      cTmp.copy(base)
      cDamage.copy(base)
      if (damage === DamageState.Vaporized) cDamage.set('#1a120c')
      else if (damage === DamageState.Collapsed) cDamage.set('#2a2018')
      else if (damage === DamageState.Severe) cDamage.offsetHSL(0, -0.12, -0.18)
      else if (damage === DamageState.Moderate || damage === DamageState.Glass) cDamage.offsetHSL(0.02, -0.08, -0.1)
      cTmp.lerp(cDamage, colorK)
      if (event.ignites && pose.scaleY > 0.2) cTmp.lerp(ignite, 0.4 * igniteK)
      const { w: towerW, d: towerD } = towerFootprint(b)
      tmp.position.set(b.x, y0 + (b.h * pose.scaleY) / 2 - pose.sunk, b.z)
      tmp.rotation.set(pose.tiltX, b.yaw, pose.tiltZ)
      tmp.scale.set(towerW * pose.scaleX, b.h * pose.scaleY, towerD * pose.scaleZ)
      tmp.updateMatrix()
      mesh.setMatrixAt(i, tmp.matrix)
      mesh.setColorAt(i, cTmp)
      wrote = true
      if (k >= 1 || (k === 0 && r + SHOCK_CULL_M < shock)) {
        done.current[i] = 1
        remaining.current -= 1
      }
    })
    if (wrote) {
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
      if (dmg.current) dmg.current.needsUpdate = true
    }
  })

  return <instancedMesh ref={ref} args={[geo, mat, list.length]} material={mat} castShadow receiveShadow {...picker} />
}

function RubbleLayer({ list }: { list: Building[] }) {
  const fragmentsPerBuilding = 4
  const count = list.length * fragmentsPerBuilding
  const ref = useRef<THREE.InstancedMesh>(null)
  const tmp = useMemo(() => dummy(), [])
  const color = useMemo(() => new THREE.Color(), [])
  const city = useSim((s) => s.city)
  const fieldSig = useSim((s) => s.runRevision)
  const done = useRef(new Uint8Array(list.length))
  const remaining = useRef(list.length)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    done.current = new Uint8Array(list.length)
    remaining.current = list.length
    for (let i = 0; i < count; i++) mesh.setMatrixAt(i, hidden(tmp))
    mesh.instanceMatrix.needsUpdate = true
  }, [count, fieldSig, list.length, tmp])

  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    const s = useSim.getState()
    if (!isLiveField(s.phase)) return
    if (remaining.current === 0) return
    const t = getRenderTime()
    const hob = s.hobResolved()
    const shock = shockRadiusAtTimeM(s.yieldKt, hob, t)
    const fb = fireballMaxRadiusM(s.yieldKt, isSurfaceBurst(hob))
    const sample = ignitionSampleFromStore(s)
    let wrote = false
    list.forEach((b, buildingIndex) => {
      if (done.current[buildingIndex]) return
      const range = Math.hypot(b.x - s.impactOffset.x, b.z - s.impactOffset.z)
      if (range > shock + SHOCK_CULL_M) return
      const y0 = city.heightAt(b.x, b.z)
      const event = buildingVisualEvent(b, {
        yieldKt: s.yieldKt,
        hobM: hob,
        fireballRadiusM: fb,
        impactX: s.impactOffset.x,
        impactZ: s.impactOffset.z,
        ignites: (building) => ignitesAt(building.x, building.z, y0 + building.h * 0.5, building.class, sample),
      }, range)
      const k = damageProgress(event.damage, event.seed, t - event.arrivalS)
      const rubble = event.damage === DamageState.Collapsed || event.damage === DamageState.Vaporized
      const severe = event.damage === DamageState.Severe
      const visible = (rubble && k >= 0.58) || (severe && k >= 0.72)
      // Debris is thrown outward from ground zero, then scattered by seed.
      const outward = Math.atan2(b.z - s.impactOffset.z, b.x - s.impactOffset.x)
      for (let fragment = 0; fragment < fragmentsPerBuilding; fragment++) {
        const index = buildingIndex * fragmentsPerBuilding + fragment
        if (!visible || (severe && fragment > 1)) {
          mesh.setMatrixAt(index, hidden(tmp))
          continue
        }
        const angle = outward + (((b.seed * 31.7) % 1) - 0.5) * 1.4 + fragment * 1.73
        const spread = rubble ? 0.12 + fragment * 0.045 : 0.08
        const fw = Math.max(0.8, b.w * (0.045 + fragment * 0.006))
        const fd = Math.max(0.8, b.d * (0.04 + fragment * 0.005))
        const fh = Math.max(0.65, Math.min(2.1, b.h * (0.012 + fragment * 0.003)))
        tmp.position.set(b.x + Math.cos(angle) * b.w * spread, y0 + fh * 0.48, b.z + Math.sin(angle) * b.d * spread)
        tmp.rotation.set(0.12 * Math.sin(angle * 1.7), b.yaw + angle, 0.15 * Math.cos(angle))
        tmp.scale.set(fw, fh, fd)
        tmp.updateMatrix()
        mesh.setMatrixAt(index, tmp.matrix)
        color.set(wallColor(b.class, city.biome.id)).multiplyScalar(event.damage === DamageState.Vaporized ? 0.55 : 0.82 + fragment * 0.025)
        mesh.setColorAt(index, color)
      }
      wrote = true
      if (k >= 1 || (k === 0 && range + SHOCK_CULL_M < shock)) {
        done.current[buildingIndex] = 1
        remaining.current -= 1
      }
    })
    if (wrote) {
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} receiveShadow>
      <dodecahedronGeometry args={[0.72, 0]} />
      <meshStandardMaterial color="#ffffff" roughness={0.96} metalness={0.02} emissive="#292724" emissiveIntensity={0.18} />
    </instancedMesh>
  )
}

function PodiumLayer({ list }: { list: Building[] }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const cls = list[0]?.class ?? BuildingClass.Masonry
  const tmp = useMemo(() => dummy(), [])
  const city = useSim((s) => s.city)
  const done = useRef(new Uint8Array(list.length))
  const remaining = useRef(list.length)
  const dmg = useRef<THREE.InstancedBufferAttribute | null>(null)
  const fieldSig = useSim((s) => s.runRevision)
  const atlas = useMemo(() => buildingAtlas(cls, city.biome.id), [cls, city.biome.id])
  const mat = useMemo(
    () => makeFacadeMaterial({ metalness: 0.12, roughness: 0.88, map: atlas?.facade ?? null, normalMap: atlas?.facadeNormal ?? null, armMap: atlas?.facadeArm ?? null }),
    [atlas],
  )
  const base = useMemo(() => new THREE.Color(wallColor(cls, city.biome.id)).multiplyScalar(0.85), [cls, city.biome.id])
  const picker = useProbePicker()

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    done.current = new Uint8Array(list.length)
    remaining.current = list.length
    bindFacade(mesh, list, 'podium')
    dmg.current = mesh.geometry.getAttribute('aDamage') as THREE.InstancedBufferAttribute
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
    const dayU = mat.userData.uDay as { value: number } | undefined
    if (dayU) dayU.value = s.timeOfDay
    if (!isLiveField(s.phase)) return
    if (remaining.current === 0) return
    const hob = s.hobResolved()
    const t = getRenderTime()
    const shock = shockRadiusAtTimeM(s.yieldKt, hob, t)
    const fb = fireballMaxRadiusM(s.yieldKt, isSurfaceBurst(hob))
    let wrote = false
    list.forEach((b, i) => {
      if (done.current[i]) return
      const r = Math.hypot(b.x - s.impactOffset.x, b.z - s.impactOffset.z)
      if (r > shock + SHOCK_CULL_M) return
      const y0 = city.heightAt(b.x, b.z)
      const event = buildingVisualEvent(b, {
        yieldKt: s.yieldKt,
        hobM: hob,
        fireballRadiusM: fb,
        impactX: s.impactOffset.x,
        impactZ: s.impactOffset.z,
      }, r)
      const damage = event.damage
      const k = damageProgress(damage, event.seed, t - event.arrivalS)
      const lean = r > 1 ? { x: (b.x - s.impactOffset.x) / r, z: (b.z - s.impactOffset.z) / r } : undefined
      const pose = damagePose(b, damage, k, lean)
      if (dmg.current) dmg.current.array[i] = damageAmount(damage) * k
      tmp.position.set(b.x, y0 + (b.podiumH * pose.scaleY) / 2 - pose.sunk * 0.4, b.z)
      tmp.rotation.set(pose.tiltX * 0.4, b.yaw, pose.tiltZ * 0.4)
      // A collapsed podium must leave the scene with its tower. Keeping a
      // minimum Y scale produced enormous, paper-thin black slabs at ground
      // zero and read as a rendering failure instead of structural debris.
      tmp.scale.set(b.w * pose.scaleX, b.podiumH * pose.scaleY, b.d * pose.scaleZ)
      tmp.updateMatrix()
      mesh.setMatrixAt(i, tmp.matrix)
      wrote = true
      if (k >= 1 || (k === 0 && r + SHOCK_CULL_M < shock)) {
        done.current[i] = 1
        remaining.current -= 1
      }
    })
    if (wrote) {
      mesh.instanceMatrix.needsUpdate = true
      if (dmg.current) dmg.current.needsUpdate = true
    }
  })

  if (list.length === 0) return null
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, list.length]} material={mat} castShadow receiveShadow {...picker}>
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
  const roofColor = useMemo(() => new THREE.Color(CLASS_COLOR[cls] ?? '#888').multiplyScalar(0.52), [cls])
  const last = useRef(new Float32Array(list.length))
  const done = useRef(new Uint8Array(list.length))
  const remaining = useRef(list.length)
  const fieldSig = useSim((s) => s.runRevision)

  const writeRoofs = useCallback((t: number, force: boolean) => {
    const s = useSim.getState()
    const live = isLiveField(s.phase)
    if (!force && remaining.current === 0) return
    const hob = s.hobResolved()
    const shock = live ? shockRadiusAtTimeM(s.yieldKt, hob, t) : 0
    const fb = fireballMaxRadiusM(s.yieldKt, isSurfaceBurst(hob))
    const ox = s.impactOffset.x
    const oz = s.impactOffset.z
    list.forEach((b, i) => {
      if (!force && done.current[i]) return
      const r = Math.hypot(b.x - ox, b.z - oz)
      const y0 = city.heightAt(b.x, b.z)
      let k = 0
      let damage: DamageState = DamageState.Intact
      if (live) {
        const event = buildingVisualEvent(b, {
          yieldKt: s.yieldKt,
          hobM: hob,
          fireballRadiusM: fb,
          impactX: ox,
          impactZ: oz,
        }, r)
        damage = event.damage
        k = damageProgress(damage, event.seed, t - event.arrivalS)
      }
      if (!force && last.current[i] === k && r > shock + SHOCK_CULL_M) return
      last.current[i] = k
      if (live && (k >= 1 || (k === 0 && r + SHOCK_CULL_M < shock))) {
        done.current[i] = 1
        remaining.current -= 1
      }
      const lean = live && r > 1 ? { x: (b.x - ox) / r, z: (b.z - oz) / r } : undefined
      const pose = damagePose(b, damage, k, lean)
      const hide = pose.scaleY < 0.08
      const { w: tw, d: td } = towerFootprint(b)
      if (b.variant === 'house') {
        if (gables.current) {
          tmp.position.set(b.x, y0 + b.h * pose.scaleY + 1.6 - pose.sunk, b.z)
          tmp.rotation.set(pose.tiltX, b.yaw + Math.PI / 4, pose.tiltZ)
          tmp.scale.set(hide ? 0.001 : tw * 0.74, hide ? 0.001 : 3.6 * pose.scaleY, hide ? 0.001 : td * 0.74)
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
        tmp.scale.set(hide ? 0.001 : tw * pose.scaleX * 0.96, hide ? 0.001 : 1.8 * pose.scaleY, hide ? 0.001 : td * pose.scaleZ * 0.96)
        tmp.updateMatrix()
        roofs.current.setMatrixAt(i, tmp.matrix)
      }
      if (equipment.current) {
        if (i % 4 === 0 && b.h >= 28 && pose.scaleY > 0.55 && !hide) {
          tmp.position.set(b.x + Math.sin(b.seed) * tw * 0.16, y0 + b.h * pose.scaleY + 2.4 - pose.sunk, b.z + Math.cos(b.seed) * td * 0.16)
          tmp.rotation.set(0, b.yaw, 0)
          tmp.scale.set(Math.max(3, tw * 0.18), 2.4, Math.max(3, td * 0.16))
          tmp.updateMatrix()
          equipment.current.setMatrixAt(i, tmp.matrix)
        } else {
          equipment.current.setMatrixAt(i, hidden(tmp))
        }
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
    remaining.current = list.length
    writeRoofs(0, true)
  }, [fieldSig, list.length, writeRoofs])

  useFrame(() => {
    const s = useSim.getState()
    if (!isLiveField(s.phase)) return
    if (remaining.current === 0) return
    writeRoofs(getRenderTime(), false)
  })

  return (
    <>
      <instancedMesh ref={roofs} args={[undefined, undefined, list.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={atlas?.roof ?? null} normalMap={atlas?.roofNormal ?? null} aoMap={atlas?.roofArm ?? null} roughnessMap={atlas?.roofArm ?? null} metalnessMap={atlas?.roofArm ?? null} color={roofColor} roughness={0.94} metalness={0.05} emissive="#1c1e20" emissiveIntensity={0.12} />
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
