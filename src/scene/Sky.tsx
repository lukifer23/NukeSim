import { Sky, Stars } from '@react-three/drei'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Sky as SkyImpl } from 'three-stdlib'
import { useSim } from '../state/store'
import { atmosphereLook, lightingAmount } from './atmosphere'
import { CAMERA_FAR } from './cameraFrame'
import { CelestialDisc } from './Sun'

export function Atmosphere() {
  const timeOfDay = useSim((s) => s.timeOfDay)
  const biome = useSim((s) => s.city.biome)
  const reduced = useSim((s) => s.reducedMotion)
  const quality = useSim((s) => s.renderQuality)
  const { gl, camera, scene } = useThree()
  const look = useMemo(() => atmosphereLook(timeOfDay, biome), [timeOfDay, biome])
  const extent = biome.extentM
  const lookRef = useRef(look)
  lookRef.current = look
  const sun = useRef<THREE.DirectionalLight>(null)

  // Shadow resolution follows the quality tier. Changing the map size only
  // reallocates the shadow target, so it never triggers a shader recompile.
  useEffect(() => {
    const light = sun.current
    if (!light) return
    const size = quality === 'high' ? 2048 : quality === 'balanced' ? 1024 : 512
    if (light.shadow.mapSize.x !== size) {
      light.shadow.mapSize.set(size, size)
      light.shadow.map?.dispose()
      light.shadow.map = null
    }
  }, [quality])

  // Sky-derived PMREM environment, rebuilt only when the time-of-day bucket or
  // biome changes, so steel and glass reflect the current sky instead of a
  // fixed studio probe.
  useEffect(() => {
    const l = lookRef.current
    let rt: THREE.WebGLRenderTarget | null = null
    let sky: SkyImpl | null = null
    let pmrem: THREE.PMREMGenerator | null = null
    try {
      pmrem = new THREE.PMREMGenerator(gl)
      const envScene = new THREE.Scene()
      sky = new SkyImpl()
      // three-stdlib's Sky uses one module-level material for every instance.
      // Clone it so this throwaway probe owns its uniforms and disposal and
      // cannot clobber the visible sky.
      sky.material = sky.material.clone()
      sky.scale.setScalar(10000)
      const u = sky.material.uniforms
      u.turbidity.value = l.turbidity
      u.rayleigh.value = l.rayleigh
      u.mieCoefficient.value = l.mieCoefficient
      u.mieDirectionalG.value = 0.82
      u.sunPosition.value.set(l.sunPos[0], l.sunPos[1], l.sunPos[2])
      envScene.add(sky)
      rt = pmrem.fromScene(envScene, 0, 1, 25000)
      scene.environment = rt.texture
    } catch {
      // A GPU without float render targets still renders; it just loses
      // sky-derived reflections. Never let the probe take down the frame.
      scene.environment = null
    } finally {
      pmrem?.dispose()
      sky?.material.dispose()
      sky?.geometry.dispose()
    }
    return () => {
      scene.environment = null
      rt?.dispose()
    }
  }, [gl, scene, look.envKey])

  useEffect(() => {
    scene.environmentIntensity = look.envInt * 0.45
  }, [scene, look.envInt])
  const shadowExtent = extent * 0.42
  const amount = lightingAmount(timeOfDay)
  const night = amount < 0.22
  const sky = useRef<SkyImpl>(null)

  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.shadowMap.enabled = true
    gl.shadowMap.type = THREE.PCFShadowMap
    camera.far = CAMERA_FAR
    camera.updateProjectionMatrix()
    if (sky.current) {
      sky.current.material.fog = false
      // The Preetham sky is not tone-mapped, so it clips to white and would
      // dominate any luminance-threshold glow. Scale it into the scene range.
      const mat = sky.current.material
      mat.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
          'gl_FragColor = vec4( retColor, 1.0 );',
          'gl_FragColor = vec4( retColor * 0.55, 1.0 );',
        )
      }
      mat.needsUpdate = true
    }
  }, [gl, camera, look.exposure])

  return (
    <>
      {!night && (
        <Sky
          ref={sky}
          distance={200000}
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
      <CelestialDisc look={look} night={night} />
      <fog attach="fog" args={[look.fog, look.fogNear, look.fogFar]} />
      <hemisphereLight args={[look.hemiSky, look.hemiGround, look.hemiInt]} />
      <ambientLight intensity={look.ambient} />
      <directionalLight
        ref={sun}
        position={look.sunPos}
        intensity={look.sunInt}
        color={look.sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00012}
        shadow-normalBias={0.7}
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
