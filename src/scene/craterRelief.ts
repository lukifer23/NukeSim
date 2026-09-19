/**
 * Visual bowl + rim lip. Diameter and depth still come from craterFor;
 * this only shapes the terrain mesh so a megaton crater is not a 192-seg cone.
 * The same constants are injected into the GLSL copy in terrainMat.ts, so the
 * two cannot drift.
 */
export const CRATER_EXTENT = 1.28
export const CRATER_RIM_START = 0.88
export const CRATER_LIP = 0.52

export function craterReliefM(distanceM: number, radiusM: number, depthM: number): number {
  if (radiusM <= 1 || depthM <= 0) return 0
  const u = distanceM / radiusM
  if (u >= CRATER_EXTENT) return 0
  const bowl = u < 1 ? -depthM * (1 - u * u) * (1 - u * u) : 0
  if (u <= CRATER_RIM_START) return bowl
  const t = (u - CRATER_RIM_START) / (CRATER_EXTENT - CRATER_RIM_START)
  const lip = depthM * CRATER_LIP * t * (1 - t)
  return bowl + lip
}
