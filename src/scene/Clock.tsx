import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { isLiveField, useSim } from '../state/store'
import { MAX_SIM_TIME_S, playbackRate } from '../sim/timeline'
import { setRenderTime } from './runtimeClock'

/** Advances sim-time on a log-friendly clock. Early seconds tick slower visually via speed. */
export function Clock() {
  const time = useRef(useSim.getState().simTime)
  const lastPublished = useRef(time.current)

  useFrame((_, dt) => {
    const s = useSim.getState()
    if (!s.playing || !isLiveField(s.phase)) {
      time.current = s.simTime
      lastPublished.current = s.simTime
      setRenderTime(s.simTime)
      return
    }
    if (Math.abs(s.simTime - lastPublished.current) > 0.35) time.current = s.simTime
    const t = time.current
    const next = Math.min(MAX_SIM_TIME_S, t + Math.min(dt, 0.05) * playbackRate(t, s.speed))
    time.current = next
    setRenderTime(next)
    if (next - lastPublished.current >= 0.083 || next === MAX_SIM_TIME_S) {
      lastPublished.current = next
      s.setSimTime(next)
    }
  })
  return null
}
