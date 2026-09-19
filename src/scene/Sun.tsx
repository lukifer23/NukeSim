import { useMemo } from 'react'
import * as THREE from 'three'
import type { AtmosphereLook } from './atmosphere'

const DISTANCE = 70000

/** Radial-gradient glow sprite: opaque core fading to a soft halo. */
function useDiscTexture(): THREE.CanvasTexture {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
      g.addColorStop(0, 'rgba(255,255,255,1)')
      g.addColorStop(0.32, 'rgba(255,255,255,0.98)')
      g.addColorStop(0.46, 'rgba(255,255,255,0.32)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 256, 256)
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])
}

/**
 * The sun by day and a pale moon by night, drawn as a camera-facing additive
 * sprite so the bloom pass can give it a soft glare. Depth-tested against the
 * city, so terrain and towers occlude it correctly, and fog-exempt so the
 * distance haze cannot swallow it.
 */
export function CelestialDisc({ look, night }: { look: AtmosphereLook; night: boolean }) {
  const texture = useDiscTexture()
  const dir = useMemo(
    () => new THREE.Vector3(look.sunPos[0], look.sunPos[1], look.sunPos[2]).normalize(),
    [look],
  )
  const size = night ? 3200 : 7200
  const horizonFade = THREE.MathUtils.smoothstep(dir.y, -0.04, 0.12)
  const intensity = (night ? 0.7 : 2.3 + 1.8 * Math.max(0, dir.y)) * horizonFade
  const color = useMemo(() => new THREE.Color(look.sun).multiplyScalar(intensity), [look.sun, intensity])

  return (
    <sprite position={dir.clone().multiplyScalar(DISTANCE)} scale={[size, size, 1]} renderOrder={1}>
      <spriteMaterial
        map={texture}
        color={color}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        fog={false}
      />
    </sprite>
  )
}
