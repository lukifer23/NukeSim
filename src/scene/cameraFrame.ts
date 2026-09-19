import { fireballMaxRadiusM, isSurfaceBurst } from '../sim'
import type { CityId } from '../data/cities'

/** Shared camera framing constants. */
export const CAMERA_FAR = 120000
export const CAMERA_FOV_DEG = 46

export const CITY_CAMERA_FRAMES: Record<CityId, { pos: [number, number, number]; target: [number, number, number] }> = {
  harbor: { pos: [1680, 420, -1980], target: [220, 36, -220] },
  foundry: { pos: [980, 280, 1420], target: [280, 18, -40] },
  dune: { pos: [2200, 620, -1640], target: [0, 12, 80] },
  saddle: { pos: [40, 380, 1680], target: [0, 70, 0] },
  atoll: { pos: [80, 360, -1480], target: [0, 8, 0] },
}

export type DetonationCameraFrame = {
  startDistance: number
  endDistance: number
  cameraHeight: number
  lookY: number
  verticalSpan: number
}

export const CLOUD_CAM_MAX_M = 34000

function halfFovRad(verticalFovDeg: number): number {
  return (verticalFovDeg * Math.PI) / 360
}

function narrowFactor(aspect: number): number {
  return aspect < 1.25 ? 1.25 / Math.max(aspect, 0.5) : 1
}

/** Distance that fits a vertical span into the viewport with a safety margin. */
function fitDistanceM(verticalSpanM: number, verticalFovDeg: number, aspect: number, coeff: number): number {
  return (verticalSpanM / (2 * Math.tan(halfFovRad(verticalFovDeg)))) * coeff * narrowFactor(aspect)
}

/** Keeps the ground, burst point, and full fireball inside a conservative HUD-safe frame. */
export function detonationCameraFrame(
  yieldKt: number,
  hobM: number,
  verticalFovDeg = CAMERA_FOV_DEG,
  aspect = 16 / 9,
): DetonationCameraFrame {
  const surface = isSurfaceBurst(hobM)
  const fireball = fireballMaxRadiusM(yieldKt, surface)
  const top = surface ? fireball * 0.84 : hobM + fireball
  const verticalSpan = Math.max(top, fireball * 1.4, 240)
  const fit = fitDistanceM(verticalSpan, verticalFovDeg, aspect, 1.7)
  const startDistance = Math.max(900, fit, fireball * 6.4)
  return {
    startDistance,
    endDistance: Math.max(startDistance * 1.3, fireball * 8),
    cameraHeight: Math.max(280, verticalSpan * 0.55),
    lookY: Math.max(45, top * 0.48),
    verticalSpan,
  }
}

/**
 * Frames the visual cap. Mushroom.tsx maps the SDF cap centre to the
 * stabilized cap altitude directly, so capY tracks the modeled cap height.
 * Distance stays inside fog (≤46 km) and orbit maxDistance (42 km).
 */
export function cloudCameraFrame(
  cloudHeightM: number,
  verticalFovDeg = CAMERA_FOV_DEG,
  aspect = 16 / 9,
): DetonationCameraFrame {
  const shown = Math.min(Math.max(cloudHeightM, 480), 18000)
  // Include the cap itself, not just its centre, so the crown never clips.
  const capTop = shown * 1.22
  const capSpan = capTop
  const dist = Math.min(CLOUD_CAM_MAX_M, Math.max(shown * 1.9, 2400, fitDistanceM(capSpan, verticalFovDeg, aspect, 1.3)))
  return {
    startDistance: dist,
    endDistance: dist,
    cameraHeight: Math.max(560, capTop * 0.42),
    lookY: capTop * 0.5,
    verticalSpan: capSpan,
  }
}
