import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSim } from '../state/store'
import { fireballMaxRadiusM, shockRadiusAtTimeM } from '../sim'
import { vegetationPoints } from './vegPoints'
import { getRenderTime } from './runtimeClock'

export function Vegetation() {
  const city = useSim((s) => s.city)
  const pts = useMemo(() => vegetationPoints(city), [city])
  const trees = pts.filter((p) => p.kind === 'tree')
  const yard = pts.filter((p) => p.kind === 'yard')
  const scrub = pts.filter((p) => p.kind === 'scrub')
  const canopy = city.biome.id === 'saddle' ? '#1e3a22' : city.biome.id === 'foundry' ? '#3a4034' : '#2e4630'
  return (
    <>
      <VegLayer points={trees} color={canopy} height={city.biome.id === 'saddle' ? 1.35 : 1.1} shape="cone" />
      <VegLayer points={yard} color={canopy} height={0.85} shape="round" />
      <VegLayer points={scrub} color={city.biome.id === 'dune' ? '#8a7348' : '#5a5340'} height={0.32} shape="round" />
    </>
  )
}

function VegLayer({
  points,
  color,
  height,
  shape,
}: {
  points: ReturnType<typeof vegetationPoints>
  color: string
  height: number
  shape: 'cone' | 'round'
}) {
  const canopy = useRef<THREE.InstancedMesh>(null)
  const trunk = useRef<THREE.InstancedMesh>(null)
  const tmp = useMemo(() => new THREE.Object3D(), [])

  const write = useCallback((live: boolean, t: number) => {
    const s = useSim.getState()
    const hob = s.hobResolved()
    const shock = live ? shockRadiusAtTimeM(s.yieldKt, hob, t) : 0
    const fb = fireballMaxRadiusM(s.yieldKt, hob <= 1)
    let n = 0
    for (const p of points) {
      const r = Math.hypot(p.x - s.impactOffset.x, p.z - s.impactOffset.z)
      const flattened = live && (r < fb || r < shock * 0.92)
      const yScale = flattened ? 0.14 : 1
      const xz = flattened ? 1.35 : 1
      tmp.position.set(p.x, p.y + p.scale * height * 0.55 * yScale, p.z)
      tmp.scale.set(p.scale * 0.45 * xz, p.scale * height * yScale, p.scale * 0.45 * xz)
      tmp.updateMatrix()
      canopy.current?.setMatrixAt(n, tmp.matrix)
      if (trunk.current) {
        tmp.position.set(p.x, p.y + p.scale * 0.28 * yScale, p.z)
        tmp.scale.set(p.scale * 0.08, p.scale * 0.55 * yScale, p.scale * 0.08)
        tmp.updateMatrix()
        trunk.current.setMatrixAt(n, tmp.matrix)
      }
      n++
    }
    if (canopy.current) {
      canopy.current.count = n
      canopy.current.instanceMatrix.needsUpdate = true
    }
    if (trunk.current) {
      trunk.current.count = n
      trunk.current.instanceMatrix.needsUpdate = true
    }
  }, [height, points, tmp])

  useLayoutEffect(() => {
    write(false, 0)
  }, [write])

  const frozen = useRef(false)
  const fieldSig = useSim((s) => s.runRevision)
  useLayoutEffect(() => {
    frozen.current = false
  }, [fieldSig, points])
  useFrame(() => {
    const s = useSim.getState()
    if (s.phase !== 'detonate' && s.phase !== 'explore' && s.phase !== 'debrief') {
      frozen.current = false
      return
    }
    if (frozen.current) return
    const t = getRenderTime()
    write(true, t)
    const hob = s.hobResolved()
    const shock = shockRadiusAtTimeM(s.yieldKt, hob, t)
    if (shock > s.city.biome.extentM) frozen.current = true
  })

  if (points.length === 0) return null
  return (
    <>
      <instancedMesh ref={canopy} args={[undefined, undefined, points.length]} castShadow>
        {shape === 'cone' ? <coneGeometry args={[1, 1, 7]} /> : <sphereGeometry args={[1, 7, 5]} />}
        <meshStandardMaterial color={color} roughness={0.92} />
      </instancedMesh>
      <instancedMesh ref={trunk} args={[undefined, undefined, points.length]} castShadow>
        <cylinderGeometry args={[1, 1.15, 1, 5]} />
        <meshStandardMaterial color="#3a2c22" roughness={0.95} />
      </instancedMesh>
    </>
  )
}
