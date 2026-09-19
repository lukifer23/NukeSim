import { BurstMode, type BurstMode as BurstModeT } from '../sim/types'

export type ScenarioPreset = {
  id: string
  label: string
  tip: string
  yieldKt: number
  hobMode: BurstModeT
  fissionFraction: number
}

/** One-click scenarios that pair effects the model demonstrates together. */
export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'airburst',
    label: 'Optimized airburst',
    tip: 'The 5 psi blast spreads farthest when the burst height just keeps the fireball off the ground.',
    yieldKt: 100,
    hobMode: BurstMode.OptimizeBlast,
    fissionFraction: 0.5,
  },
  {
    id: 'fallout',
    label: 'Surface fallout',
    tip: 'A ground burst with a high fission fraction maximizes the local fallout field.',
    yieldKt: 100,
    hobMode: BurstMode.Surface,
    fissionFraction: 1,
  },
  {
    id: 'thermal',
    label: 'Thermal pulse',
    tip: 'A high airburst trades blast coupling for the widest thermal radius.',
    yieldKt: 1000,
    hobMode: BurstMode.OptimizeThermal,
    fissionFraction: 0.5,
  },
]

export function matchesPreset(
  preset: ScenarioPreset,
  scenario: { yieldKt: number; hobMode: BurstModeT; fissionFraction: number },
): boolean {
  return (
    scenario.yieldKt === preset.yieldKt &&
    scenario.hobMode === preset.hobMode &&
    Math.abs(scenario.fissionFraction - preset.fissionFraction) < 0.001
  )
}
