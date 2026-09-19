import * as THREE from 'three'
import { BuildingClass } from '../sim/types'

type Atlas = {
  facade: THREE.Texture
  facadeNormal: THREE.Texture | null
  facadeArm: THREE.Texture | null
  roof: THREE.Texture
  roofNormal: THREE.Texture | null
  roofArm: THREE.Texture | null
}

const cache = new Map<string, Atlas>()
const pbrCache = new Map<string, ReturnType<typeof makePbrSet>>()

function paintFacade(cls: string, biome: string): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 512
  const g = c.getContext('2d')!
  const wall =
    cls === BuildingClass.Wood ? (biome === 'dune' ? '#8a6e4e' : '#7a5a3c') :
    cls === BuildingClass.Masonry ? (biome === 'dune' ? '#8a6a52' : '#6e4336') :
    cls === BuildingClass.Steel ? '#4e5962' :
    cls === BuildingClass.Heavy ? '#32363a' :
    '#5e5c56'
  g.fillStyle = wall
  g.fillRect(0, 0, 256, 512)
  if (cls === BuildingClass.Wood) {
    for (let y = 0; y < 512; y += 10) {
      g.fillStyle = y % 20 === 0 ? '#6a4c32' : '#855e3e'
      g.fillRect(0, y, 256, 2)
    }
  } else if (cls === BuildingClass.Masonry) {
    for (let y = 0; y < 512; y += 12) {
      const ox = (y / 12) % 2 === 0 ? 0 : 10
      for (let x = -10; x < 256; x += 20) {
        g.fillStyle = ((x + y) * 13) % 17 > 8 ? '#7a4c3c' : '#5c382c'
        g.fillRect(x + ox, y, 18, 10)
      }
    }
  } else if (cls === BuildingClass.Steel) {
    for (let y = 0; y < 512; y += 22) {
      g.fillStyle = '#3a4248'
      g.fillRect(0, y, 256, 1)
    }
  } else {
    for (let y = 0; y < 512; y += 26) {
      g.fillStyle = '#4a4844'
      g.fillRect(0, y, 256, 3)
    }
  }
  return c
}

function tex(c: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c)
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 8
  t.colorSpace = THREE.SRGBColorSpace
  t.needsUpdate = true
  return t
}

function loadTexture(file: string, srgb: boolean, repeatX: number, repeatY: number): THREE.Texture {
  const texture = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}assets/materials/${file}`)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeatX, repeatY)
  texture.anisotropy = 8
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function makePbrSet(prefix: 'concrete' | 'brick-wall' | 'concrete-floor', x: number, y: number) {
  return {
    diffuse: loadTexture(`${prefix}-diffuse.jpg`, true, x, y),
    normal: loadTexture(`${prefix}-normal.jpg`, false, x, y),
    arm: loadTexture(`${prefix}-arm.jpg`, false, x, y),
  }
}

function pbrSet(prefix: 'concrete' | 'brick-wall' | 'concrete-floor', x: number, y: number) {
  const key = `${prefix}:${x}:${y}`
  const hit = pbrCache.get(key)
  if (hit) return hit
  const made = makePbrSet(prefix, x, y)
  pbrCache.set(key, made)
  return made
}

export function buildingAtlas(cls: string, biomeId: string): Atlas | null {
  if (typeof document === 'undefined') return null
  const key = `${cls}:${biomeId}`
  const hit = cache.get(key)
  if (hit) return hit
  const facadePbr = cls === BuildingClass.Masonry
    ? pbrSet('brick-wall', 2, 4)
    : cls === BuildingClass.Concrete || cls === BuildingClass.Heavy
      ? pbrSet('concrete', 2, 4)
      : null
  const roofPbr = pbrSet('concrete-floor', 2, 2)
  const made: Atlas = {
    facade: facadePbr?.diffuse ?? tex(paintFacade(cls, biomeId)),
    facadeNormal: facadePbr?.normal ?? null,
    facadeArm: facadePbr?.arm ?? null,
    roof: roofPbr.diffuse,
    roofNormal: roofPbr.normal,
    roofArm: roofPbr.arm,
  }
  cache.set(key, made)
  return made
}
