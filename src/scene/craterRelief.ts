/**
 * Visual bowl + rim lip. Diameter and depth still come from craterFor;
 * this only shapes the terrain mesh so a megaton crater is not a 192-seg cone.
 * Keep the GLSL copy in terrainMat.ts in sync.
 */
export function craterReliefM(distanceM: number, radiusM: number, depthM: number): number {
  if (radiusM <= 1 || depthM <= 0) return 0
  const u = distanceM / radiusM
  if (u >= 1.28) return 0
  const bowl = u < 1 ? -depthM * (1 - u * u) * (1 - u * u) : 0
  if (u <= 0.88) return bowl
  const t = (u - 0.88) / 0.4
  const lip = depthM * 0.13 * 4 * t * (1 - t)
  return bowl + lip
}
