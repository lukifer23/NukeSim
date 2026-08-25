import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSim } from '../../state/store'
import { fireballRadiusAtTimeM } from '../../sim'
import { makeFireballMaterial } from '../shaders/fireballMat'
import { fireballPulse } from './pulse'
import { getRenderTime } from '../runtimeClock'
const inv = new THREE.Matrix4()

export function Fireball() {
  const mesh = useRef<THREE.Mesh>(null)
  const core = useRef<THREE.Mesh>(null)
  const mat = useMemo(() => makeFireballMaterial(), [])
  const offset = useSim((s) => s.impactOffset)
  const reduced = useSim((s) => s.reducedMotion)

  useFrame(() => {
    const s = useSim.getState()
    const t = getRenderTime()
    const hob = s.hobResolved()
    const surface = hob <= 1
    const r = Math.max(fireballRadiusAtTimeM(s.yieldKt, t, surface), 1)
    const { pulse, cool } = fireballPulse(t, s.yieldKt)
    const flatten = surface ? 0.42 : 1
    const y = surface ? r * flatten * 0.45 : Math.max(hob, r * 0.2)
    if (mesh.current) {
      mesh.current.scale.set(r, r * flatten, r)
      mesh.current.position.set(offset.x, y, offset.z)
      mesh.current.visible = t < 24 && cool < 0.97
      mesh.current.updateWorldMatrix(true, false)
      inv.copy(mesh.current.matrixWorld).invert()
      mat.uniforms.uInvModel.value.copy(inv)
    }
    if (core.current) {
      const cr = r * (0.28 + pulse * 0.1)
      core.current.scale.set(cr, cr * flatten, cr)
      core.current.position.set(offset.x, y, offset.z)
      core.current.visible = !reduced && t < 2.2 && cool < 0.5
      const cm = core.current.material as THREE.MeshBasicMaterial
      cm.opacity = (1 - cool) * 0.35
    }
    mat.uniforms.uTime.value = t
    mat.uniforms.uPulse.value = pulse
    mat.uniforms.uCool.value = cool
    mat.uniforms.uSurface.value = surface ? 1 : 0
    mat.uniforms.uRadius.value = r
  })

  return (
    <group>
      <mesh ref={mesh} material={mat}>
        <sphereGeometry args={[1, 48, 36]} />
      </mesh>
      <mesh ref={core}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshBasicMaterial color="#fff6e8" transparent opacity={0.8} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}
