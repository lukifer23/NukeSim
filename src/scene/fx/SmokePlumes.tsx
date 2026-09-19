import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSim } from '../../state/store'
import { shockRadiusAtTimeM } from '../../sim'
import { getRenderTime } from '../runtimeClock'
import { makeSmokeMaterial } from '../shaders/smokeMat'
import { ignitesAt, ignitionSampleFromStore } from '../ignitionField'
import { selectFireSeeds } from './seeds'

const SEEDS = 80
const CARDS = 3
const COUNT = SEEDS * CARDS

export function SmokePlumes() {
  const city = useSim((s) => s.city)
  const ref = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const mat = useMemo(() => makeSmokeMaterial({ ice: false }), [])
  const seeds = useMemo(() => {
    // Same seed set as Fires (first N), so every plume rises from a real fire.
    return selectFireSeeds(city, SEEDS).map((b, i) => ({
      x: b.x,
      z: b.z,
      y: city.heightAt(b.x, b.z) + b.h * 0.4,
      cls: b.class,
      h: b.h,
      delay: 1.5 + (i % 10) * 0.18,
      scale: 22 + (i % 6) * 7,
    }))
  }, [city])

  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    const s = useSim.getState()
    const t = getRenderTime()
    const hob = s.hobResolved()
    const shock = shockRadiusAtTimeM(s.yieldKt, hob, t)
    const sample = ignitionSampleFromStore(s)
    mat.uniforms.uTime.value = s.reducedMotion ? 0 : t
    const dir = (s.windDirDeg * Math.PI) / 180
    mat.uniforms.uWind.value.set(Math.sin(dir) * (s.windSpeedMps / 20), Math.cos(dir) * (s.windSpeedMps / 20))
    mat.uniforms.uOpacity.value = 0.42
    const sizeScale = 1 + 0.5 * Math.log10(s.yieldKt + 1)
    let n = 0
    for (const p of seeds) {
      const r = Math.hypot(p.x - s.impactOffset.x, p.z - s.impactOffset.z)
      if (r > shock) continue
      if (!ignitesAt(p.x, p.z, p.y, p.cls, sample)) continue
      const age = t - p.delay
      if (age < 0 || age > 90) continue
      const drift = age * s.windSpeedMps * 1.4
      const grow = Math.min(1, age / 4) * Math.max(0.15, 1 - age / 100)
      for (let c = 0; c < CARDS; c++) {
        dummy.position.set(
          p.x + Math.sin(dir) * (drift + c * 6),
          p.y + 10 * sizeScale + age * 11 + c * 18 * grow,
          p.z + Math.cos(dir) * (drift + c * 6),
        )
        dummy.scale.set(
          p.scale * grow * (0.85 + c * 0.4) * sizeScale,
          p.scale * grow * (1.05 + c * 0.35) * sizeScale,
          1,
        )
        dummy.rotation.set(0, 0, 0)
        dummy.updateMatrix()
        mesh.setMatrixAt(n++, dummy.matrix)
      }
    }
    mesh.count = n
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, mat, COUNT]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
    </instancedMesh>
  )
}
