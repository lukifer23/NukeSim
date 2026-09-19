import { describe, expect, it } from 'vitest'
import { MAX_SIM_TIME_S, classifyTimeOfDay, playbackRate } from '../../src/sim/timeline'
import { isSurfaceBurst } from '../../src/sim'

describe('timeline helpers', () => {
  it('accelerates playback after the early phases', () => {
    expect(playbackRate(5, 1)).toBe(1)
    expect(playbackRate(30, 1)).toBe(3)
    expect(playbackRate(120, 1)).toBe(24)
    expect(playbackRate(120, 0.5)).toBe(12)
    expect(MAX_SIM_TIME_S).toBe(48 * 3600)
  })

  it('classifies the day the same way the scene lights it', () => {
    expect(classifyTimeOfDay(0.05)).toBe('night')
    expect(classifyTimeOfDay(0.25)).toBe('dawn')
    expect(classifyTimeOfDay(0.5)).toBe('day')
    expect(classifyTimeOfDay(0.8)).toBe('dusk')
    expect(classifyTimeOfDay(0.95)).toBe('night')
  })

  it('treats near-ground bursts as surface bursts', () => {
    expect(isSurfaceBurst(0)).toBe(true)
    expect(isSurfaceBurst(1)).toBe(true)
    expect(isSurfaceBurst(2)).toBe(false)
  })
})
