import { describe, expect, it } from 'vitest'
import { CITIES } from '../../src/data/cities'
import { generateCity } from '../../src/city/generate'
import { District } from '../../src/city/types'
import { lineOfSightClear } from '../../src/sim/los'

describe('generated cities', () => {
  for (const biome of CITIES) {
    it(`${biome.name} produces land buildings and a land GZ`, () => {
      const city = generateCity(biome)
      expect(city.buildings.length).toBeGreaterThan(80)
      expect(city.waterAt(city.gz.x, city.gz.z)).toBeLessThan(0.5)
      const inland = city.buildings.filter((b) => city.waterAt(b.x, b.z) < 0.5)
      expect(inland.length).toBe(city.buildings.length)
      expect(city.buildings.every((b) => !city.isStreet(b.x, b.z))).toBe(true)
    })
  }

  it('Port Meridian has streets, a water landmark, and a taller core', () => {
    const city = generateCity(CITIES[0])
    const streetHits = city.roads.length
    expect(streetHits).toBeGreaterThan(8)
    expect(city.landmarks.some((l) => l.kind === 'bridge' || l.kind === 'crane')).toBe(true)
    const core = city.buildings.filter((b) => b.district === District.Core)
    const sub = city.buildings.filter((b) => b.district === District.Residential)
    if (core.length && sub.length) {
      const mc = core.reduce((s, b) => s + b.h, 0) / core.length
      const ms = sub.reduce((s, b) => s + b.h, 0) / sub.length
      expect(mc).toBeGreaterThan(ms)
    }
  })

  it('Port Meridian ground zero sits on land away from the map origin', () => {
    const city = generateCity(CITIES[0])
    expect(city.waterAt(city.gz.x, city.gz.z)).toBeLessThan(0.5)
    expect(Math.hypot(city.gz.x, city.gz.z)).toBeGreaterThan(80)
  })

  it('assigns a variant to every building', () => {
    for (const biome of CITIES) {
      const city = generateCity(biome)
      expect(city.buildings.every((b) => b.variant)).toBe(true)
    }
  })
})

describe('ridge line of sight', () => {
  it('a wall between two points occludes; a flat plane does not', () => {
    const flat = () => 0
    const ridge = (x: number) => (Math.abs(x - 500) < 40 ? 400 : 0)
    expect(lineOfSightClear(flat, 0, 50, 0, 1000, 50, 0)).toBe(true)
    expect(lineOfSightClear((x) => ridge(x), 0, 50, 0, 1000, 50, 0)).toBe(false)
    expect(lineOfSightClear((x) => ridge(x), 0, 800, 0, 1000, 800, 0)).toBe(true)
  })
})
