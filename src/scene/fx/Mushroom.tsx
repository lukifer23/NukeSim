import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSim } from '../../state/store'
import { isSurfaceBurst, cloudHeightAtTimeM, fireballRadiusAtTimeM } from '../../sim'
import { makeVolumeCloudMaterial } from '../shaders/volumeCloudMat'
import { getRenderTime } from '../runtimeClock'
import { fireballPulse as pulseOf } from './pulse'
import { atmosphereLook } from '../atmosphere'

const inv = new THREE.Matrix4()

export function Mushroom() {
  const volume = useRef<THREE.Mesh>(null)
  const offset = useSim((s) => s.impactOffset)
  const mat = useMemo(() => makeVolumeCloudMaterial(), [])
  const quality = useSim((s) => s.renderQuality)

  useFrame(() => {
    const s = useSim.getState()
    const t = getRenderTime()
    const hob = s.hobResolved()
    const surface = isSurfaceBurst(hob) || s.report.fireballTouchesGround
    const { cool } = pulseOf(t, s.yieldKt)
    const fb = fireballRadiusAtTimeM(s.yieldKt, t, isSurfaceBurst(hob))
    const show = t >= 0.9 && cool > 0.12
    const h = cloudHeightAtTimeM(s.report.cloud, t)
    const grow = Math.min(1, Math.max(0, (t - 0.9) / Math.max(Math.min(s.report.cloud.stabilizeS, 90), 8)))
    const wind = s.windSpeedMps
    const dir = (s.windDirDeg * Math.PI) / 180
    const wx = Math.sin(dir) * (wind / 20)
    const wz = Math.cos(dir) * (wind / 20)
    const look = atmosphereLook(s.timeOfDay, s.city.biome)
    mat.uniforms.uTime.value = s.reducedMotion ? 0 : t
    mat.uniforms.uWind.value.set(wx, wz)
    mat.uniforms.uGrow.value = Math.max(0.08, grow)
    mat.uniforms.uSurface.value = surface ? 1 : 0
    mat.uniforms.uOpacity.value = 0.8 + 0.14 * grow
    mat.uniforms.uSun.value.set(look.sunPos[0], look.sunPos[1], look.sunPos[2])
    mat.uniforms.uSteps.value = quality === 'high' ? 36 : quality === 'balanced' ? 28 : 18
    if (volume.current) {
      volume.current.visible = show
      // SDF spans object y ≈ -0.46 (stem foot) to +0.40 (cap centre); map that
      // span onto (ground → stabilized cap altitude) so the column rises from
      // the ground instead of floating.
      const capEff = s.report.cloud.capDiameterM * (0.08 + 0.72 * grow)
      const height = Math.max(h, fb * 1.3)
      const baseY = isSurfaceBurst(hob) ? fb * 0.12 : Math.max(hob * 0.12, 16)
      const span = Math.max(height - baseY, fb * 1.1, 40)
      const sy = span / 0.86
      const sx = Math.max(capEff * 0.76, span * 0.16)
      volume.current.position.set(offset.x, baseY + 0.46 * sy, offset.z)
      volume.current.scale.set(sx, sy, sx)
      volume.current.updateWorldMatrix(true, false)
      inv.copy(volume.current.matrixWorld).invert()
      mat.uniforms.uInvModel.value.copy(inv)
    }
  })

  return (
    <mesh ref={volume} material={mat} frustumCulled={false}>
      <boxGeometry args={[2, 2, 2]} />
    </mesh>
  )
}
