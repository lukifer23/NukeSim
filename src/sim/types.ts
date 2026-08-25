export const Confidence = {
  StandardScaling: 'standard-scaling',
  Interpolated: 'interpolated',
  Heuristic: 'heuristic',
  Qualitative: 'qualitative',
} as const
export type Confidence = (typeof Confidence)[keyof typeof Confidence]

export const BurstMode = {
  Surface: 'surface',
  OptimizeBlast: 'optimize-5psi',
  OptimizeThermal: 'optimize-thermal',
  Custom: 'custom',
} as const
export type BurstMode = (typeof BurstMode)[keyof typeof BurstMode]

export const BuildingClass = {
  Wood: 'wood',
  Masonry: 'masonry',
  Steel: 'steel',
  Concrete: 'concrete',
  Heavy: 'heavy',
} as const
export type BuildingClass = (typeof BuildingClass)[keyof typeof BuildingClass]

export const DamageState = {
  Intact: 'intact',
  Glass: 'glass',
  Moderate: 'moderate',
  Severe: 'severe',
  Collapsed: 'collapsed',
  Vaporized: 'vaporized',
} as const
export type DamageState = (typeof DamageState)[keyof typeof DamageState]

export const Shelter = {
  Open: 'open',
  WoodHouse: 'wood',
  Basement: 'basement',
  HeavyRc: 'heavy',
} as const
export type Shelter = (typeof Shelter)[keyof typeof Shelter]

export type ScenarioInput = {
  yieldKt: number
  hobM: number
  fissionFraction: number
  windSpeedMps: number
  windDirDeg: number
  visibilityKm: number
}

export type EffectKind = 'blast' | 'thermal' | 'radiation' | 'fireball' | 'fallout' | 'crater'

export type EffectRing = {
  id: string
  kind: EffectKind
  label: string
  radiusM: number
  color: string
  detail: string
  psi?: number
  fluence?: number
  rem?: number
  source: string
  confidence: Confidence
}

export type ProbeResult = {
  x: number
  z: number
  groundRangeM: number
  slantRangeM: number
  arrivalS: number
  overpressurePsi: number
  dynamicPressurePsi: number
  equivalentWindMph: number
  thermalCalCm2: number
  promptRem: number
  falloutRateH1RadH: number
  falloutDoseRad: number
  buildingDamage: DamageState
  fatalityFrac: number
  injuryFrac: number
  notes: string[]
  losClear: boolean
  confidence: Confidence
}

export type CloudSpec = {
  capAltitudeM: number
  capDiameterM: number
  stemRadiusM: number
  riseRateMps: number
  stabilizeS: number
}

export type CraterSpec = {
  diameterM: number
  depthM: number
}

export type FalloutContour = {
  id: string
  rateRadH: number
  color: string
  label: string
  /** Downwind-aligned polygon in meters, origin at GZ, +Z downwind before rotation. */
  points: Array<{ x: number; z: number }>
}

export type EffectsReport = {
  yieldKt: number
  hobM: number
  scaledHobM: number
  fireballTouchesGround: boolean
  fireballRadiusM: number
  fireballMaxRadiusM: number
  rings: EffectRing[]
  cloud: CloudSpec
  crater: CraterSpec | null
  fallout: FalloutContour[]
  optimumHob5PsiM: number
  optimumHobThermalM: number
}
