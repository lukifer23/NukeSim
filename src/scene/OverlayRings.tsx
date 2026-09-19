import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useSim } from '../state/store'
import type { EffectKind } from '../sim/types'
import { makeDrapedRing } from './drape'

function Ring({
  radius,
  color,
  width,
  opacity,
  dashed,
}: {
  radius: number
  color: string
  width: number
  opacity: number
  dashed?: boolean
}) {
  const city = useSim((s) => s.city)
  const offset = useSim((s) => s.impactOffset)
  const geo = useMemo(
    () => makeDrapedRing(radius, width, 96, city.heightAt, offset.x, offset.z, 2.2),
    [radius, width, city, offset.x, offset.z],
  )
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: true,
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uOpacity: { value: opacity },
          uDashed: { value: dashed ? 1 : 0 },
          uRepeat: { value: Math.max(10, Math.round(radius / 42)) },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main(){
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uOpacity;
          uniform float uDashed;
          uniform float uRepeat;
          varying vec2 vUv;
          void main(){
            // Real dashes around the circumference, soft across the ribbon.
            float dash = 1.0;
            if (uDashed > 0.5) dash = step(fract(vUv.x * uRepeat), 0.62);
            float edge = smoothstep(0.0, 0.32, vUv.y) * smoothstep(1.0, 0.68, vUv.y);
            float a = uOpacity * dash * edge;
            if (a < 0.004) discard;
            gl_FragColor = vec4(uColor, a);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      }),
    [color, opacity, dashed, radius],
  )
  if (radius < 8) return null
  return <mesh geometry={geo} material={mat} position={[offset.x, 0, offset.z]} />
}

function RingLabel({ radius, color, text, loft = 28 }: { radius: number; color: string; text: string; loft?: number }) {
  const offset = useSim((s) => s.impactOffset)
  const city = useSim((s) => s.city)
  const t = useSim((s) => s.simTime)
  const phase = useSim((s) => s.phase)
  if (radius < 40) return null
  if (phase === 'detonate' && t < 2) return null
  const x = offset.x + radius * 0.72
  const z = offset.z + radius * 0.72
  const y = city.heightAt(x, z) + loft
  return (
    <Html position={[x, y, z]} center distanceFactor={2200} style={{ pointerEvents: 'none' }}>
      <div
        style={{
          color,
          background: 'rgba(12,13,15,.55)',
          border: '1px solid rgba(255,255,255,.12)',
          padding: '2px 6px',
          font: '9px IBM Plex Mono, monospace',
          letterSpacing: '.12em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>
    </Html>
  )
}

function blastWeight(psi?: number): { show: boolean; widthMul: number; opacity: number } {
  if (psi === 5) return { show: true, widthMul: 1.8, opacity: 0.62 }
  if (psi === 1) return { show: true, widthMul: 1, opacity: 0.32 }
  if (psi === 20) return { show: true, widthMul: 0.7, opacity: 0.22 }
  return { show: false, widthMul: 1, opacity: 0.2 }
}

export function OverlayRings() {
  const report = useSim((s) => s.report)
  const overlays = useSim((s) => s.overlays)
  const ghost = useSim((s) => s.ghost)
  const showGhost = useSim((s) => s.showGhost)
  const simTime = useSim((s) => s.simTime)

  const kindOn = (k: EffectKind) => {
    if (k === 'blast') return overlays.blast
    if (k === 'thermal') return overlays.thermal
    if (k === 'radiation') return overlays.radiation
    if (k === 'fallout') return overlays.fallout
    if (k === 'fireball' || k === 'crater') return overlays.fireball
    return true
  }

  const five = report.rings.find((r) => r.psi === 5)
  const fireball = report.rings.find((r) => r.id === 'fireball')

  return (
    <group>
      {report.rings.filter((r) => kindOn(r.kind)).map((r) => {
        if (r.kind === 'blast') {
          const w = blastWeight(r.psi)
          if (!w.show) return null
          return (
            <Ring
              key={r.id}
              radius={r.radiusM}
              color={r.color}
              width={Math.max(18, r.radiusM * 0.01 * w.widthMul)}
              opacity={w.opacity}
            />
          )
        }
        return (
          <Ring
            key={r.id}
            radius={r.radiusM}
            color={r.color}
            width={Math.max(14, r.radiusM * 0.008)}
            opacity={r.kind === 'fireball' ? 0.5 : 0.28}
            dashed={r.kind !== 'fireball'}
          />
        )
      })}
      {overlays.blast && five && <RingLabel radius={five.radiusM} color={five.color} text="5 psi" />}
      {overlays.fireball && fireball && simTime > 24 && (
        <RingLabel radius={fireball.radiusM} color="#fff4d6" text="Fireball" />
      )}
      {showGhost && ghost?.rings
        .filter((r) => r.kind === 'blast' && r.psi === 5)
        .map((r) => (
          <group key={`g-${r.id}`}>
            <Ring radius={r.radiusM} color="#3dbebf" width={Math.max(16, r.radiusM * 0.01)} opacity={0.28} dashed />
            <RingLabel radius={r.radiusM} color="#3dbebf" text="Last run" />
          </group>
        ))}
    </group>
  )
}
