import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSim, isLiveField } from '../state/store'
import {
  arrivalTimeS,
  damageFromOverpressure,
  fireballMaxRadiusM,
  isSurfaceBurst,
  overpressureAtRangePsi,
} from '../sim'
import { BuildingClass, DamageState } from '../sim/types'
import { getRenderTime } from './runtimeClock'

const KIND_CLASS: Record<string, (typeof BuildingClass)[keyof typeof BuildingClass]> = {
  stadium: BuildingClass.Concrete,
  crane: BuildingClass.Steel,
  bridge: BuildingClass.Steel,
  refinery: BuildingClass.Steel,
  rail: BuildingClass.Steel,
  hospital: BuildingClass.Heavy,
}

function Fielded({
  x,
  y,
  z,
  cls,
  children,
}: {
  x: number
  y: number
  z: number
  cls: (typeof BuildingClass)[keyof typeof BuildingClass]
  children: ReactNode
}) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    const group = ref.current
    if (!group) return
    const s = useSim.getState()
    if (!s.hasRun || !isLiveField(s.phase)) {
      group.scale.set(1, 1, 1)
      group.rotation.set(0, 0, 0)
      group.visible = true
      return
    }
    const hob = s.hobResolved()
    const t = getRenderTime()
    const r = Math.hypot(x - s.impactOffset.x, z - s.impactOffset.z)
    const fb = fireballMaxRadiusM(s.yieldKt, isSurfaceBurst(hob))
    const psi = overpressureAtRangePsi(s.yieldKt, hob, r)
    const damage = damageFromOverpressure(cls, psi, r < fb)
    const k = damage === DamageState.Intact ? 0 : THREE.MathUtils.smoothstep(t - arrivalTimeS(s.yieldKt, hob, r), 0, 0.7)
    if (damage === DamageState.Vaporized) {
      group.scale.setScalar(Math.max(0.02, 1 - k))
      group.visible = k < 0.97
      return
    }
    group.visible = true
    group.scale.set(1, Math.max(0.14, 1 - k * 0.82), 1)
    group.rotation.z = k * (cls === BuildingClass.Steel ? 0.2 : 0.08)
    group.rotation.x = k * 0.05
  })
  return (
    <group ref={ref} position={[x, y, z]}>
      {children}
    </group>
  )
}

export function Landmarks() {
  const city = useSim((s) => s.city)
  return (
    <group>
      {city.landmarks.map((lm, i) => {
        const y = city.heightAt(lm.x, lm.z)
        const cls = KIND_CLASS[lm.kind] ?? BuildingClass.Masonry
        if (lm.kind === 'stadium') {
          return (
            <Fielded key={i} x={lm.x} y={y} z={lm.z} cls={cls}>
              <Stadium s={lm.s} />
            </Fielded>
          )
        }
        if (lm.kind === 'crane') {
          return (
            <Fielded key={i} x={lm.x} y={y} z={lm.z} cls={cls}>
              <Crane s={lm.s} />
            </Fielded>
          )
        }
        if (lm.kind === 'bridge') {
          const span = lm.spanM ?? 520
          const deckY = Math.max(city.heightAt(lm.x, lm.z - span / 2), city.heightAt(lm.x, lm.z + span / 2)) + 18
          return (
            <Fielded key={i} x={lm.x} y={deckY} z={lm.z} cls={cls}>
              <Bridge s={lm.s} span={span} />
            </Fielded>
          )
        }
        if (lm.kind === 'refinery') {
          return (
            <Fielded key={i} x={lm.x} y={y} z={lm.z} cls={cls}>
              <Refinery />
            </Fielded>
          )
        }
        if (lm.kind === 'rail') {
          return (
            <Fielded key={i} x={lm.x} y={y + 1.4} z={lm.z} cls={cls}>
              <RailSpur />
            </Fielded>
          )
        }
        return (
          <Fielded key={i} x={lm.x} y={y} z={lm.z} cls={cls}>
            <Hospital />
          </Fielded>
        )
      })}
    </group>
  )
}

function Stadium({ s }: { s: number }) {
  return (
    <group scale={s}>
      <mesh position={[0, 10, 0]}>
        <cylinderGeometry args={[92, 100, 18, 32, 1, true]} />
        <meshStandardMaterial color="#5a6168" roughness={0.78} side={2} />
      </mesh>
      <mesh position={[0, 18, 0]}>
        <cylinderGeometry args={[78, 88, 6, 32, 1, true]} />
        <meshStandardMaterial color="#6a7178" roughness={0.7} side={2} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 2, 0]}>
        <circleGeometry args={[72, 32]} />
        <meshStandardMaterial color="#3f4a38" roughness={0.95} />
      </mesh>
      {([0, 1, 2, 3] as const).map((k) => (
        <mesh key={k} position={[Math.cos((k * Math.PI) / 2) * 88, 22, Math.sin((k * Math.PI) / 2) * 88]}>
          <boxGeometry args={[10, 8, 10]} />
          <meshStandardMaterial color="#4a5056" />
        </mesh>
      ))}
    </group>
  )
}

function Crane({ s }: { s: number }) {
  const steel = { color: '#c44b2b', metalness: 0.55, roughness: 0.4 }
  return (
    <group scale={s}>
      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[18, 8, 18]} />
        <meshStandardMaterial color="#3a3a36" roughness={0.8} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} position={[0, 16 + i * 16, 0]}>
          <mesh>
            <boxGeometry args={[3.2, 16, 3.2]} />
            <meshStandardMaterial {...steel} />
          </mesh>
          <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[0.5, 16, 6]} />
            <meshStandardMaterial color="#9a3a22" metalness={0.4} roughness={0.5} />
          </mesh>
        </group>
      ))}
      <mesh position={[32, 94, 0]}>
        <boxGeometry args={[78, 2.2, 2.6]} />
        <meshStandardMaterial color="#e4a04a" metalness={0.45} roughness={0.38} />
      </mesh>
      <mesh position={[-16, 92, 0]}>
        <boxGeometry args={[18, 2, 2.4]} />
        <meshStandardMaterial color="#e4a04a" metalness={0.45} roughness={0.38} />
      </mesh>
      <mesh position={[0, 100, 0]}>
        <boxGeometry args={[6, 14, 6]} />
        <meshStandardMaterial color="#c44b2b" metalness={0.4} roughness={0.42} />
      </mesh>
      <mesh position={[58, 78, 0]}>
        <boxGeometry args={[5, 6, 5]} />
        <meshStandardMaterial color="#3a3a36" />
      </mesh>
      <mesh position={[58, 50, 0]}>
        <boxGeometry args={[0.4, 52, 0.4]} />
        <meshStandardMaterial color="#2a2a28" />
      </mesh>
    </group>
  )
}

function Bridge({ s, span }: { s: number; span: number }) {
  return (
    <group scale={s}>
      <mesh>
        <boxGeometry args={[18, 3.2, span]} />
        <meshStandardMaterial color="#5c5852" roughness={0.62} metalness={0.12} />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[2.2, 0.4, span]} />
        <meshStandardMaterial color="#d7b965" roughness={0.5} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 8.4, 3.2, 0]}>
          <boxGeometry args={[0.45, 3.6, span]} />
          <meshStandardMaterial color="#6a6660" />
        </mesh>
      ))}
      {[-span * 0.28, span * 0.28].map((zz) => (
        <group key={zz} position={[0, 0, zz]}>
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 7, 0, 0]}>
              <mesh position={[0, 34, 0]}>
                <boxGeometry args={[3.2, 68, 3.2]} />
                <meshStandardMaterial color="#6a6660" metalness={0.2} roughness={0.55} />
              </mesh>
              <mesh position={[0, 68, 0]} rotation={[0, 0, side * 0.35]}>
                <boxGeometry args={[2.2, 28, 2.2]} />
                <meshStandardMaterial color="#6a6660" />
              </mesh>
              {[-40, -20, 20, 40].map((cableZ) => (
                <mesh key={cableZ} position={[side * 2, 28, cableZ * 0.15]} rotation={[cableZ * 0.012, 0, -side * 0.22]}>
                  <cylinderGeometry args={[0.18, 0.18, 58, 5]} />
                  <meshStandardMaterial color="#c8c2b6" metalness={0.55} roughness={0.35} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      ))}
    </group>
  )
}

function Refinery() {
  return (
    <group>
      {[0, 1, 2].map((k) => (
        <group key={k} position={[k * 34 - 34, 0, 0]}>
          <mesh position={[0, 26, 0]}>
            <cylinderGeometry args={[12, 12, 52, 16]} />
            <meshStandardMaterial color="#6a5444" metalness={0.32} roughness={0.48} />
          </mesh>
          <mesh position={[0, 2, 0]}>
            <cylinderGeometry args={[13.4, 13.4, 4, 16]} />
            <meshStandardMaterial color="#4a4038" roughness={0.8} />
          </mesh>
          <mesh position={[0, 53, 0]}>
            <cylinderGeometry args={[11.2, 10.4, 3, 16]} />
            <meshStandardMaterial color="#4a4038" metalness={0.25} roughness={0.55} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 44, 10]}>
        <boxGeometry args={[78, 1.2, 1.2]} />
        <meshStandardMaterial color="#4a4038" metalness={0.3} />
      </mesh>
      <mesh position={[48, 36, 16]}>
        <cylinderGeometry args={[1.6, 1.8, 72, 8]} />
        <meshStandardMaterial color="#5a4a40" metalness={0.28} roughness={0.5} />
      </mesh>
      <mesh position={[48, 74, 16]}>
        <cylinderGeometry args={[2.4, 1.2, 6, 8]} />
        <meshStandardMaterial color="#3a3230" />
      </mesh>
    </group>
  )
}

function RailSpur() {
  return (
    <group>
      <mesh>
        <boxGeometry args={[8, 0.8, 280]} />
        <meshStandardMaterial color="#3a342c" roughness={0.95} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 2.2, 0.6, 0]}>
          <boxGeometry args={[0.35, 0.35, 280]} />
          <meshStandardMaterial color="#6a6660" metalness={0.55} roughness={0.4} />
        </mesh>
      ))}
    </group>
  )
}

function Hospital() {
  return (
    <group>
      <mesh position={[0, 16, 0]}>
        <boxGeometry args={[56, 32, 36]} />
        <meshStandardMaterial color="#d7d2c8" roughness={0.72} />
      </mesh>
      <mesh position={[18, 28, 0]}>
        <boxGeometry args={[22, 24, 28]} />
        <meshStandardMaterial color="#c8c2b6" roughness={0.74} />
      </mesh>
      <mesh position={[0, 34, 0]}>
        <boxGeometry args={[20, 4, 20]} />
        <meshStandardMaterial color="#b8b2a6" />
      </mesh>
      <mesh position={[0, 38, 0]}>
        <boxGeometry args={[12, 3, 3.2]} />
        <meshStandardMaterial color="#c44b2b" />
      </mesh>
      <mesh position={[0, 38, 0]}>
        <boxGeometry args={[3.2, 3, 12]} />
        <meshStandardMaterial color="#c44b2b" />
      </mesh>
    </group>
  )
}
