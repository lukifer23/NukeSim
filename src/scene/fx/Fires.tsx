import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Sparkles } from '@react-three/drei'
import { useSim } from '../../state/store'
import { shockRadiusAtTimeM } from '../../sim'
import { getRenderTime } from '../runtimeClock'
import { makeFireMaterial } from '../shaders/fireMat'
import { ignitesAt, ignitionSampleFromStore, resetIgnitionCache } from '../ignitionField'

const MAX = 280

export function Fires() {
  const city = useSim((s) => s.city)
  const { camera } = useThree()
  const ref = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const mat = useMemo(() => makeFireMaterial(), [])
  const fieldSig = useSim((s) => `${s.runRevision}`)
  const seeds = useMemo(() => {
    const pts: Array<{ x: number; z: number; y: number; cls: (typeof city.buildings)[0]['class']; h: number }> = []
    for (const b of city.buildings) {
      if (b.district === 'park') continue
      if (pts.length >= MAX) break
      if ((Math.abs(Math.floor(b.x) + Math.floor(b.z))) % 5 !== 0) continue
      pts.push({ x: b.x, z: b.z, y: city.heightAt(b.x, b.z) + Math.min(b.h, 28) * 0.35, cls: b.class, h: b.h })
    }
    return pts
  }, [city])
  useLayoutEffect(() => {
    resetIgnitionCache(fieldSig)
  }, [seeds, fieldSig])

  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    const s = useSim.getState()
    const t = getRenderTime()
    mat.uniforms.uTime.value = t
    if (t < 1.15) {
      mesh.count = 0
      return
    }
    const hob = s.hobResolved()
    const shock = shockRadiusAtTimeM(s.yieldKt, hob, t)
    const ox = s.impactOffset.x
    const oz = s.impactOffset.z
    let n = 0
    const sample = ignitionSampleFromStore(s)
    const reduced = s.reducedMotion
    for (let i = 0; i < seeds.length; i++) {
      const p = seeds[i]
      const r = Math.hypot(p.x - ox, p.z - oz)
      if (r > shock) continue
      if (!ignitesAt(p.x, p.z, p.y, p.cls, sample)) continue
      const flicker = reduced ? 1 : 0.86 + 0.1 * Math.sin(t * 9 + i * 2.1) + 0.04 * Math.sin(t * 23 + i * 0.7)
      dummy.position.set(p.x, p.y, p.z)
      dummy.scale.set(8 + p.h * 0.045, (14 + p.h * 0.09) * flicker, 8 + p.h * 0.045)
      dummy.lookAt(camera.position)
      dummy.updateMatrix()
      mesh.setMatrixAt(n, dummy.matrix)
      n++
    }
    mesh.count = n
    mesh.instanceMatrix.needsUpdate = true
  })

  const reduced = useSim((s) => s.reducedMotion)
  const offset = useSim((s) => s.impactOffset)
  const simTime = useSim((s) => s.simTime)
  const embers = !reduced && simTime > 1.2 && simTime < 240

  return (
    <>
      <instancedMesh ref={ref} args={[undefined, mat, MAX]} frustumCulled={false}>
        <planeGeometry args={[1, 1.8]} />
      </instancedMesh>
      {embers && (
        <Sparkles
          count={48}
          position={[offset.x, 24, offset.z]}
          scale={[220, 80, 220]}
          size={4}
          speed={0.45}
          opacity={0.5}
          color="#ff9a48"
          noise={0.35}
        />
      )}
    </>
  )
}
