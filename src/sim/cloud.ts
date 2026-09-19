import type { CloudSpec } from './types'

/**
 * Stabilized mushroom from Miller / Glasstone cloud-rise curve fits.
 * The cap saturates toward the tropopause/stratosphere instead of growing
 * without bound at very high yield (50 Mt would otherwise exceed 40 km).
 */
export function mushroomCloud(yieldKt: number): CloudSpec {
  const w = Math.max(yieldKt, 0.01)
  const rawAltitude = 4500 * w ** 0.22
  const capAltitudeM =
    rawAltitude <= 12000 ? rawAltitude : 12000 + 7000 * (1 - Math.exp(-(rawAltitude - 12000) / 7000))
  const capDiameterM = 2200 * w ** 0.25
  const stemRadiusM = capDiameterM * 0.18
  const riseRateMps = 55 * w ** 0.12
  const stabilizeS = capAltitudeM / Math.max(riseRateMps, 1)
  return { capAltitudeM, capDiameterM, stemRadiusM, riseRateMps, stabilizeS }
}

export function cloudHeightAtTimeM(cloud: CloudSpec, tS: number): number {
  const u = Math.min(1, Math.max(0, tS / cloud.stabilizeS))
  return cloud.capAltitudeM * (1 - Math.exp(-3.2 * u))
}
