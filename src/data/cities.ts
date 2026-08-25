export type CityId = 'harbor' | 'foundry' | 'dune' | 'saddle' | 'atoll'

export type CityBiome = {
  id: CityId
  name: string
  tag: string
  population: number
  areaKm2: number
  seed: number
  extentM: number
  water: 'ocean' | 'river' | 'none' | 'lagoon'
  visibilityKm: number
  humidity: number
  windDefaultMps: number
  windDefaultDeg: number
  downtownScale: number
  heightScale: number
  construction: { wood: number; masonry: number; steel: number; concrete: number; heavy: number }
  hook: string
  climate: string
}

export const CITIES: CityBiome[] = [
  {
    id: 'harbor',
    name: 'Port Meridian',
    tag: 'Coastal megacity',
    population: 4_200_000,
    areaKm2: 80,
    seed: 1945,
    extentM: 11000,
    water: 'ocean',
    visibilityKm: 12,
    humidity: 0.7,
    windDefaultMps: 6,
    windDefaultDeg: 35,
    downtownScale: 1,
    heightScale: 0.55,
    construction: { wood: 0.12, masonry: 0.28, steel: 0.22, concrete: 0.32, heavy: 0.06 },
    hook: 'Bridges, a container port, a dense core. The classic 300 kt question.',
    climate: 'Temperate marine, hazy',
  },
  {
    id: 'foundry',
    name: 'Cinder Reach',
    tag: 'River industrial',
    population: 850_000,
    areaKm2: 45,
    seed: 1954,
    extentM: 9000,
    water: 'river',
    visibilityKm: 10,
    humidity: 0.55,
    windDefaultMps: 5,
    windDefaultDeg: 90,
    downtownScale: 0.7,
    heightScale: 0.35,
    construction: { wood: 0.18, masonry: 0.3, steel: 0.28, concrete: 0.2, heavy: 0.04 },
    hook: 'Tank farms and rail yards. A firestorm candidate.',
    climate: 'Continental, industrial haze',
  },
  {
    id: 'dune',
    name: 'Solara Basin',
    tag: 'Desert sprawl',
    population: 320_000,
    areaKm2: 60,
    seed: 1962,
    extentM: 10000,
    water: 'none',
    visibilityKm: 28,
    humidity: 0.12,
    windDefaultMps: 8,
    windDefaultDeg: 0,
    downtownScale: 0.45,
    heightScale: 0.25,
    construction: { wood: 0.08, masonry: 0.4, steel: 0.22, concrete: 0.26, heavy: 0.04 },
    hook: 'Clear air stretches thermal ranges. Blast does not care about humidity.',
    climate: 'Arid, 28 km visibility',
  },
  {
    id: 'saddle',
    name: 'Kite Pass',
    tag: 'Alpine valley',
    population: 180_000,
    areaKm2: 18,
    seed: 1963,
    extentM: 7000,
    water: 'river',
    visibilityKm: 8,
    humidity: 0.6,
    windDefaultMps: 4,
    windDefaultDeg: 180,
    downtownScale: 0.55,
    heightScale: 1.4,
    construction: { wood: 0.35, masonry: 0.35, steel: 0.12, concrete: 0.15, heavy: 0.03 },
    hook: 'Ridges shadow blast and thermal. The far slope can live.',
    climate: 'Alpine, inversion-prone',
  },
  {
    id: 'atoll',
    name: 'North Haven',
    tag: 'Island outpost',
    population: 12_000,
    areaKm2: 6,
    seed: 1952,
    extentM: 5000,
    water: 'lagoon',
    visibilityKm: 20,
    humidity: 0.5,
    windDefaultMps: 9,
    windDefaultDeg: 270,
    downtownScale: 0.3,
    heightScale: 0.15,
    construction: { wood: 0.4, masonry: 0.3, steel: 0.15, concrete: 0.12, heavy: 0.03 },
    hook: 'Tiny population, huge ocean. Fallout washes a different story.',
    climate: 'Subpolar maritime',
  },
]

export function cityById(id: string): CityBiome {
  return CITIES.find((c) => c.id === id) ?? CITIES[0]
}
