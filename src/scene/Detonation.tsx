import { useEffect } from 'react'
import { useSim } from '../state/store'
import { arrivalTimeS } from '../sim'
import { armBlast } from '../audio/engine'
import { CITY_CAMERA_FRAMES } from './cameraFrame'
import { Fireball } from './fx/Fireball'
import { WilsonCloud } from './fx/WilsonCloud'
import { Mushroom } from './fx/Mushroom'
import { Shock } from './fx/Shock'
import { Flash } from './fx/Flash'
import { Fires } from './fx/Fires'
import { Debris } from './fx/Debris'
import { SmokePlumes } from './fx/SmokePlumes'
import { CollapseDust } from './fx/CollapseDust'

export function Detonation() {
  const phase = useSim((s) => s.phase)
  const hasRun = useSim((s) => s.hasRun)
  // Schedule the blast so its peak lands when the shock actually reaches the
  // observer, using the field camera's range to ground zero.
  useEffect(() => {
    if (phase !== 'detonate') return
    const s = useSim.getState()
    const frame = CITY_CAMERA_FRAMES[s.cityId]
    const rangeM = Math.max(300, Math.hypot(
      frame.pos[0] - frame.target[0],
      frame.pos[1] - frame.target[1],
      frame.pos[2] - frame.target[2],
    ))
    armBlast(arrivalTimeS(s.yieldKt, s.hobResolved(), rangeM), s.yieldKt)
  }, [phase])
  if (!hasRun || phase === 'title' || phase === 'city-select' || phase === 'bench') return null
  return (
    <>
      <Flash />
      <Fireball />
      <WilsonCloud />
      <Shock />
      <Mushroom />
      <Fires />
      <Debris />
      <CollapseDust />
      <SmokePlumes />
    </>
  )
}
