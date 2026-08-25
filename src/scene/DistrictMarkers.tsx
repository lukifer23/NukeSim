import { Html } from '@react-three/drei'
import { useMemo } from 'react'
import { useSim } from '../state/store'
import { District } from '../city/types'

export function DistrictMarkers() {
  const city = useSim((s) => s.city)
  const phase = useSim((s) => s.phase)
  const markers = useMemo(() => {
    const out: Array<{ label: string; x: number; z: number }> = [
      { label: 'Civic core', x: city.downtown.x, z: city.downtown.z },
    ]
    const sample = (district: string, label: string) => {
      const hits = city.buildings.filter((b) => b.district === district)
      if (!hits.length) return
      const x = hits.reduce((s, b) => s + b.x, 0) / hits.length
      const z = hits.reduce((s, b) => s + b.z, 0) / hits.length
      if (city.waterAt(x, z) > 0.5) return
      out.push({ label, x, z })
    }
    sample(District.Waterfront, 'Waterfront')
    sample(District.Residential, 'Residential belt')
    sample(District.Industrial, 'Works')
    return out
  }, [city])

  if (phase === 'detonate') return null
  return (
    <group>
      {markers.map((marker) => (
        <Html key={marker.label} position={[marker.x, city.heightAt(marker.x, marker.z) + 24, marker.z]} center distanceFactor={2000} style={{ pointerEvents: 'none' }}>
          <div style={{ color: '#d8cfbb', background: 'rgba(12,13,15,.5)', border: '1px solid rgba(255,255,255,.12)', padding: '3px 6px', font: '9px IBM Plex Mono, monospace', letterSpacing: '.12em', textTransform: 'uppercase', whiteSpace: 'nowrap', opacity: phase === 'explore' ? 0.72 : 0.9 }}>
            {marker.label}
          </div>
        </Html>
      ))}
    </group>
  )
}
