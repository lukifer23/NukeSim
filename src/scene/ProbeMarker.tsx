import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSim } from '../state/store'

export function ProbeMarker() {
  const probe = useSim((s) => s.probe)
  const city = useSim((s) => s.city)
  const offset = useSim((s) => s.impactOffset)
  const pulse = useRef<THREE.Mesh>(null)
  const tip = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const s = useSim.getState()
    const p = pulse.current
    if (p) {
      const k = s.reducedMotion ? 1 : 1 + 0.12 * Math.sin(performance.now() * 0.004)
      p.scale.setScalar(k)
    }
    const mat = tip.current?.material as THREE.MeshBasicMaterial | undefined
    if (mat) mat.opacity = 0.55 + 0.35 * Math.sin(performance.now() * 0.005)
  })

  if (!probe) return null
  const wx = probe.x + offset.x
  const wz = probe.z + offset.z
  const y = city.heightAt(wx, wz)
  const range = Math.max(40, probe.groundRangeM)
  const ang = Math.atan2(offset.z - wz, offset.x - wx)

  return (
    <group position={[wx, y, wz]}>
      {/* Ground halo, pulsing so the probe is easy to re-find. */}
      <mesh ref={pulse} rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.2, 0]}>
        <ringGeometry args={[9, 15, 40]} />
        <meshBasicMaterial color="#e4a04a" transparent opacity={0.85} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.9, 0]}>
        <circleGeometry args={[7.5, 32]} />
        <meshBasicMaterial color="#e4a04a" transparent opacity={0.22} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* Thin beacon mast with a glowing tip. */}
      <mesh position={[0, 26, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 52, 6]} />
        <meshBasicMaterial color="#f2c078" transparent opacity={0.85} />
      </mesh>
      <mesh ref={tip} position={[0, 54, 0]}>
        <sphereGeometry args={[3.4, 16, 12]} />
        <meshBasicMaterial color="#ffd89a" transparent opacity={0.8} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* Range/direction tick toward ground zero. */}
      <mesh
        position={[Math.cos(ang) * Math.min(80, range * 0.08), 2.4, Math.sin(ang) * Math.min(80, range * 0.08)]}
        rotation={[0, -ang, 0]}
      >
        <boxGeometry args={[Math.min(120, range * 0.12), 0.6, 1.2]} />
        <meshBasicMaterial color="#f2eee6" transparent opacity={0.55} />
      </mesh>
    </group>
  )
}
