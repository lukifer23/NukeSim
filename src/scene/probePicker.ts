import type { ThreeEvent } from '@react-three/fiber'
import { useSim } from '../state/store'

/**
 * Places a probe where the pointer actually meets a world surface. The old
 * flat 40 km plane sat below the terrain, so probes landed offset from the
 * ground the user clicked. Terrain and water now attach this handler directly.
 */
export function useProbePicker(): { onPointerUp?: (e: ThreeEvent<PointerEvent>) => void } {
  const setProbe = useSim((s) => s.setProbeWorld)
  const offset = useSim((s) => s.impactOffset)
  const phase = useSim((s) => s.phase)
  if (phase === 'title' || phase === 'city-select') return {}
  return {
    onPointerUp: (e) => {
      if (e.delta > 6) return
      e.stopPropagation()
      setProbe(e.point.x - offset.x, e.point.z - offset.z)
    },
  }
}
