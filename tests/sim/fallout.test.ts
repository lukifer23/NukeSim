import { describe, expect, it } from 'vitest'
import {
  arrivalHours,
  doseRateAtHour,
  falloutContours,
  falloutDepositionProgress,
  falloutRateAtH1,
  falloutRateAtTimeRadH,
  integratedDoseRad,
  millerPolygon,
  pointInPoly,
  rotateToWind,
} from '../../src/sim'

describe('educational fallout time field', () => {
  it('does not deposit downwind fallout before its nominal arrival', () => {
    expect(falloutDepositionProgress(36_000, 10, 600)).toBe(0)
    expect(falloutDepositionProgress(36_000, 10, 4_000)).toBeGreaterThan(0)
  })

  it('deposits near ground zero while the far tail is still empty', () => {
    expect(falloutDepositionProgress(200, 10, 600)).toBeGreaterThan(0.9)
    expect(falloutDepositionProgress(36_000, 10, 600)).toBe(0)
  })

  it('decays an arrived reference rate over time', () => {
    const early = falloutRateAtTimeRadH(100, 1_000, 10, 3_600)
    const late = falloutRateAtTimeRadH(100, 1_000, 10, 25_200)
    expect(early).toBeGreaterThan(late)
  })

  it('builds nested surface-burst contours and suppresses airburst contours', () => {
    const surface = falloutContours(300, 0, 6.7, 0, 0.5)
    expect(surface).toHaveLength(5)
    expect(surface.map((item) => item.rateRadH)).toEqual([3000, 1000, 300, 100, 10])
    expect(surface.every((item) => item.points.length === 16)).toBe(true)
    expect(falloutContours(300, 2000, 6.7, 0, 0.5)).toEqual([])
  })

  it('rotates the plume and resolves point membership and hottest matching rate', () => {
    const square = [{ x: -1, z: -1 }, { x: 1, z: -1 }, { x: 1, z: 1 }, { x: -1, z: 1 }]
    expect(pointInPoly(0, 0, square)).toBe(true)
    expect(pointInPoly(2, 0, square)).toBe(false)
    expect(rotateToWind([{ x: 0, z: 10 }], 90)[0].x).toBeCloseTo(10)
    expect(millerPolygon(10, 2)).toHaveLength(16)
    expect(falloutRateAtH1(0, 0, [{ id: 'hot', rateRadH: 1000, color: '', label: '', points: square }])).toBe(1000)
    expect(falloutRateAtH1(3, 0, [{ id: 'hot', rateRadH: 1000, color: '', label: '', points: square }])).toBe(0)
  })

  it('handles decay, integration, arrival, and empty-rate boundaries', () => {
    expect(doseRateAtHour(100, 1)).toBe(100)
    expect(doseRateAtHour(100, 7)).toBeCloseTo(100 * 7 ** -1.2)
    expect(integratedDoseRad(100, 1, 24)).toBeGreaterThan(0)
    expect(integratedDoseRad(0, 1, 24)).toBe(0)
    expect(integratedDoseRad(100, 24, 1)).toBe(0)
    expect(arrivalHours(3600, 1)).toBe(1)
    expect(arrivalHours(1800, 0)).toBe(1)
    expect(falloutRateAtTimeRadH(0, 1000, 10, 3600)).toBe(0)
  })
})
