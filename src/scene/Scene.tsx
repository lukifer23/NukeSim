import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo } from 'react'
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { World } from './World'
import { Clock } from './Clock'
import { useSim } from '../state/store'
import { getRenderTime } from './runtimeClock'
import { atmosphereLook } from './atmosphere'
import { thermalPulseDurationS } from '../sim/fireball'

export function Scene() {
  const webglAvailable = useMemo(() => canRenderWebgl(), [])
  if (!webglAvailable) return <WebglFallback />
  return (
    <Canvas
      fallback={<WebglFallback />}
      aria-label="Interactive three dimensional educational city view"
      shadows="percentage"
      camera={{ position: [1680, 420, -1980], fov: 46, near: 1.2, far: 60000 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <Suspense fallback={null}>
        <QualityController />
        <World />
        <Clock />
        <ExposureController />
      </Suspense>
    </Canvas>
  )
}

function QualityController() {
  const quality = useSim((s) => s.renderQuality)
  const setQuality = useSim((s) => s.setRenderQuality)
  const locked = useSim((s) => s.qualityLocked)
  const { size } = useThree()
  useEffect(() => {
    if (!locked) setQuality(size.width < 1000 || size.height > size.width ? 'balanced' : 'high')
  }, [locked, setQuality, size.height, size.width])
  return (
    <>
      <AdaptiveDpr pixelated={false} />
      <PerformanceMonitor
        flipflops={2}
        onIncline={() => !locked && setQuality(size.width < 1000 ? 'balanced' : 'high')}
        onDecline={() => !locked && setQuality(quality === 'high' ? 'balanced' : 'safe')}
      />
    </>
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

function ExposureController() {
  const { gl } = useThree()
  useFrame(() => {
    const s = useSim.getState()
    const time = getRenderTime()
    const rest = atmosphereLook(s.timeOfDay, s.city.biome).exposure
    const flash = s.phase === 'detonate' ? Math.exp(-time / Math.max(0.18, thermalPulseDurationS(s.yieldKt) * 0.12)) : 0
    gl.toneMappingExposure = THREE.MathUtils.lerp(gl.toneMappingExposure, rest + Math.min(0.22, flash * 0.22), 0.12)
  })
  return null
}
