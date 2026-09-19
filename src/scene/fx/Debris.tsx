import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSim } from '../../state/store'
import { isSurfaceBurst, arrivalTimeS, damageFromOverpressure, fireballMaxRadiusM, overpressureAtRangePsi } from '../../sim'
import { DamageState } from '../../sim/types'
import type { BuildingClass } from '../../sim/types'
import { getRenderTime } from '../runtimeClock'

const COUNT = 360
const GRAVITY = 9.8
const RESTITUTION = 0.34
const GROUND_FRICTION = 0.55

type Piece = {
  x: number
  z: number
  y: number
  cls: BuildingClass
  dirX: number
  dirZ: number
  speed: number
  lift: number
  spin: number
  size: number
  kind: number
  delay: number
}

type PieceState = {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  rx: number
  ry: number
  rz: number
  spin: number
  active: boolean
  rest: boolean
  settle: number
}

/**
 * Analytic ballistic debris with terrain bounces. Each fragment is launched
 * outward from ground zero when the shock front reaches its building, then
 * integrated with clamped frame deltas: it arcs, bounces off the actual
 * terrain under it with restitution and friction, and settles into a pile
 * instead of snapping to a precomputed landing point.
 */
export function Debris() {
  const city = useSim((s) => s.city)
  const flying = useRef<THREE.InstancedMesh>(null)
  const rubbleA = useRef<THREE.InstancedMesh>(null)
  const rubbleB = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const lastT = useRef(0)
  const lastRevision = useRef(-1)

  const pieces = useMemo<Piece[]>(() => {
    const gz = city.gz
    return city.buildings
      .filter((_, i) => i % 5 === 0)
      .slice(0, COUNT)
      .map((b, i) => {
        // Bias the throw outward from ground zero so the debris field reads as
        // a blast, not a scatter.
        const base = Math.atan2(b.z - gz.z, b.x - gz.x)
        const yaw = base + ((i % 7) - 3) * 0.18
        const speed = 20 + (i % 13) * 6
        return {
          x: b.x + Math.sin(i * 2.4) * b.w * 0.3,
          z: b.z + Math.cos(i * 2.4) * b.d * 0.3,
          y: city.heightAt(b.x, b.z) + b.h * (0.3 + (i % 5) * 0.09),
          cls: b.class,
          dirX: Math.cos(yaw),
          dirZ: Math.sin(yaw),
          speed,
          lift: 11 + (i % 17) * 3.6,
          spin: 0.28 + (i % 9) * 0.11,
          size: Math.min(b.w, b.d) * 0.05 + 0.9,
          kind: i % 3,
          delay: (i % 7) * 0.06,
        }
      })
  }, [city])

  const state = useRef<PieceState[]>([])

  const reset = () => {
    state.current = pieces.map(() => ({
      x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
      rx: 0, ry: 0, rz: 0, spin: 0, active: false, rest: false, settle: 0,
    }))
    lastT.current = 0
  }

  useFrame(() => {
    const air = flying.current
    const pileA = rubbleA.current
    const pileB = rubbleB.current
    if (!air || !pileA || !pileB) return
    const s = useSim.getState()
    const t = getRenderTime()
    // A new run or a backward scrub restarts the simulation.
    if (state.current.length !== pieces.length || s.runRevision !== lastRevision.current || t < lastT.current) {
      reset()
      lastRevision.current = s.runRevision
    }
    const dt = Math.min(0.05, Math.max(0, t - lastT.current))
    lastT.current = t
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
      const st = state.current[pi]
      if (!st || (damage !== DamageState.Collapsed && damage !== DamageState.Vaporized)) continue

      const launch = arrivalTimeS(s.yieldKt, hob, r) + p.delay
      if (t < launch) continue
      if (!st.active) {
        st.active = true
        st.x = p.x
        st.y = p.y
        st.z = p.z
        st.vx = p.dirX * p.speed
        st.vz = p.dirZ * p.speed
        st.vy = reduced ? p.lift * 0.4 : p.lift
        st.spin = reduced ? 0 : p.spin
        st.rx = 0
        st.ry = p.dirX * 3
        st.rz = 0
      }

      if (!st.rest) {
        st.vy -= GRAVITY * dt
        st.x += st.vx * dt
        st.y += st.vy * dt
        st.z += st.vz * dt
        const ground = city.heightAt(st.x, st.z) + p.size * 0.5
        if (st.y <= ground) {
          st.y = ground
          const horizontal = Math.hypot(st.vx, st.vz)
          if (!reduced && (Math.abs(st.vy) > 1.2 || horizontal > 1.6)) {
            st.vy = -st.vy * RESTITUTION
            st.vx *= GROUND_FRICTION
            st.vz *= GROUND_FRICTION
            st.spin *= 0.6
          } else {
            st.vy = 0
            st.vx *= 0.5
            st.vz *= 0.5
            st.spin = 0
            st.rest = true
          }
        }
        st.rx += st.spin * dt
        st.rz += st.spin * dt * 0.7
      } else {
        st.settle = Math.min(1, st.settle + dt * 4)
      }

      if (!st.rest) {
        dummy.position.set(st.x, st.y, st.z)
        dummy.rotation.set(st.rx, st.ry, st.rz)
        dummy.scale.setScalar(p.size)
        dummy.updateMatrix()
        air.setMatrixAt(flyN++, dummy.matrix)
      } else {
        dummy.position.set(st.x, st.y + p.size * 0.16 * st.settle, st.z)
        dummy.rotation.set(0.5 * st.settle, st.ry, 0.22 * st.settle)
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
