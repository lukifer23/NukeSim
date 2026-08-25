import { fireballMaxRadiusM } from '../sim'
import type { CityId } from '../data/cities'


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

/** Keeps the ground, burst point, and full fireball inside a conservative HUD-safe frame. */
export function detonationCameraFrame(
  yieldKt: number,
  hobM: number,
  verticalFovDeg = 46,
  aspect = 16 / 9,
): DetonationCameraFrame {
  const surface = hobM <= 1
  const fireball = fireballMaxRadiusM(yieldKt, surface)
  const top = surface ? fireball * 0.84 : hobM + fireball
  const verticalSpan = Math.max(top, fireball * 1.4, 240)
  const halfFov = (verticalFovDeg * Math.PI) / 360
  const narrowFactor = aspect < 1.25 ? 1.25 / Math.max(aspect, 0.5) : 1
  const fitDistance = (verticalSpan / (2 * Math.tan(halfFov))) * 1.55 * narrowFactor
  const startDistance = Math.max(900, fitDistance, fireball * 4.2)
  return {
    startDistance,
    endDistance: Math.max(startDistance * 1.3, fireball * 6),
    cameraHeight: Math.max(280, verticalSpan * 0.55),
    lookY: Math.max(45, top * 0.48),
    verticalSpan,
  }
}

/**
 * Frames the visual cap, not the fireball foot. Mushroom.tsx: scaleY = 0.55h,
 * mesh y = 0.92 × scaleY, SDF cap at object y = 0.42 → world ≈ 0.73h.
 * Distance stays inside fog (≤46 km) and orbit maxDistance (42 km).
 */
export function cloudCameraFrame(
  cloudHeightM: number,
  verticalFovDeg = 46,
  aspect = 16 / 9,
): DetonationCameraFrame {
  const shown = Math.min(Math.max(cloudHeightM, 480), 18000)
  const capY = shown * 0.73
  const capSpan = Math.max(shown * 0.5, 720)
  const halfFov = (verticalFovDeg * Math.PI) / 360
  const narrowFactor = aspect < 1.25 ? 1.25 / Math.max(aspect, 0.5) : 1
  const dist = Math.min(
    20000,
    Math.max(shown * 1.38, 2400, (capSpan / (2 * Math.tan(halfFov))) * 1.45 * narrowFactor),
  )
  return {
    startDistance: dist,
    endDistance: dist,
    cameraHeight: Math.max(560, capY * 0.92),
    lookY: capY,
    verticalSpan: capSpan,
  }
}
