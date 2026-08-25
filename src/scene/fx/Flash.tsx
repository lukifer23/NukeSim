import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSim } from '../../state/store'
import { thermalPulseDurationS } from '../../sim/fireball'
import { getRenderTime } from '../runtimeClock'
import { fireballPulse } from './pulse'
import { atmosphereLook } from '../atmosphere'

export function Flash() {
  const ref = useRef<THREE.PointLight>(null)
  const overlay = useRef<THREE.Mesh>(null)
  const offset = useSim((s) => s.impactOffset)
  const hob = useSim((s) => s.hobResolved())
  const { camera, gl } = useThree()

  useFrame(() => {
    const s = useSim.getState()
    const t = getRenderTime()
    const rest = atmosphereLook(s.timeOfDay, s.city.biome).exposure
    const hold = Math.max(0.06, 0.08 * s.yieldKt ** 0.4)
    const white = t < hold ? 1 : Math.exp(-(t - hold) / 0.18)
    const after = Math.exp(-t / Math.max(0.6, thermalPulseDurationS(s.yieldKt)))
    const { pulse } = fireballPulse(t, s.yieldKt)
    if (ref.current) {
      ref.current.intensity = s.reducedMotion ? 5 * after : 18 * white + 6 * after
      ref.current.position.set(offset.x, Math.max(hob, 40), offset.z)
    }
    if (!s.reducedMotion && s.phase === 'detonate' && t < 1.2) {
      gl.toneMappingExposure = rest + white * 0.55 + pulse * 0.12
    } else {
      gl.toneMappingExposure = THREE.MathUtils.lerp(gl.toneMappingExposure, rest, 0.12)
    }
    if (overlay.current) {
      overlay.current.visible = !s.reducedMotion && s.phase === 'detonate' && white > 0.08 && t < 0.28
      const mat = overlay.current.material as THREE.MeshBasicMaterial
      mat.opacity = Math.min(0.18, white * 0.16)
      overlay.current.position.copy(camera.position)
      overlay.current.quaternion.copy(camera.quaternion)
      overlay.current.translateZ(-2.2)
    }
  })

  return (
    <>
      <pointLight ref={ref} color="#fff4e0" distance={28000} decay={1.1} />
      <mesh ref={overlay} frustumCulled={false}>
        <planeGeometry args={[14, 8]} />
        <meshBasicMaterial color="#f7f2ea" transparent opacity={0} depthTest={false} toneMapped={false} />
      </mesh>
    </>
  )
}
