import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSim } from '../../state/store'
import { thermalPulseDurationS } from '../../sim/fireball'
import { getRenderTime } from '../runtimeClock'

export function Flash() {
  const ref = useRef<THREE.PointLight>(null)
  const whiteout = useRef<THREE.Mesh>(null)
  const afterglow = useRef<THREE.Mesh>(null)
  const offset = useSim((s) => s.impactOffset)
  const hob = useSim((s) => s.hobResolved())
  const { camera } = useThree()

  useFrame(() => {
    const s = useSim.getState()
    const t = getRenderTime()
    const pulseS = Math.max(0.6, thermalPulseDurationS(s.yieldKt))
    // The blinding whiteout is brief (tens to a few hundred ms) regardless of
    // yield; the longer yield-scaled term is the hot afterglow, not the flash.
    const flashDur = Math.min(0.32, 0.05 + 0.02 * Math.cbrt(s.yieldKt))
    const white = Math.exp(-t / flashDur)
    const glow = Math.exp(-t / pulseS)
    if (ref.current) {
      // Inverse-square flash: intensity is candela, so illuminance falls off
      // correctly and the light actually throws shadows across the city.
      ref.current.intensity = s.reducedMotion ? 2.5e5 * glow : 3.2e6 * white + 4e5 * glow
      ref.current.position.set(offset.x, Math.max(hob, 40), offset.z)
    }
    if (whiteout.current) {
      whiteout.current.visible = !s.reducedMotion && s.phase === 'detonate' && white > 0.02
      const mat = whiteout.current.material as THREE.MeshBasicMaterial
      mat.opacity = Math.min(0.96, white * 0.96)
      place(whiteout.current, camera)
    }
    if (afterglow.current) {
      afterglow.current.visible = !s.reducedMotion && s.phase === 'detonate' && t < 2.4
      const mat = afterglow.current.material as THREE.MeshBasicMaterial
      mat.opacity = Math.min(0.2, Math.exp(-t / 0.7) * 0.2)
      place(afterglow.current, camera)
    }
  })

  return (
    <>
      <pointLight ref={ref} color="#fff4e0" decay={2} distance={0} />
      <mesh ref={whiteout} frustumCulled={false} renderOrder={999}>
        <planeGeometry args={[16, 10]} />
        <meshBasicMaterial color="#f7f2ea" transparent opacity={0} depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={afterglow} frustumCulled={false} renderOrder={998}>
        <planeGeometry args={[16, 10]} />
        <meshBasicMaterial color="#ffb066" transparent opacity={0} depthTest={false} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </>
  )
}

function place(mesh: THREE.Mesh, camera: THREE.Camera) {
  mesh.position.copy(camera.position)
  mesh.quaternion.copy(camera.quaternion)
  mesh.translateZ(-2.6)
}
