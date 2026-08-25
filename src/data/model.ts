import { Confidence, type Confidence as ConfidenceType, type EffectKind } from '../sim/types'

export type ModelNote = {
  title: string
  confidence: ConfidenceType
  source: string
  uncertainty: string
  excludes: string
  changesWith: string
}

export const MODEL_NOTES: Record<EffectKind, ModelNote> = {
  blast: {
    title: 'Blast field',
    confidence: Confidence.Interpolated,
    source: 'Glasstone & Dolan, Ch. III; published scaled-range charts',
    uncertainty: 'Order-of-magnitude range. The height-of-burst knee is interpolated.',
    excludes: 'Street canyons, detailed terrain channeling, and building shielding.',
    changesWith: 'Yield, height of burst, terrain, and local construction.',
  },
  thermal: {
    title: 'Thermal field',
    confidence: Confidence.StandardScaling,
    source: 'Glasstone & Dolan, Ch. VII thermal scaling',
    uncertainty: 'Exposure estimate, not a medical diagnosis.',
    excludes: 'Cloud cover, clothing, indoor shielding, and building-to-building shadow.',
    changesWith: 'Visibility, burst height, line of sight, and exposure.',
  },
  radiation: {
    title: 'Prompt radiation',
    confidence: Confidence.Interpolated,
    source: 'Glasstone & Dolan, Ch. VIII; Fletcher CEX-62.2 curve family',
    uncertainty: 'Curve-fit estimate intended to show relative scale.',
    excludes: 'Detailed neutron transport, shielding geometry, and medical outcomes.',
    changesWith: 'Yield, fission fraction, height, distance, terrain, and shielding.',
  },
  fallout: {
    title: 'Local fallout',
    confidence: Confidence.Heuristic,
    source: 'Miller Simplified Fallout Scaling System, 1963',
    uncertainty: 'Educational deposition field, not a weather forecast.',
    excludes: 'Wind shear, precipitation, terrain deposition, and live meteorology.',
    changesWith: 'Whether the fireball touches ground, fission fraction, wind, time, and shelter.',
  },
  fireball: {
    title: 'Fireball',
    confidence: Confidence.StandardScaling,
    source: 'Glasstone & Dolan, §2.04–2.05',
    uncertainty: 'Reference-radius scaling, visually simplified.',
    excludes: 'Camera exposure and material-specific visual behavior.',
    changesWith: 'Yield, height of burst, and surface coupling.',
  },
  crater: {
    title: 'Crater',
    confidence: Confidence.Heuristic,
    source: 'Sedan-class engineering scaling',
    uncertainty: 'Illustrative surface/near-surface fit.',
    excludes: 'Geology, soil moisture, rock, and underground structures.',
    changesWith: 'Yield, height of burst, and ground material.',
  },
}

export const MODEL_VERSION = '2.0-educational-field'
