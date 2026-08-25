import * as THREE from 'three'
import { BuildingClass } from '../sim/types'

type Atlas = { facade: THREE.CanvasTexture; roof: THREE.CanvasTexture }

const cache = new Map<string, Atlas>()

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

function paintRoof(cls: string): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const g = c.getContext('2d')!
  if (cls === BuildingClass.Wood) {
    g.fillStyle = '#4a3024'
    g.fillRect(0, 0, 256, 256)
    for (let y = 0; y < 256; y += 7) {
      g.fillStyle = y % 14 === 0 ? '#3a241c' : '#5a3a2a'
      g.fillRect(0, y, 256, 3)
    }
  } else if (cls === BuildingClass.Steel) {
    g.fillStyle = '#3a4044'
    g.fillRect(0, 0, 256, 256)
    for (let x = 0; x < 256; x += 18) {
      g.fillStyle = '#2e3438'
      g.fillRect(x, 0, 1, 256)
    }
  } else {
    g.fillStyle = '#3a3834'
    g.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 900; i++) {
      const x = (i * 73) % 256
      const y = (i * 41) % 256
      g.fillStyle = i % 3 === 0 ? '#2e2c28' : '#44423c'
      g.fillRect(x, y, 3, 3)
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

export function buildingAtlas(cls: string, biomeId: string): Atlas | null {
  if (typeof document === 'undefined') return null
  const key = `${cls}:${biomeId}`
  const hit = cache.get(key)
  if (hit) return hit
  const made = { facade: tex(paintFacade(cls, biomeId)), roof: tex(paintRoof(cls)) }
  cache.set(key, made)
  return made
}


