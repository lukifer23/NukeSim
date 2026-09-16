import { Sky, Stars } from '@react-three/drei'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Sky as SkyImpl } from 'three-stdlib'
import { useSim } from '../state/store'
import { atmosphereLook, lightingAmount } from './atmosphere'

export function Atmosphere() {
  const timeOfDay = useSim((s) => s.timeOfDay)
  const biome = useSim((s) => s.city.biome)
  const reduced = useSim((s) => s.reducedMotion)
  const { gl, camera } = useThree()
  const look = useMemo(() => atmosphereLook(timeOfDay, biome), [timeOfDay, biome])
  const extent = biome.extentM
  const shadowExtent = extent * 0.42
  const amount = lightingAmount(timeOfDay)
  const night = amount < 0.22
  const sky = useRef<SkyImpl>(null)

  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.shadowMap.enabled = true
    gl.shadowMap.type = THREE.PCFShadowMap
    camera.far = 60000
    camera.updateProjectionMatrix()
    if (sky.current) sky.current.material.fog = false
  }, [gl, camera, look.exposure])

  return (
    <>
      {!night && (
        <Sky
          ref={sky}
          distance={48000}
          sunPosition={look.sunPos}
          turbidity={look.turbidity}
          rayleigh={look.rayleigh}
          mieCoefficient={look.mieCoefficient}
          mieDirectionalG={0.82}
          material-fog={false}
        />
      )}
      {night && (
        <>
          <color attach="background" args={[look.sky]} />
          <Stars radius={22000} depth={1800} count={reduced ? 800 : 2800} factor={6} saturation={0.08} fade speed={0} />
        </>
      )}
      <fog attach="fog" args={[look.fog, look.fogNear, look.fogFar]} />
      <hemisphereLight args={[look.hemiSky, look.hemiGround, look.hemiInt]} />
      <ambientLight intensity={look.ambient} />
      <directionalLight
        position={look.sunPos}
        intensity={look.sunInt}
        color={look.sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00018}
        shadow-normalBias={2.4}
        shadow-camera-left={-shadowExtent}
        shadow-camera-right={shadowExtent}
        shadow-camera-top={shadowExtent}
        shadow-camera-bottom={-shadowExtent}
        shadow-camera-near={200}
        shadow-camera-far={extent * 1.8}
      />
    </>
  )
}
