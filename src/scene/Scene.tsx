import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import { EffectComposer, Bloom, Vignette, SMAA, GodRays, ChromaticAberration, HueSaturation } from '@react-three/postprocessing'
import * as THREE from 'three'
import { BlendFunction } from 'postprocessing'
import type { GodRaysEffect, ChromaticAberrationEffect } from 'postprocessing'
import { World } from './World'
import { Clock } from './Clock'
import { useSim } from '../state/store'
import { fireballPulse } from './fx/pulse'
import { getRenderTime } from './runtimeClock'
import { fireballRadiusAtTimeM } from '../sim'

export function Scene() {
  const webglAvailable = useMemo(() => canRenderWebgl(), [])
  if (!webglAvailable) return <WebglFallback />
  return (
    <Canvas
      fallback={<WebglFallback />}
      aria-label="Interactive three dimensional educational city view"
      shadows="soft"
      camera={{ position: [1680, 420, -1980], fov: 46, near: 1.2, far: 60000 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <Suspense fallback={null}>
        <World />
        <Clock />
        <Grade />
      </Suspense>
    </Canvas>
  )
}

function canRenderWebgl(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function WebglFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-ink p-6 text-body">
      <div className="max-w-md border border-white/10 bg-card p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-signal">3D view unavailable</p>
        <h1 className="mt-2 text-xl text-paper">The learning field still works without WebGL.</h1>
        <p className="mt-3 text-sm leading-relaxed text-mute">
          Use the scenario controls, model card, comparison, and debrief. This browser cannot create the graphics context needed for the walkable city.
        </p>
      </div>
    </div>
  )
}

function Grade() {
  const reduced = useSim((s) => s.reducedMotion)
  const t = useSim((s) => s.simTime)
  const phase = useSim((s) => s.phase)
  const yieldKt = useSim((s) => s.yieldKt)
  const rays = useRef<GodRaysEffect>(null)
  const chroma = useRef<ChromaticAberrationEffect>(null)
  const sun = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      color: '#fff6e8',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    })
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), mat)
    mesh.frustumCulled = false
    mesh.renderOrder = 2
    return mesh
  }, [])

  useFrame(() => {
    const s = useSim.getState()
    const time = getRenderTime()
    const hob = s.hobResolved()
    const surface = hob <= 1
    const r = Math.max(fireballRadiusAtTimeM(s.yieldKt, time, surface), 1)
    const { pulse, cool } = fireballPulse(time, s.yieldKt)
    const flatten = surface ? 0.42 : 1
    const y = surface ? r * flatten * 0.45 : Math.max(hob, r * 0.2)
    const hot = s.phase === 'detonate' && time < 1.4
    const shaft = !s.reducedMotion && s.phase === 'detonate' && time < 8 && cool < 0.75
    sun.position.set(s.impactOffset.x, y, s.impactOffset.z)
    sun.scale.setScalar(Math.max(12, r * 0.34))
    ;(sun.material as THREE.MeshBasicMaterial).opacity = shaft ? 0.72 * (1 - cool) : 0
    if (rays.current) {
      rays.current.godRaysMaterial.weight = shaft ? 0.18 : 0
      rays.current.godRaysMaterial.exposure = shaft ? 0.22 : 0
    }
    if (chroma.current) {
      const c = hot && time < 0.45 ? 0.0012 + pulse * 0.0008 : 0
      chroma.current.offset.set(c, c * 0.35)
    }
  })

  if (reduced) return <primitive object={sun} />
  const { pulse } = fireballPulse(t, yieldKt)
  const hot = phase === 'detonate' && t < 1.4
  const after = phase === 'detonate' || phase === 'explore' || phase === 'debrief'
  return (
    <>
      <primitive object={sun} />
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <SMAA />
        <Bloom intensity={hot ? 0.55 + pulse * 0.18 : after && t > 8 ? 0.14 : 0.22} luminanceThreshold={hot ? 0.72 : 0.84} mipmapBlur />
        {phase === 'detonate' && t < 8.5 && (
          <GodRays ref={rays} sun={sun} samples={32} density={0.9} decay={0.93} weight={0} exposure={0} clampMax={1} blur />
        )}
        {phase === 'detonate' && t < 0.55 && <ChromaticAberration ref={chroma} offset={[0, 0]} />}
        <HueSaturation saturation={t > 90 ? -0.12 : 0} blendFunction={BlendFunction.NORMAL} />
        <Vignette eskil={false} offset={0.12} darkness={after && t > 8 ? 0.64 : 0.44} />
      </EffectComposer>
    </>
  )
}
