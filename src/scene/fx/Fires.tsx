import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSim } from '../../state/store'
import { arrivalTimeS, shockRadiusAtTimeM } from '../../sim'
import { getRenderTime } from '../runtimeClock'
import { makeFireMaterial } from '../shaders/fireMat'
import { ignitesAt, ignitionSampleFromStore, resetIgnitionCache } from '../ignitionField'
import { selectFireSeeds } from './seeds'

const MAX = 280

export function Fires() {
  const city = useSim((s) => s.city)
  const { camera } = useThree()
  const ref = useRef<THREE.InstancedMesh>(null)
  const emberRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const mat = useMemo(() => makeFireMaterial(), [])
  const fieldSig = useSim((s) => `${s.runRevision}`)
  const seeds = useMemo(() => selectFireSeeds(city, MAX), [city])
  const seedAttr = useMemo(() => new Float32Array(MAX), [])

  useLayoutEffect(() => {
    resetIgnitionCache(fieldSig)
    const mesh = ref.current
    if (!mesh) return
    for (let i = 0; i < MAX; i++) seedAttr[i] = (i % 23) / 23
    mesh.geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seedAttr, 1))
  }, [seeds, fieldSig, seedAttr])

  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    const s = useSim.getState()
    const t = getRenderTime()
    mat.uniforms.uTime.value = t
    if (t < 1.15) {
      mesh.count = 0
      if (emberRef.current) emberRef.current.count = 0
      return
    }
    const hob = s.hobResolved()
    const shock = shockRadiusAtTimeM(s.yieldKt, hob, t)
    const ox = s.impactOffset.x
    const oz = s.impactOffset.z
    const camX = camera.position.x
    const camZ = camera.position.z
    let n = 0
    let en = 0
    const embers = emberRef.current
    const seedBuf = mesh.geometry.getAttribute('aSeed') as THREE.InstancedBufferAttribute | undefined
    const sample = ignitionSampleFromStore(s)
    const reduced = s.reducedMotion
    // Larger yields produce coalescing mass fires, not the same tiny flames.
    const sizeScale = 1 + 0.6 * Math.log10(s.yieldKt + 1)
    for (let i = 0; i < seeds.length; i++) {
      const b = seeds[i]
      const r = Math.hypot(b.x - ox, b.z - oz)
      if (r > shock) continue
      const y = city.heightAt(b.x, b.z) + Math.min(b.h, 40) * 0.4
      if (!ignitesAt(b.x, b.z, y, b.class, sample)) continue
      const arrival = arrivalTimeS(s.yieldKt, hob, r)
      const age = t - arrival - 0.9
      if (age < 0 || age > 120) continue
      const grow = Math.min(1, age / 1.6)
      const burnout = 1 - THREE.MathUtils.smoothstep(age, 45, 110)
      if (grow <= 0.01 || burnout <= 0.01) continue
      const flicker = reduced ? 1 : 0.86 + 0.1 * Math.sin(t * 9 + i * 2.1) + 0.04 * Math.sin(t * 23 + i * 0.7)
      const w = (8 + b.h * 0.045) * (0.55 + 0.45 * grow) * sizeScale
      const hh = (14 + b.h * 0.09) * flicker * (0.55 + 0.45 * grow) * burnout * sizeScale
      dummy.position.set(b.x, y, b.z)
      dummy.scale.set(w, hh, w)
      // Billboard around the vertical axis only, so flames never lean over.
      dummy.rotation.set(0, Math.atan2(camX - b.x, camZ - b.z), 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(n, dummy.matrix)
      if (seedBuf) seedBuf.array[n] = (i * 0.618) % 1
      n++

      if (embers && n % 3 === 0) {
        const rise = age * 7
        dummy.position.set(b.x, y + hh * 0.6 + rise, b.z)
        dummy.rotation.set(0, 0, 0)
        dummy.scale.setScalar(Math.max(0.4, 2.4 * burnout))
        dummy.updateMatrix()
        embers.setMatrixAt(en++, dummy.matrix)
      }
    }
    mesh.count = n
    mesh.instanceMatrix.needsUpdate = true
    if (seedBuf) seedBuf.needsUpdate = true
    if (embers) {
      embers.count = en
      embers.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <>
      <instancedMesh ref={ref} args={[undefined, mat, MAX]} frustumCulled={false}>
        <planeGeometry args={[1, 1.8]} />
      </instancedMesh>
      <instancedMesh ref={emberRef} args={[undefined, undefined, MAX]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#ff8c3a" transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </instancedMesh>
    </>
  )
}
