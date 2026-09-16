import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSim } from '../../state/store'
import { damageFromOverpressure, fireballMaxRadiusM, overpressureAtRangePsi, shockRadiusAtTimeM } from '../../sim'
import { DamageState } from '../../sim/types'
import { getRenderTime } from '../runtimeClock'

const COUNT = 120

export function Debris() {
  const city = useSim((s) => s.city)
  const flying = useRef<THREE.InstancedMesh>(null)
  const rubbleA = useRef<THREE.InstancedMesh>(null)
  const rubbleB = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const pieces = useMemo(() => {
    return city.buildings
      .filter((_, i) => i % 5 === 0)
      .slice(0, COUNT)
      .map((b, i) => ({
        x: b.x,
        z: b.z,
        y: city.heightAt(b.x, b.z) + b.h * 0.45,
        ground: city.heightAt(b.x, b.z) + 1.4,
        cls: b.class,
        lift: 9 + (i % 17) * 3.4,
        spin: 0.28 + (i % 9) * 0.11,
        size: Math.min(b.w, b.d) * 0.045 + 0.7,
        yaw: (i * 1.7) % 6,
        kind: i % 3,
      }))
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
    const shock = shockRadiusAtTimeM(s.yieldKt, hob, t)
    const fb = fireballMaxRadiusM(s.yieldKt, hob <= 1)
    const reduced = s.reducedMotion
    let flyN = 0
    let pileAN = 0
    let pileBN = 0
    for (const p of pieces) {
      const r = Math.hypot(p.x - s.impactOffset.x, p.z - s.impactOffset.z)
      if (r > shock * 0.92) continue
      const psi = overpressureAtRangePsi(s.yieldKt, hob, r)
      const damage = damageFromOverpressure(p.cls, psi, r < fb)
      if (damage !== DamageState.Collapsed && damage !== DamageState.Vaporized) continue
      const age = Math.max(0, t - r / Math.max(260, shock / Math.max(t, 0.2)))
      const y = p.y + p.lift * age - 4.9 * age * age
      if (!reduced && y > p.ground && age < 7) {
        dummy.position.set(p.x, y, p.z)
        dummy.rotation.set(age * p.spin, age * p.spin * 1.7, age * p.spin * 0.6)
        dummy.scale.setScalar(p.size)
        dummy.updateMatrix()
        air.setMatrixAt(flyN++, dummy.matrix)
      } else {
        dummy.position.set(p.x + Math.sin(p.yaw) * 3, p.ground, p.z + Math.cos(p.yaw) * 3)
        dummy.rotation.set(0.4, p.yaw, 0.2)
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
      <instancedMesh ref={flying} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#65584d" roughness={0.96} emissive="#292521" emissiveIntensity={0.15} />
      </instancedMesh>
      <instancedMesh ref={rubbleA} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#74675b" roughness={0.98} emissive="#292521" emissiveIntensity={0.15} />
      </instancedMesh>
      <instancedMesh ref={rubbleB} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <dodecahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color="#7c6d60" roughness={0.95} emissive="#2d2925" emissiveIntensity={0.15} />
      </instancedMesh>
    </>
  )
}
