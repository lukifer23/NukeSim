import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSim } from '../../state/store'
import { isSurfaceBurst, shockRadiusAtTimeM } from '../../sim'
import { getRenderTime } from '../runtimeClock'
import { makeDrapedRing, updateDrapedRing } from '../drape'
import { makeShockMaterial } from '../shaders/shockMat'

export function Shock() {
  const city = useSim((s) => s.city)
  const offset = useSim((s) => s.impactOffset)
  const ring = useRef<THREE.Mesh>(null)
  const dust = useRef<THREE.Mesh>(null)
  const shell = useRef<THREE.Mesh>(null)
  const stem = useRef<THREE.Mesh>(null)
  const lastR = useRef(0)
  const shellMat = useMemo(() => makeShockMaterial(), [])
  const ringGeo = useMemo(
    () => makeDrapedRing(40, 22, 128, city.heightAt, offset.x, offset.z, 2.6),
    [city, offset.x, offset.z],
  )
  const dustGeo = useMemo(
    () => makeDrapedRing(40, 70, 80, city.heightAt, offset.x, offset.z, 1.8),
    [city, offset.x, offset.z],
  )

  useFrame(() => {
    const s = useSim.getState()
    const hob = s.hobResolved()
    const t = getRenderTime()
    const r = Math.max(shockRadiusAtTimeM(s.yieldKt, hob, t), 8)
    // Finite life: the front genuinely dissipates instead of leaving a
    // permanent low-opacity ghost ring on the map.
    const fade = t < 0.04 ? 0 : Math.max(0, 0.26 * Math.exp(-t / 22) - 0.02)
    if (Math.abs(r - lastR.current) > 4) {
      // Both rings use MeshBasicMaterial, so normals are never shaded.
      updateDrapedRing(ringGeo, r, Math.max(16, r * 0.012), city.heightAt, offset.x, offset.z, 2.6, false)
      updateDrapedRing(dustGeo, r, Math.max(40, r * 0.045), city.heightAt, offset.x, offset.z, 1.8, false)
      lastR.current = r
    }
    const alive = fade > 0.004
    const machHeight = Math.max(16, Math.min(90, r * 0.02))
    const mach = hob > 6 && hob < s.report.optimumHob5PsiM * 0.78
    if (ring.current) {
      ring.current.visible = alive
      ;(ring.current.material as THREE.MeshBasicMaterial).opacity = fade
    }
    if (dust.current) {
      dust.current.visible = alive
      ;(dust.current.material as THREE.MeshBasicMaterial).opacity = fade * 0.42
    }
    if (shell.current) {
      shell.current.position.set(offset.x, isSurfaceBurst(hob) ? r * 0.35 : Math.max(hob * 0.15, 8), offset.z)
      shell.current.scale.setScalar(r)
      shell.current.visible = alive && t > 0.05 && t < 60
      shellMat.uniforms.uFade.value = fade * 1.8
      shellMat.uniforms.uDust.value = Math.min(1, t / 18)
      shellMat.uniforms.uTime.value = t
    }
    if (stem.current) {
      // Mach stem: near-ground merged front, wider and brighter than the
      // incident ring, only while the reflected shock is coupled.
      stem.current.visible = alive && mach
      stem.current.position.set(offset.x, machHeight * 0.5, offset.z)
      stem.current.scale.set(r, machHeight, r)
      ;(stem.current.material as THREE.MeshBasicMaterial).opacity = fade * 1.5
    }
  })

  return (
    <group>
      <mesh ref={shell} material={shellMat}>
        <sphereGeometry args={[1, 64, 40]} />
      </mesh>
      <mesh ref={ring} geometry={ringGeo} position={[offset.x, 0, offset.z]}>
        <meshBasicMaterial color="#efe8da" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={dust} geometry={dustGeo} position={[offset.x, 0, offset.z]}>
        <meshBasicMaterial color="#9c8b74" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={stem} position={[offset.x, 12, offset.z]}>
        <cylinderGeometry args={[1, 1.06, 1, 64, 1, true]} />
        <meshBasicMaterial color="#d8ccb8" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
