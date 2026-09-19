import type { RenderQuality } from '../state/store'

/** Raymarch step budget per quality tier, shared by the volumetric FX shaders. */
export function volumeSteps(quality: RenderQuality): number {
  return quality === 'high' ? 36 : quality === 'balanced' ? 28 : 18
}
