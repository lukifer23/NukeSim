import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSim, isLiveField } from '../../state/store'
import { isSurfaceBurst, arrivalTimeS, damageFromOverpressure, fireballMaxRadiusM, overpressureAtRangePsi } from '../../sim'
import { DamageState } from '../../sim/types'
import type { Building } from '../../city/types'
import { getRenderTime } from '../runtimeClock'
import { hidden } from '../instancing'
import { makeDustMaterial } from '../shaders/dustMat'

const MAX = 220

/**
 * Dust kicked up by structural collapse. One billboard per collapsing
 * building, expanding and settling over a few seconds so a ground burst reads
 * as a rolling dust front rather than buildings silently shrinking.
 */
export function CollapseDust() {
  const city = useSim((s) => s.city)
  const ref = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const mat = useMemo(() => makeDustMaterial(), [])
  const run = useSim((s) => s.runRevision)

  const seeds = useMemo(() => {
    const out: Building[] = []
    for (const b of city.buildings) {
      if (b.district === 'park') continue
      if (out.length >= MAX) break
      out.push(b)
    }
    return out
  }, [city])

  const alpha = useMemo(() => new Float32Array(MAX), [])
  const seedAttr = useMemo(() => new Float32Array(MAX), [])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    for (let i = 0; i < MAX; i++) {
      alpha[i] = 0
      seedAttr[i] = (i % 17) / 17
      mesh.setMatrixAt(i, hidden(dummy))
    }
    mesh.geometry.setAttribute('aAlpha', new THREE.InstancedBufferAttribute(alpha, 1))
    mesh.geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seedAttr, 1))
    mesh.instanceMatrix.needsUpdate = true
  }, [alpha, dummy, run, seedAttr])

  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    const s = useSim.getState()
    if (!isLiveField(s.phase)) return
    const t = getRenderTime()
    if (t < 0.2) {
      mesh.count = 0
      return
    }
    const hob = s.hobResolved()
    const fb = fireballMaxRadiusM(s.yieldKt, isSurfaceBurst(hob))
    const ox = s.impactOffset.x
    const oz = s.impactOffset.z
    const reduced = s.reducedMotion
    mat.uniforms.uTime.value = reduced ? 0 : t
    let n = 0
    for (let i = 0; i < seeds.length; i++) {
      const b = seeds[i]
      const r = Math.hypot(b.x - ox, b.z - oz)
      const damage = damageFromOverpressure(b.class, overpressureAtRangePsi(s.yieldKt, hob, r), r < fb)
      if (damage !== DamageState.Collapsed && damage !== DamageState.Vaporized && damage !== DamageState.Severe) continue
      const arrival = arrivalTimeS(s.yieldKt, hob, r)
      const age = t - arrival - (i % 7) * 0.05
      if (age < 0.08 || age > 9) continue
      const y0 = city.heightAt(b.x, b.z)
      const grow = Math.min(1, age / (reduced ? 0.4 : 1.6))
      const fade = 1 - THREE.MathUtils.smoothstep(age, 3.5, 9)
      const span = (b.w + b.d) * 0.5 + b.h * 0.55 + 30
      const width = span * (0.35 + 0.85 * grow)
      const height = (10 + b.h * 0.32 + 18) * (0.4 + 0.8 * grow)
      dummy.position.set(b.x, y0 + height * 0.34, b.z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(width, height, 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(n, dummy.matrix)
      alpha[n] = fade * (damage === DamageState.Severe ? 0.5 : 0.85)
      seedAttr[n] = (i % 17) / 17
      n++
    }
    mesh.count = n
    mesh.instanceMatrix.needsUpdate = true
    const aAttr = mesh.geometry.getAttribute('aAlpha') as THREE.InstancedBufferAttribute
    const sAttr = mesh.geometry.getAttribute('aSeed') as THREE.InstancedBufferAttribute
    aAttr.needsUpdate = true
    sAttr.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, mat, MAX]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
    </instancedMesh>
  )
}
