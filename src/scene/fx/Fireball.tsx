import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSim } from '../../state/store'
import { fireballRadiusAtTimeM } from '../../sim'
import { makeFireballMaterial } from '../shaders/fireballMat'
import { fireballPulse } from './pulse'
import { getRenderTime } from '../runtimeClock'
import { fireballCore } from './fireballCore'
const inv = new THREE.Matrix4()

export function Fireball() {
  const mesh = useRef<THREE.Mesh>(null)
  const mat = useMemo(() => makeFireballMaterial(), [])
  const offset = useSim((s) => s.impactOffset)
  const reduced = useSim((s) => s.reducedMotion)
  const quality = useSim((s) => s.renderQuality)

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
    const cr = r * (0.46 + pulse * 0.1)
    fireballCore.scale.set(cr, cr * flatten, cr)
    fireballCore.position.set(offset.x, y, offset.z)
    fireballCore.visible = !reduced && t < 8 && cool < 0.75
    ;(fireballCore.material as THREE.MeshBasicMaterial).opacity = fireballCore.visible ? (1 - cool) * 0.68 : 0
    mat.uniforms.uTime.value = t
    mat.uniforms.uPulse.value = pulse
    mat.uniforms.uCool.value = cool
    mat.uniforms.uSurface.value = surface ? 1 : 0
    mat.uniforms.uRadius.value = r
    mat.uniforms.uSteps.value = quality === 'high' ? 36 : quality === 'balanced' ? 28 : 18
  })

  return (
    <group>
      <mesh ref={mesh} material={mat}>
        <sphereGeometry args={[1, 48, 36]} />
      </mesh>
      <primitive object={fireballCore} />
    </group>
  )
}
