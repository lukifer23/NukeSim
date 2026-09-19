import type { CityBiome } from '../data/cities'
import { BuildingClass } from '../sim/types'
import { lineOfSightClear } from '../sim/los'
import { District, type Building, type GeneratedCity, type Landmark, type Road } from './types'
import { fbm, rng } from './noise'

type Street = { pos: number; w: number }

function pickClass(u: number, mix: CityBiome['construction']): Building['class'] {
  let acc = 0
  const entries: Array<[Building['class'], number]> = [
    [BuildingClass.Wood, mix.wood],
    [BuildingClass.Masonry, mix.masonry],
    [BuildingClass.Steel, mix.steel],
    [BuildingClass.Concrete, mix.concrete],
    [BuildingClass.Heavy, mix.heavy],
  ]
  for (const [k, v] of entries) {
    acc += v
    if (u <= acc) return k
  }
  return BuildingClass.Masonry
}

function pickVariant(d: District, cls: Building['class'], h: number, footprint: number, biome: CityBiome, u: number): Building['variant'] {
  if (d === District.Industrial || (cls === BuildingClass.Steel && h < 22)) return u > 0.46 ? 'warehouse' : 'shed'
  if (cls === BuildingClass.Heavy) return u > 0.62 ? 'civic' : 'bunker'
  if (cls === BuildingClass.Wood && h < 20) return 'house'
  if (d === District.Residential && cls === BuildingClass.Masonry && h < 28) return u > 0.42 ? 'rowhouse' : 'walkup'
  if (biome.id === 'dune' && h < 90) return footprint > 26 ? (u > 0.55 ? 'courtyard' : 'slab') : 'walkup'
  if (biome.id === 'atoll') return cls === BuildingClass.Wood ? 'house' : 'walkup'
  if (h > 64) return u > 0.48 ? 'stepped' : 'tower'
  if (cls === BuildingClass.Concrete && footprint > 24 && u > 0.7) return 'civic'
  if (footprint > 28 && h < 48) return 'slab'
  return 'walkup'
}

function classForDistrict(d: District, u: number, mix: CityBiome['construction'], biome: CityBiome): Building['class'] {
  if (biome.id === 'saddle' && d === District.Residential) return u < 0.72 ? BuildingClass.Wood : BuildingClass.Masonry
  if (biome.id === 'dune' && d === District.Core) return u < 0.7 ? BuildingClass.Masonry : BuildingClass.Concrete
  if (d === District.Core) return u < 0.55 ? BuildingClass.Concrete : u < 0.85 ? BuildingClass.Steel : BuildingClass.Heavy
  if (d === District.Waterfront) return u < 0.6 ? BuildingClass.Steel : BuildingClass.Concrete
  if (d === District.Industrial) return u < 0.7 ? BuildingClass.Steel : BuildingClass.Masonry
  if (d === District.Residential) return u < 0.55 ? BuildingClass.Wood : BuildingClass.Masonry
  return pickClass(u, mix)
}

function layStreets(half: number, rand: () => number, biome: CityBiome): { ns: Street[]; ew: Street[] } {
  const minGap = biome.id === 'atoll' ? 90 : 140
  const maxGap = biome.id === 'harbor' ? 340 : biome.id === 'dune' ? 380 : 280
  const axis = (seedShift: number) => {
    const lines: Street[] = []
    let p = -half + 30 + rand() * 20
    let n = 0
    while (p < half - 30) {
      const arterial = n % 3 === 0
      const w = arterial ? 28 + rand() * 10 : 16 + rand() * 8
      lines.push({ pos: p, w })
      p += minGap + ((rand() + seedShift) % 1) * (maxGap - minGap)
      n++
    }
    if (lines.length < 6) {
      for (let x = -half + 80; x < half && lines.length < 8; x += 160) lines.push({ pos: x, w: 16 })
    }
    return lines
  }
  return { ns: axis(0), ew: axis(0.17) }
}

export function generateCity(biome: CityBiome): GeneratedCity {
  const ext = biome.extentM
  const half = ext / 2
  const rand = rng(biome.seed)

  const downtownX = 0
  const downtownZ = biome.id === 'harbor' ? -half * 0.08 : 0

  const heightAt = (x: number, z: number): number => {
    const nx = x / ext
    const nz = z / ext
    let h = fbm(nx * 3.2 + 8, nz * 3.2 + 3, biome.seed, 5)
    if (biome.id === 'saddle') {
      const valley = Math.exp(-((x / (ext * 0.22)) ** 2))
      h = h * 0.25 + (1 - valley) * 0.9
    }
    if (biome.id === 'harbor') {
      h *= 0.25 + 0.75 * Math.max(0, (z + half * 0.2) / ext)
    }
    if (biome.id === 'atoll') {
      const r = Math.hypot(x, z) / (ext * 0.28)
      h = h * 0.15 + Math.exp(-((r - 0.85) ** 2) * 18) * 0.4
    }
    return h * 220 * biome.heightScale
  }

  const waterAt = (x: number, z: number): number => {
    if (biome.water === 'none') return 0
    if (biome.water === 'ocean') {
      const shore = -half * 0.36 + fbm(x / 900, 2, biome.seed, 3) * 140
      return z < shore ? 1 : 0
    }
    if (biome.water === 'river') {
      const cx = biome.id === 'foundry' ? Math.sin(z / 1800) * 280 : 0
      return Math.abs(x - cx) < 90 + fbm(z / 400, 1, biome.seed, 2) * 40 ? 1 : 0
    }
    const r = Math.hypot(x, z)
    const ring = ext * 0.22
    return r < ring * 0.72 || r > ring * 1.35 ? 1 : 0
  }

  const { ns, ew } = layStreets(half, rand, biome)

  const isStreet = (x: number, z: number): boolean => {
    for (const s of ns) if (Math.abs(x - s.pos) <= s.w * 0.5 + 1.2) return true
    for (const s of ew) if (Math.abs(z - s.pos) <= s.w * 0.5 + 1.2) return true
    return false
  }

  const districtAt = (x: number, z: number): District => {
    if (waterAt(x, z) > 0.5) return District.Park
    const r = Math.hypot(x - downtownX, z - downtownZ)
    const nearWater =
      biome.water === 'ocean'
        ? Math.abs(z + half * 0.36) < 280
        : biome.water === 'river'
          ? Math.abs(x) < 260
          : false
    if (nearWater && r < ext * 0.35) return District.Waterfront
    if (r < ext * 0.11 * biome.downtownScale) return District.Core
    if (biome.id === 'foundry' && x > 40 && Math.abs(z) < 1600) return District.Industrial
    if (biome.id === 'harbor' && x > 1400 && z > 200) return District.Industrial
    const cell = Math.floor(x / 360) + Math.floor(z / 360) * 13
    if (Math.abs(cell) % 5 === 0 && r > ext * 0.14) return District.Park
    if (r < ext * 0.22) return District.Core
    return District.Residential
  }

  const densityAt = (x: number, z: number): number => {
    if (waterAt(x, z) > 0.5) return 0
    const d = districtAt(x, z)
    if (d === District.Park) return 40
    const r = Math.hypot(x - downtownX, z - downtownZ)
    const core = Math.exp(-((r / (ext * 0.14 * biome.downtownScale)) ** 2))
    const mid = Math.exp(-((r / (ext * 0.32)) ** 2))
    const peak = biome.population / Math.max(biome.areaKm2, 1)
    const mul = d === District.Core ? 1.3 : d === District.Waterfront ? 0.9 : d === District.Industrial ? 0.45 : 0.7
    return peak * (0.12 + 2.6 * core + 0.85 * mid) * mul
  }

  const buildings: Building[] = []
  const maxB = biome.id === 'harbor' ? 2400 : biome.id === 'atoll' ? 420 : 1400

  const pushBuilding = (x0: number, z0: number, x1: number, z1: number, d: District) => {
    if (buildings.length >= maxB) return
    const bw = x1 - x0
    const bd = z1 - z0
    if (bw < 12 || bd < 12) return
    const cx = (x0 + x1) / 2
    const cz = (z0 + z1) / 2
    if (waterAt(cx, cz) > 0.5 || isStreet(cx, cz)) return
    if (biome.water === 'ocean' && cz < -half * 0.3 && d !== District.Waterfront) return
    if (rand() > (d === District.Core ? 0.88 : d === District.Residential ? 0.58 : 0.78)) return

    const r = Math.hypot(cx - downtownX, cz - downtownZ)
    const downtown = Math.exp(-((r / (ext * 0.16)) ** 2))
    const cls = classForDistrict(d, rand(), biome.construction, biome)
    const hMul = d === District.Core ? 1 : d === District.Waterfront ? 0.7 : d === District.Industrial ? 0.45 : 0.35
    const setback = d === District.Residential ? 5 + rand() * 6 : 2.4 + rand() * 2.2
    const w = Math.max(8, bw - setback * 2)
    const depth = Math.max(8, bd - setback * 2)
    const baseH =
      7 +
      downtown * 110 * biome.downtownScale * hMul +
      rand() * (12 + downtown * 48 * hMul) +
      (cls === BuildingClass.Concrete ? 10 : 0)
    const h = Math.min(baseH, 230)
    const variant = pickVariant(d, cls, h, Math.max(w, depth), biome, rand())
    const yaw = d === District.Residential && rand() > 0.82 ? (rand() - 0.5) * 0.18 : 0
    const podiumH = variant === 'tower' && h > 58 ? 11 + rand() * 10 : 0
    buildings.push({
      x: cx,
      z: cz,
      w,
      d: depth,
      h,
      yaw,
      class: cls,
      occupancy: Math.max(2, (densityAt(cx, cz) * w * depth) / 1e6 * 80),
      district: d,
      variant,
      seed: rand() * 1000,
      podiumH,
    })
  }

  const fillBlock = (x0: number, z0: number, x1: number, z1: number, d: District, depth = 0) => {
    if (buildings.length >= maxB) return
    const bw = x1 - x0
    const bd = z1 - z0
    if (bw < 14 || bd < 14) return
    if (depth < 3 && bw > 78 && rand() > 0.32) {
      const split = x0 + bw * (0.38 + rand() * 0.24)
      const alley = d === District.Residential ? 5 : 4
      fillBlock(x0, z0, split - alley / 2, z1, d, depth + 1)
      fillBlock(split + alley / 2, z0, x1, z1, d, depth + 1)
      return
    }
    if (depth < 3 && bd > 78 && rand() > 0.32) {
      const split = z0 + bd * (0.38 + rand() * 0.24)
      const alley = d === District.Residential ? 5 : 4
      fillBlock(x0, z0, x1, split - alley / 2, d, depth + 1)
      fillBlock(x0, split + alley / 2, x1, z1, d, depth + 1)
      return
    }
    pushBuilding(x0, z0, x1, z1, d)
  }

  for (let i = 0; i < ns.length - 1; i++) {
    for (let j = 0; j < ew.length - 1; j++) {
      const x0 = ns[i].pos + ns[i].w / 2 + 2
      const x1 = ns[i + 1].pos - ns[i + 1].w / 2 - 2
      const z0 = ew[j].pos + ew[j].w / 2 + 2
      const z1 = ew[j + 1].pos - ew[j + 1].w / 2 - 2
      const cx = (x0 + x1) / 2
      const cz = (z0 + z1) / 2
      if (waterAt(cx, cz) > 0.5) continue
      const d = districtAt(cx, cz)
      if (d === District.Park) continue
      fillBlock(x0, z0, x1, z1, d)
    }
  }

  if (buildings.length < 120) {
    const step = 48
    for (let z = -half + 80; z < half - 80 && buildings.length < 160; z += step) {
      for (let x = -half + 80; x < half - 80 && buildings.length < 160; x += step) {
        if (waterAt(x, z) > 0.5 || isStreet(x, z)) continue
        const d = districtAt(x, z)
        if (d === District.Park) continue
        pushBuilding(x - 12, z - 12, x + 12, z + 12, d)
      }
    }
  }

  const roads: Road[] = []
  for (const s of ns) roads.push({ x: s.pos, z: 0, w: s.w, d: ext })
  for (const s of ew) roads.push({ x: 0, z: s.pos, w: ext, d: s.w })

  const landmarks: Landmark[] = []
  if (biome.water === 'ocean') {
    const shoreZ = -half * 0.34
    landmarks.push({ kind: 'bridge', name: 'Meridian Span', x: -380, z: shoreZ - 40, s: 1, spanM: 520 })
    landmarks.push({ kind: 'crane', name: 'Crane 4', x: 640, z: shoreZ + 40, s: 1 })
    landmarks.push({ kind: 'crane', name: 'Crane 7', x: 780, z: shoreZ + 80, s: 0.85 })
    landmarks.push({ kind: 'stadium', name: 'Basin Bowl', x: 1500, z: 480, s: 1, spanM: 180 })
    landmarks.push({ kind: 'hospital', name: 'St. Helier', x: -820, z: 180, s: 1 })
  }
  if (biome.id === 'foundry') {
    landmarks.push({ kind: 'refinery', name: 'Reach Tanks', x: 420, z: -180, s: 1 })
    landmarks.push({ kind: 'crane', name: 'Yard crane', x: -60, z: 40, s: 0.7 })
    landmarks.push({ kind: 'rail', name: 'Yard spur', x: 280, z: 40, s: 1 })
  }
  if (biome.id === 'saddle') {
    landmarks.push({ kind: 'hospital', name: 'Pass Clinic', x: 80, z: 60, s: 0.8 })
  }

  let gz = { x: downtownX, z: downtownZ }
  if (waterAt(gz.x, gz.z) > 0.5 || isStreet(gz.x, gz.z)) {
    const candidates = [
      { x: downtownX + 80, z: downtownZ + 80 },
      { x: downtownX, z: downtownZ + 400 },
      { x: downtownX + 400, z: downtownZ },
      { x: downtownX - 400, z: downtownZ },
      { x: ext * 0.24, z: 0 },
      { x: 0, z: ext * 0.24 },
    ]
    gz = candidates.find((c) => waterAt(c.x, c.z) < 0.5 && !isStreet(c.x, c.z)) ?? { x: downtownX + 600, z: downtownZ + 600 }
  }

  const lineOfSight = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) =>
    lineOfSightClear(heightAt, x0, y0, z0, x1, y1, z1)

  return {
    biome,
    buildings,
    landmarks,
    roads,
    downtown: { x: downtownX, z: downtownZ },
    heightAt,
    waterAt,
    densityAt,
    districtAt,
    isStreet,
    lineOfSight,
    gz,
  }
}
