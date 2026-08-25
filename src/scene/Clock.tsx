import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSim } from '../state/store'
import { setRenderTime } from './runtimeClock'

/** Advances sim-time on a log-friendly clock. Early seconds tick slower visually via speed. */
export function Clock() {
  const time = useRef(useSim.getState().simTime)
  const lastPublished = useRef(time.current)

  useFrame((_, dt) => {
    const s = useSim.getState()
    if (!s.playing || (s.phase !== 'detonate' && s.phase !== 'explore')) {
      time.current = s.simTime
      lastPublished.current = s.simTime
      setRenderTime(s.simTime)
      return
    }
    if (Math.abs(s.simTime - lastPublished.current) > 0.35) time.current = s.simTime
    const t = time.current
    // First 20 sim seconds stay near wall-clock (times user speed), then accelerate.
    const rate = t < 20 ? s.speed : t < 90 ? 3 * s.speed : 24 * s.speed
    const next = Math.min(48 * 3600, t + Math.min(dt, 0.05) * rate)
    time.current = next
    setRenderTime(next)
    if (next - lastPublished.current >= 0.083 || next === 48 * 3600) {
      lastPublished.current = next
      s.setSimTime(next)
    }
  })
  return null
}
