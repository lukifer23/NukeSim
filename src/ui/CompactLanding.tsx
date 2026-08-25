import { Link } from 'react-router-dom'
import { CITIES } from '../data/cities'
import { DISCLAIMER, PRODUCT_BLURB } from '../data/sources'
import { blastGroundRangeM } from '../sim/blast'
import { formatRange } from '../sim/units'

const HOB_M = 200
const R10 = blastGroundRangeM(10, HOB_M, 5)
const RMT = blastGroundRangeM(1000, HOB_M, 5)

export function CompactLanding() {
  const max = Math.max(RMT, 1)
  return (
    <main className="compact-landing">
      <div className="compact-card">
        <p className="guide-eyebrow">Educational simulation</p>
        <h1>NukeSim</h1>
        <p>{PRODUCT_BLURB}</p>
        <p className="compact-note">
          The walkable 3D field needs a tablet or desktop so the city, timeline, and model limits stay readable together. Scale still works here.
        </p>

        <section className="compact-scale" aria-label="Blast scale at 200 m height of burst">
          <p className="ns-label">5 psi severe blast · 200 m HOB</p>
          <div className="compact-bar">
            <i style={{ width: `${(R10 / max) * 100}%` }} />
            <span>10 kt · {formatRange(R10)}</span>
          </div>
          <div className="compact-bar">
            <i className="mt" style={{ width: '100%' }} />
            <span>1 Mt · {formatRange(RMT)}</span>
          </div>
          <p className="compact-note">Radius grows as the cube root of yield, not linearly.</p>
        </section>

        <section className="compact-cities" aria-label="Fictional cities">
          {CITIES.map((city) => (
            <article key={city.id}>
              <span>{city.tag}</span>
              <strong>{city.name}</strong>
              <p>{city.hook}</p>
            </article>
          ))}
        </section>

        <p className="compact-note">{DISCLAIMER}</p>
        <div className="compact-actions">
          <Link to="/academy">Open the Academy</Link>
          <Link to="/about">Read model limits</Link>
        </div>
      </div>
    </main>
  )
}
