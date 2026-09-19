import { describe, expect, it } from 'vitest'
import { decodeScenario, encodeScenario } from '../../src/sim/scenario'
import { CITIES } from '../../src/data/cities'

const base = {
  cityId: 'harbor' as const,
  yieldKt: 100,
  hobM: 580,
  fissionFraction: 0.5,
  windSpeedMps: 5,
  windDirDeg: 180,
  visibilityKm: 12,
}

describe('shared scenarios', () => {
  it('round-trips a valid scenario', () => {
    expect(decodeScenario(encodeScenario(base))).toEqual(base)
  })

  it('accepts every generated city', () => {
    for (const city of CITIES) {
      const decoded = decodeScenario(encodeScenario({ ...base, cityId: city.id }))
      expect(decoded?.cityId, city.id).toBe(city.id)
    }
  })

  it('rejects missing, empty, or non-numeric parameters', () => {
    expect(decodeScenario('?city=harbor')).toBeNull()
    expect(decodeScenario('?city=harbor&y=&h=580&f=0.5&w=5&d=180&v=12')).toBeNull()
    expect(decodeScenario('?city=harbor&y=abc&h=580&f=0.5&w=5&d=180&v=12')).toBeNull()
  })

  it('rejects an unknown city', () => {
    const query = encodeScenario(base).replace('city=harbor', 'city=atlantis')
    expect(decodeScenario(query)).toBeNull()
  })

  it('clamps out-of-envelope values', () => {
    const decoded = decodeScenario('?city=harbor&y=999999&h=-50&f=0&w=99&d=900&v=0')
    expect(decoded?.yieldKt).toBe(50_000)
    expect(decoded?.hobM).toBe(0)
    expect(decoded?.fissionFraction).toBe(0.03)
    expect(decoded?.windSpeedMps).toBe(25)
    expect(decoded?.windDirDeg).toBe(359)
    expect(decoded?.visibilityKm).toBe(2)
  })
})
