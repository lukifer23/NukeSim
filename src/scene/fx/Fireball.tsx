import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSim } from '../../state/store'
import { isSurfaceBurst, fireballRadiusAtTimeM, fireballRiseM } from '../../sim'
import { makeFireballMaterial } from '../shaders/fireballMat'
import { fireballPulse } from './pulse'
import { getRenderTime } from '../runtimeClock'
import { volumeSteps } from '../quality'

const inv = new THREE.Matrix4()

export function Fireball() {
  const mesh = useRef<THREE.Mesh>(null)
  const mat = useMemo(() => makeFireballMaterial(), [])
  const core = useMemo(() => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 16),
      new THREE.MeshBasicMaterial({ color: '#ffc47a', transparent: true, opacity: 0, depthWrite: false, depthTest: false }),
    )
    m.frustumCulled = false
    m.renderOrder = 2
    return m
  }, [])
  const offset = useSim((s) => s.impactOffset)
  const reduced = useSim((s) => s.reducedMotion)
  const quality = useSim((s) => s.renderQuality)

  useFrame(() => {
    const s = useSim.getState()
    const t = getRenderTime()
    const hob = s.hobResolved()
    const surface = isSurfaceBurst(hob)
    const r = Math.max(fireballRadiusAtTimeM(s.yieldKt, t, surface), 1)
    const { pulse, cool } = fireballPulse(t, s.yieldKt)
    const fade = 1 - THREE.MathUtils.smoothstep(cool, 0.8, 1)
    const flatten = surface ? 0.42 : 1
    const baseY = surface ? r * flatten * 0.45 : Math.max(hob, r * 0.2)
    const y = baseY + fireballRiseM(s.yieldKt, t, r)
    const alive = fade > 0.01 && cool < 0.999
    if (mesh.current) {
      mesh.current.scale.set(r, r * flatten, r)
      mesh.current.position.set(offset.x, y, offset.z)
      mesh.current.visible = alive
      mesh.current.updateWorldMatrix(true, false)
      inv.copy(mesh.current.matrixWorld).invert()
      mat.uniforms.uInvModel.value.copy(inv)
    }
    const cr = r * (0.46 + pulse * 0.1)
    core.scale.set(cr, cr * flatten, cr)
    core.position.set(offset.x, y, offset.z)
    core.visible = alive && !reduced && cool < 0.82
    ;(core.material as THREE.MeshBasicMaterial).opacity = core.visible ? (1 - cool) * 0.5 * fade : 0
    mat.uniforms.uTime.value = t
    mat.uniforms.uPulse.value = pulse
    mat.uniforms.uCool.value = cool
    mat.uniforms.uFade.value = fade
    mat.uniforms.uSurface.value = surface ? 1 : 0
    mat.uniforms.uSteps.value = volumeSteps(quality)
  })

  return (
    <group>
      <mesh ref={mesh} material={mat}>
        <sphereGeometry args={[1, 48, 36]} />
      </mesh>
      <primitive object={core} />
    </group>
  )
}
