import { DISCLAIMER, PRODUCT_BLURB } from '../data/sources'
import { useSim } from '../state/store'
import { Link } from 'react-router-dom'
import { Button } from './controls'

export function Title() {
  const accept = useSim((s) => s.accept)
  const accepted = useSim((s) => s.accepted)
  const setPhase = useSim((s) => s.setPhase)
  const reduced = useSim((s) => s.reducedMotion)
  const setReduced = useSim((s) => s.setReduced)

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-end justify-start bg-gradient-to-t from-ink via-ink/45 to-transparent p-10 sm:items-center sm:justify-center sm:bg-ink/25 sm:p-0">
      <div className="max-w-xl border border-white/10 bg-card/92 p-8 shadow-2xl backdrop-blur-md">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-signal/90">Educational simulation</p>
        <h1 className="mt-3 font-sans text-4xl font-semibold tracking-tight text-paper">NukeSim</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-body">{PRODUCT_BLURB}</p>
        <p className="mt-4 text-[12px] leading-relaxed text-mute">{DISCLAIMER}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            onClick={() => {
              if (!accepted) accept()
              else setPhase('city-select')
            }}
          >
            I understand — continue
          </Button>
          <Link to="/academy" className="border border-white/15 px-4 py-2 text-sm text-body hover:border-accent/50">
            Open the Academy
          </Link>
          <Link to="/about" className="border border-white/15 px-4 py-2 text-sm text-body hover:border-accent/50">
            About
          </Link>
        </div>
        <label className="mt-4 flex items-center gap-2 font-mono text-[11px] text-mute">
          <input type="checkbox" checked={reduced} onChange={(e) => setReduced(e.target.checked)} />
          Reduced motion — skip flash overlay and camera shake
        </label>
        <p className="mt-3 font-mono text-[10px] text-faint">
          Sources: Glasstone & Dolan 1977 · Fletcher CEX-62.2 · Miller SFSS · DCPA/OTA
        </p>
      </div>
    </div>
  )
}
