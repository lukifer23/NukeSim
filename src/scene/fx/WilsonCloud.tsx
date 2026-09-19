import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSim } from '../../state/store'
import { isSurfaceBurst, fireballRadiusAtTimeM } from '../../sim'
import { makeIceMaterial } from '../shaders/iceMat'
import { getRenderTime } from '../runtimeClock'
import { atmosphereLook } from '../atmosphere'

/**
 * Wilson cloud: the white condensation shell that blooms around an airburst
 * as the shock rarefaction drops pressure below the dew point. It only forms
 * in sufficiently moist air, so it is tied to humidity and visibility.
 */
export function WilsonCloud() {
  const ref = useRef<THREE.Mesh>(null)
  const mat = useMemo(() => makeIceMaterial(), [])
  const offset = useSim((s) => s.impactOffset)
  const reduced = useSim((s) => s.reducedMotion)

  useFrame(() => {
    const s = useSim.getState()
    const mesh = ref.current
    if (!mesh) return
    const t = getRenderTime()
    const hob = s.hobResolved()
    const surface = isSurfaceBurst(hob)
    const r = Math.max(fireballRadiusAtTimeM(s.yieldKt, t, surface), 1)
    // Humidity gates the cloud; dry desert air forms only a faint shell.
    const humidity = s.city.biome.humidity
    const airborne = hob > 1 || s.report.fireballTouchesGround
    const bloom = THREE.MathUtils.smoothstep(t, 0.7, 2.6) * (1 - THREE.MathUtils.smoothstep(t, 9, 26))
    const fade = bloom * (0.35 + 0.65 * humidity) * (airborne ? 1 : 0.45)
    const radius = r * 1.4
    const flatten = surface ? 0.5 : 1
    mesh.scale.set(radius, radius * flatten, radius)
    mesh.position.set(offset.x, surface ? radius * flatten * 0.45 : Math.max(hob, r * 0.2), offset.z)
    mesh.visible = fade > 0.01
    mat.uniforms.uFade.value = reduced ? fade * 0.5 : fade
    mat.uniforms.uTime.value = reduced ? 0 : t
    const look = atmosphereLook(s.timeOfDay, s.city.biome)
    mat.uniforms.uSun.value.set(look.sunPos[0], look.sunPos[1], look.sunPos[2])
  })

  return (
    <mesh ref={ref} material={mat} frustumCulled={false}>
      <sphereGeometry args={[1, 48, 32]} />
    </mesh>
  )
}
