import { CITIES } from '../data/cities'
import { useSim } from '../state/store'
import { formatNum } from './format'
import { Button } from './controls'

const TEACHES: Record<string, string> = {
  harbor: 'Cube-root scale against a dense waterfront.',
  foundry: 'Fuel load. Ignition means more here than in the desert.',
  dune: 'Clear air stretches thermal range. Blast ignores humidity.',
  saddle: 'Ridge line-of-sight. The far slope can live.',
  atoll: 'Tiny population, huge water. Fallout still draws a plume.',
}

export function CitySelect() {
  const cityId = useSim((s) => s.cityId)
  const setCity = useSim((s) => s.setCity)
  const setPhase = useSim((s) => s.setPhase)

  return (
    <div className="city-chooser pointer-events-auto">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="guide-eyebrow">Select a generated city</p>
          <h2 className="mt-1 text-xl text-paper">Fictional worlds. Real scaling laws.</h2>
        </div>
        <Button onClick={() => setPhase('bench')}>Configure detonation</Button>
      </div>
      <div className="city-chooser-grid">
        {CITIES.map((c) => {
          const on = c.id === cityId
          return (
            <button
              key={c.id}
              onClick={() => setCity(c.id)}
              className={`city-card ${on ? 'on' : ''}`}
            >
              <p className="tag">{c.tag}</p>
              <h3>{c.name}</h3>
              <p className="meta">
                {formatNum(c.population)} · {c.areaKm2} km²
              </p>
              <p className="hook">{TEACHES[c.id] ?? c.hook}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
