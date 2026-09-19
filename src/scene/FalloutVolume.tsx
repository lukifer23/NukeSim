import { useMemo } from 'react'
import { GLSL_HASH2 } from './shaders/glsl'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSim } from '../state/store'
import { FALLOUT_MIN_WIND_MPS, FALLOUT_SPREAD_FLOOR_S, FALLOUT_SPREAD_FRACTION } from '../sim'
import { getRenderTime } from './runtimeClock'
export function FalloutVolume() {
  const report = useSim((s) => s.report)
  const overlays = useSim((s) => s.overlays)
  const offset = useSim((s) => s.impactOffset)
  const wind = useSim((s) => s.windSpeedMps)
  const city = useSim((s) => s.city)
  if (!overlays.fallout || report.fallout.length === 0) return null

  return (
    <group position={[offset.x, 0, offset.z]}>
      {report.fallout.map((c, i) => (
        <FalloutPoly
          key={c.id}
          points={c.points}
          color={c.color}
          wind={wind}
          opacity={0.14 - i * 0.018}
          heightAt={city.heightAt}
          ox={offset.x}
          oz={offset.z}
        />
      ))}
    </group>
  )
}

function FalloutPoly({
  points,
  color,
  wind,
  opacity,
  heightAt,
  ox,
  oz,
}: {
  points: Array<{ x: number; z: number }>
  color: string
  wind: number
  opacity: number
  heightAt: (x: number, z: number) => number
  ox: number
  oz: number
}) {
  const mat = useMemo(() => {
    const c = new THREE.Color(color)
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      toneMapped: true,
      dithering: true,
      side: THREE.DoubleSide,
      uniforms: {
        uColor: { value: c },
        uOpacity: { value: opacity },
        uTime: { value: 0 },
        uWind: { value: wind },
      },
      vertexShader: `
        varying vec2 vGz;
        void main() {
          vGz = position.xz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uTime;
        uniform float uWind;
        varying vec2 vGz;
        ${GLSL_HASH2}
        void main() {
          float r = length(vGz);
          float arrival = r / max(uWind, ${FALLOUT_MIN_WIND_MPS});
          float spread = max(${FALLOUT_SPREAD_FLOOR_S}.0, arrival * ${FALLOUT_SPREAD_FRACTION});
          float prog = clamp((uTime - arrival + spread) / spread, 0.0, 1.0);
          if (prog <= 0.001) discard;
          // Reads as settled contamination: patchy, dust-toned, never a solid
          // dark sheet lying over the city.
          float grain = 0.55 + 0.45 * hash(floor(vGz * 0.012));
          float speck = step(0.22, hash(floor(vGz * 0.28)));
          float a = uOpacity * prog * (0.6 + 0.4 * grain) * (0.72 + 0.28 * speck);
          vec3 col = mix(uColor, vec3(0.42, 0.37, 0.33), 0.28 * grain);
          gl_FragColor = vec4(col, a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    })
  }, [color, opacity, wind])

  const geo = useMemo(() => {
    const shape = new THREE.Shape()
    points.forEach((p, i) => {
      if (i === 0) shape.moveTo(p.x, p.z)
      else shape.lineTo(p.x, p.z)
    })
    shape.closePath()
    const g = new THREE.ShapeGeometry(shape)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      pos.setY(i, heightAt(x + ox, z + oz) + 3.2)
    }
    pos.needsUpdate = true
    g.computeVertexNormals()
    return g
  }, [points, heightAt, ox, oz])

  const dirDeg = useSim((s) => s.windDirDeg)
  useFrame(() => {
    const s = useSim.getState()
    mat.uniforms.uTime.value = getRenderTime()
    mat.uniforms.uWind.value = s.windSpeedMps
  })

  const dir = (dirDeg * Math.PI) / 180
  const arrowLen = Math.max(180, wind * 40)

  return (
    <>
      <mesh geometry={geo} material={mat} />
      {opacity > 0.15 && (
        <group position={[Math.sin(dir) * arrowLen * 0.55, 14, Math.cos(dir) * arrowLen * 0.55]} rotation={[0, dir, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[9, 32, 5]} />
            <meshBasicMaterial color="#c4b06a" transparent opacity={0.55} />
          </mesh>
        </group>
      )}
    </>
  )
}
