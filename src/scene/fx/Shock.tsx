import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSim } from '../../state/store'
import { shockRadiusAtTimeM } from '../../sim'
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
    const fade = t < 0.04 ? 0 : Math.max(0.03, 0.55 * Math.exp(-t / 26))
    if (Math.abs(r - lastR.current) > 6) {
      updateDrapedRing(ringGeo, r, Math.max(16, r * 0.012), city.heightAt, offset.x, offset.z, 2.6)
      updateDrapedRing(dustGeo, r, Math.max(40, r * 0.04), city.heightAt, offset.x, offset.z, 1.8)
      lastR.current = r
    }
    if (ring.current) {
      ;(ring.current.material as THREE.MeshBasicMaterial).opacity = fade
    }
    if (dust.current) {
      ;(dust.current.material as THREE.MeshBasicMaterial).opacity = fade * 0.38
    }
    if (shell.current) {
      shell.current.position.set(offset.x, hob <= 1 ? r * 0.35 : Math.max(hob * 0.15, 8), offset.z)
      shell.current.scale.setScalar(r)
      shell.current.visible = t > 0.05 && t < 48
      shellMat.uniforms.uFade.value = fade
      shellMat.uniforms.uDust.value = Math.min(1, t / 18)
    }
    if (stem.current) {
      const mach = hob < s.report.optimumHob5PsiM * 0.65 && hob > 8
      const h = Math.min(42, 12 + r * 0.01)
      stem.current.visible = mach && t > 0.08 && t < 40
      stem.current.position.set(offset.x, h * 0.45, offset.z)
      stem.current.scale.set(r, h, r)
      ;(stem.current.material as THREE.MeshBasicMaterial).opacity = fade * 0.2
    }
  })

  return (
    <group>
      <mesh ref={shell} material={shellMat}>
        <sphereGeometry args={[1, 64, 40]} />
      </mesh>
      <mesh ref={ring} geometry={ringGeo} position={[offset.x, 0, offset.z]}>
        <meshBasicMaterial color="#f2ebe0" transparent opacity={0.5} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={dust} geometry={dustGeo} position={[offset.x, 0, offset.z]}>
        <meshBasicMaterial color="#8a7a68" transparent opacity={0.22} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={stem} position={[offset.x, 12, offset.z]}>
        <cylinderGeometry args={[1, 1.05, 1, 64, 1, true]} />
        <meshBasicMaterial color="#c4b4a0" transparent opacity={0.14} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
