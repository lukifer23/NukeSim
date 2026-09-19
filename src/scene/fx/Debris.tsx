import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSim } from '../../state/store'
import { isSurfaceBurst, arrivalTimeS, damageFromOverpressure, fireballMaxRadiusM, overpressureAtRangePsi } from '../../sim'
import { DamageState } from '../../sim/types'
import type { BuildingClass } from '../../sim/types'
import { getRenderTime } from '../runtimeClock'

const COUNT = 360

type Piece = {
  x: number
  z: number
  y: number
  ground: number
  cls: BuildingClass
  vx: number
  vz: number
  lift: number
  spin: number
  size: number
  yaw: number
  kind: number
  delay: number
}

export function Debris() {
  const city = useSim((s) => s.city)
  const flying = useRef<THREE.InstancedMesh>(null)
  const rubbleA = useRef<THREE.InstancedMesh>(null)
  const rubbleB = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const pieces = useMemo<Piece[]>(() => {
    return city.buildings
      .filter((_, i) => i % 5 === 0)
      .slice(0, COUNT)
      .map((b, i) => {
        const yaw = (i * 1.7) % 6.283
        const speed = 22 + (i % 13) * 6
        return {
          x: b.x,
          z: b.z,
          y: city.heightAt(b.x, b.z) + b.h * 0.45,
          ground: city.heightAt(b.x, b.z) + 1.4,
          cls: b.class,
          vx: Math.sin(yaw) * speed,
          vz: Math.cos(yaw) * speed,
          lift: 12 + (i % 17) * 3.6,
          spin: 0.28 + (i % 9) * 0.11,
          size: Math.min(b.w, b.d) * 0.05 + 0.9,
          yaw,
          kind: i % 3,
          delay: (i % 7) * 0.06,
        }
      })
  }, [city])

  useFrame(() => {
    const air = flying.current
    const pileA = rubbleA.current
    const pileB = rubbleB.current
    if (!air || !pileA || !pileB) return
    const s = useSim.getState()
    const t = getRenderTime()
    if (t < 0.28) {
      air.count = 0
      pileA.count = 0
      pileB.count = 0
      return
    }
    const hob = s.hobResolved()
    const fb = fireballMaxRadiusM(s.yieldKt, isSurfaceBurst(hob))
    const reduced = s.reducedMotion
    const active = Math.min(pieces.length, Math.round(60 + 90 * Math.log10(s.yieldKt + 1)))
    let flyN = 0
    let pileAN = 0
    let pileBN = 0
    for (let pi = 0; pi < active; pi++) {
      const p = pieces[pi]
      const r = Math.hypot(p.x - s.impactOffset.x, p.z - s.impactOffset.z)
      const psi = overpressureAtRangePsi(s.yieldKt, hob, r)
      const damage = damageFromOverpressure(p.cls, psi, r < fb)
      if (damage !== DamageState.Collapsed && damage !== DamageState.Vaporized) continue
      // Launch when the shock front arrives at the building, not on a
      // shock-radius heuristic that desyncs from the damage animation.
      const launch = arrivalTimeS(s.yieldKt, hob, r) + p.delay
      const age = t - launch
      if (age < 0) continue
      const x = p.x + p.vx * age
      const z = p.z + p.vz * age
      const y = p.y + p.lift * age - 4.9 * age * age
      const spinning = !reduced && y > p.ground && age < 6
      if (spinning) {
        dummy.position.set(x, y, z)
        dummy.rotation.set(age * p.spin, age * p.spin * 1.7, age * p.spin * 0.6)
        dummy.scale.setScalar(p.size)
        dummy.updateMatrix()
        air.setMatrixAt(flyN++, dummy.matrix)
      } else {
        // Come to rest where the piece actually landed; no teleport to a
        // separate pile location (which read as debris popping out of thin air).
        const settled = Math.max(0, Math.min(1, (age - (launch + 0.6)) * 0.6))
        dummy.position.set(x, p.ground + p.size * 0.18 * settled, z)
        dummy.rotation.set(0.45 * settled, p.yaw, 0.22 * settled)
        dummy.scale.set(p.size * 1.05, p.size * 0.72, p.size * 0.92)
        dummy.updateMatrix()
        if (p.kind === 0) pileA.setMatrixAt(pileAN++, dummy.matrix)
        else pileB.setMatrixAt(pileBN++, dummy.matrix)
      }
    }
    air.count = flyN
    pileA.count = pileAN
    pileB.count = pileBN
    air.instanceMatrix.needsUpdate = true
    pileA.instanceMatrix.needsUpdate = true
    pileB.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <instancedMesh ref={flying} args={[undefined, undefined, COUNT]} frustumCulled={false} castShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#65584d" roughness={0.96} emissive="#292521" emissiveIntensity={0.15} />
      </instancedMesh>
      <instancedMesh ref={rubbleA} args={[undefined, undefined, COUNT]} frustumCulled={false} receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#74675b" roughness={0.98} emissive="#292521" emissiveIntensity={0.15} />
      </instancedMesh>
      <instancedMesh ref={rubbleB} args={[undefined, undefined, COUNT]} frustumCulled={false} receiveShadow>
        <dodecahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color="#7c6d60" roughness={0.95} emissive="#2d2925" emissiveIntensity={0.15} />
      </instancedMesh>
    </>
  )
}
