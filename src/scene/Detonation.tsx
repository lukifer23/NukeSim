import { useSim } from '../state/store'
import { Fireball } from './fx/Fireball'
import { Mushroom } from './fx/Mushroom'
import { Shock } from './fx/Shock'
import { Flash } from './fx/Flash'
import { Fires } from './fx/Fires'
import { Debris } from './fx/Debris'
import { SmokePlumes } from './fx/SmokePlumes'

export function Detonation() {
  const phase = useSim((s) => s.phase)
  const hasRun = useSim((s) => s.hasRun)
  if (!hasRun || phase === 'title' || phase === 'city-select' || phase === 'bench') return null
  return (
    <>
      <Flash />
      <Fireball />
      <Shock />
      <Mushroom />
      <Fires />
      <Debris />
      <SmokePlumes />
    </>
  )
}
