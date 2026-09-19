import type { BuildingClass } from '../sim/types'
import type { CityBiome } from '../data/cities'

export const District = {
  Waterfront: 'waterfront',
  Core: 'core',
  Industrial: 'industrial',
  Residential: 'residential',
  Park: 'park',
} as const
export type District = (typeof District)[keyof typeof District]

export type BuildingVariant =
  | 'house'
  | 'rowhouse'
  | 'walkup'
  | 'courtyard'
  | 'tower'
  | 'stepped'
  | 'slab'
  | 'shed'
  | 'warehouse'
  | 'bunker'
  | 'civic'

export type Building = {
  x: number
  z: number
  w: number
  d: number
  h: number
  yaw: number
  class: BuildingClass
  occupancy: number
  district: District
  variant: BuildingVariant
  seed: number
  podiumH: number
}

export type Landmark = {
  kind: 'bridge' | 'stadium' | 'crane' | 'refinery' | 'hospital' | 'rail'
  name: string
  x: number
  z: number
  s: number
  spanM?: number
}

export type Road = {
  x: number
  z: number
  w: number
  d: number
}

export type GeneratedCity = {
  biome: CityBiome
  buildings: Building[]
  landmarks: Landmark[]
  roads: Road[]
  downtown: { x: number; z: number }
  /** Height in meters at world (x,z). */
  heightAt: (x: number, z: number) => number
  /** 1 = water. */
  waterAt: (x: number, z: number) => number
  /** People / km². */
  densityAt: (x: number, z: number) => number
  districtAt: (x: number, z: number) => District
  isStreet: (x: number, z: number) => boolean
  /**
   * True if the segment from (x0,y0,z0) to (x1,y1,z1) clears the heightmap.
   * y is altitude in meters.
   */
  lineOfSight: (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => boolean
  gz: { x: number; z: number }
}
