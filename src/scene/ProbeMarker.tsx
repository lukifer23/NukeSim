import { useSim } from '../state/store'

export function ProbeMarker() {
  const probe = useSim((s) => s.probe)
  const city = useSim((s) => s.city)
  const offset = useSim((s) => s.impactOffset)
  if (!probe) return null
  const wx = probe.x + offset.x
  const wz = probe.z + offset.z
  const y = city.heightAt(wx, wz)
  const range = Math.max(40, probe.groundRangeM)
  const ang = Math.atan2(offset.z - wz, offset.x - wx)
  return (
    <group position={[wx, y, wz]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.2, 0]}>
        <ringGeometry args={[10, 16, 32]} />
        <meshBasicMaterial color="#e4a04a" transparent opacity={0.85} depthWrite={false} />
      </mesh>
      <mesh position={[0, 22, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 44, 8]} />
        <meshBasicMaterial color="#e4a04a" transparent opacity={0.9} />
      </mesh>
      <mesh position={[Math.cos(ang) * Math.min(80, range * 0.08), 2.4, Math.sin(ang) * Math.min(80, range * 0.08)]} rotation={[0, -ang, 0]}>
        <boxGeometry args={[Math.min(120, range * 0.12), 0.6, 1.2]} />
        <meshBasicMaterial color="#f2eee6" transparent opacity={0.55} />
      </mesh>
    </group>
  )
}
