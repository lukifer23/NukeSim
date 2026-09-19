import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { useSim, isLiveField } from '../state/store'
import { shockRadiusAtTimeM } from '../sim'
import { getRenderTime } from './runtimeClock'
import { CITY_CAMERA_FRAMES, CAMERA_FOV_DEG, cloudCameraFrame, detonationCameraFrame } from './cameraFrame'
import { cloudHeightAtTimeM } from '../sim/cloud'

const scratch = new THREE.Vector3()
const look = new THREE.Vector3()

export function Cameras() {
  const controls = useRef<OrbitControlsImpl>(null)
  const { camera, size } = useThree()
  const phase = useSim((s) => s.phase)
  const cityId = useSim((s) => s.cityId)
  const previousShake = useRef(new THREE.Vector3())
  const cinema = useRef(true)
  const shockWasInside = useRef(false)
  const shakeAmp = useRef(0)
  const lastMode = useRef(useSim.getState().cameraMode)
  const changingView = useRef(false)

  useFrame(() => {
    const s = useSim.getState()
    const frame = CITY_CAMERA_FRAMES[s.cityId]
    if (s.phase === 'bench') {
      cinema.current = true
      shockWasInside.current = false
      shakeAmp.current = 0
    }
    if (s.phase === 'title' || s.phase === 'city-select') {
      cinema.current = true
      if (controls.current) controls.current.enabled = false
      const spin = s.phase === 'city-select' && !s.reducedMotion ? performance.now() * 0.00004 : 0
      const px = frame.pos[0] * Math.cos(spin) - frame.pos[2] * Math.sin(spin)
      const pz = frame.pos[0] * Math.sin(spin) + frame.pos[2] * Math.cos(spin)
      scratch.set(px, frame.pos[1], pz)
      camera.position.lerp(scratch, 0.055)
      look.set(frame.target[0], frame.target[1], frame.target[2])
      camera.lookAt(look)
      return
    }
    const t = getRenderTime()
    const fov = (camera as THREE.PerspectiveCamera).fov || CAMERA_FOV_DEG
    const aspect = size.width / Math.max(size.height, 1)
    if (lastMode.current !== s.cameraMode) {
      lastMode.current = s.cameraMode
      changingView.current = true
      cinema.current = false
    }

    if (!s.playing && cinema.current && t > 0.05) cinema.current = false
    if (s.phase === 'detonate' && cinema.current && s.reducedMotion) {
      cinema.current = false
      if (controls.current) controls.current.enabled = true
    }
    if (s.phase === 'detonate' && cinema.current && s.cameraMode === 'field' && !s.reducedMotion && t < 40) {
      if (controls.current) controls.current.enabled = false
      const hob = s.hobResolved()
      const shock = shockRadiusAtTimeM(s.yieldKt, hob, t)
      const fire = detonationCameraFrame(s.yieldKt, hob, fov, aspect)
      const cloudH = cloudHeightAtTimeM(s.report.cloud, t)
      const cloud = cloudCameraFrame(cloudH, fov, aspect)
      const uFire = Math.min(1, t / 12)
      const easedFire = uFire * uFire * (3 - 2 * uFire)
      const uCloud = t <= 18 ? 0 : Math.min(1, (t - 18) / 16)
      const easedCloud = uCloud * uCloud * (3 - 2 * uCloud)
      const dist = THREE.MathUtils.lerp(
        THREE.MathUtils.lerp(fire.startDistance, Math.max(fire.endDistance, shock * 1.35), easedFire),
        cloud.endDistance,
        easedCloud,
      )
      const height = THREE.MathUtils.lerp(
        THREE.MathUtils.lerp(fire.cameraHeight, fire.cameraHeight + fire.verticalSpan * 0.12, easedFire),
        cloud.cameraHeight,
        easedCloud,
      )
      const lookY = THREE.MathUtils.lerp(fire.lookY, cloud.lookY, easedCloud)
      scratch.set(s.impactOffset.x + dist * 0.72, height, s.impactOffset.z + dist * 0.78)
      camera.position.lerp(scratch, 0.1)
      look.set(s.impactOffset.x, lookY, s.impactOffset.z)
      camera.lookAt(look)
      if (controls.current) controls.current.target.copy(look)
      if (t >= 39.5) cinema.current = false
      return
    }
    if (cinema.current && (t >= 28 || s.phase !== 'detonate')) cinema.current = false
    if (changingView.current && isLiveField(s.phase)) {
      if (controls.current) controls.current.enabled = false
      if (s.cameraMode === 'cloud') {
        const cloudH = cloudHeightAtTimeM(s.report.cloud, t)
        const cloud = cloudCameraFrame(cloudH, fov, aspect)
        const dist = cloud.endDistance
        scratch.set(s.impactOffset.x + dist * 0.72, Math.max(420, cloud.cameraHeight), s.impactOffset.z + dist * 0.78)
        look.set(s.impactOffset.x, cloud.lookY, s.impactOffset.z)
      } else if (s.cameraMode === 'ground-zero') {
        const r = Math.max(s.report.fireballMaxRadiusM * 2.8, 480)
        scratch.set(s.impactOffset.x + r * 0.72, Math.max(120, r * 0.22), s.impactOffset.z + r * 0.78)
        look.set(s.impactOffset.x, Math.max(30, s.report.fireballMaxRadiusM * 0.18), s.impactOffset.z)
      } else {
        scratch.set(frame.pos[0], frame.pos[1], frame.pos[2])
        look.set(frame.target[0], frame.target[1], frame.target[2])
      }
      if (s.reducedMotion) camera.position.copy(scratch)
      else camera.position.lerp(scratch, 0.14)
      camera.lookAt(look)
      if (controls.current) controls.current.target.copy(look)
      if (s.reducedMotion || camera.position.distanceTo(scratch) < 40) changingView.current = false
      return
    }
    if (s.phase === 'detonate' && !s.reducedMotion) {
      const hob = s.hobResolved()
      const shock = shockRadiusAtTimeM(s.yieldKt, hob, t)
      const camR = Math.hypot(camera.position.x - s.impactOffset.x, camera.position.z - s.impactOffset.z)
      const inside = shock > camR
      if (inside && !shockWasInside.current) shakeAmp.current = 1
      shockWasInside.current = inside
      shakeAmp.current *= 0.93
      camera.position.sub(previousShake.current)
      const amp = shakeAmp.current
      // Shake is a world-space offset, so it must scale with viewing distance
      // to read as camera motion rather than a few invisible metres.
      const gzDist = Math.max(1, Math.hypot(camera.position.x - s.impactOffset.x, camera.position.z - s.impactOffset.z))
      const scale = gzDist / 45
      previousShake.current.set(Math.sin(t * 31) * amp * 2.2 * scale, Math.sin(t * 43 + 0.7) * amp * 1.4 * scale, 0)
      camera.position.add(previousShake.current)
    } else {
      camera.position.sub(previousShake.current)
      previousShake.current.set(0, 0, 0)
      shakeAmp.current = 0
      shockWasInside.current = false
    }
    if (controls.current) controls.current.enabled = true
  })

  return (
    <OrbitControls
      ref={controls}
      enableDamping
      dampingFactor={0.08}
      maxPolarAngle={Math.PI * 0.49}
      minDistance={70}
      maxDistance={phase === 'city-select' ? 18000 : 42000}
      target={CITY_CAMERA_FRAMES[cityId].target}
    />
  )
}
