import { describe, expect, it } from 'vitest'
import { SCENARIO_PRESETS, matchesPreset } from '../../src/data/presets'
import { BurstMode } from '../../src/sim/types'

describe('scenario presets', () => {
  it('stays inside the model envelope and carries guidance', () => {
    for (const preset of SCENARIO_PRESETS) {
      expect(preset.yieldKt).toBeGreaterThanOrEqual(0.1)
      expect(preset.yieldKt).toBeLessThanOrEqual(50_000)
      expect(preset.fissionFraction).toBeGreaterThanOrEqual(0.03)
      expect(preset.fissionFraction).toBeLessThanOrEqual(1)
      expect(Object.values(BurstMode)).toContain(preset.hobMode)
      expect(preset.tip.length).toBeGreaterThan(10)
    }
    expect(new Set(SCENARIO_PRESETS.map((preset) => preset.id)).size).toBe(SCENARIO_PRESETS.length)
  })

  it('matches only an identical scenario', () => {
    const airburst = SCENARIO_PRESETS[0]
    const same = { yieldKt: airburst.yieldKt, hobMode: airburst.hobMode, fissionFraction: airburst.fissionFraction }
    expect(matchesPreset(airburst, same)).toBe(true)
    expect(matchesPreset(airburst, { ...same, yieldKt: airburst.yieldKt + 1 })).toBe(false)
    expect(matchesPreset(airburst, { ...same, hobMode: BurstMode.Surface })).toBe(false)
    expect(matchesPreset(airburst, { ...same, fissionFraction: airburst.fissionFraction + 0.5 })).toBe(false)
  })
})
