import { Link } from 'react-router-dom'
import { DISCLAIMER, EMP_NOTE, PRODUCT_BLURB, SOURCES } from '../data/sources'
import { useSim } from '../state/store'
import { MODEL_VERSION, MODEL_NOTES } from '../data/model'

export function About() {
  const reduced = useSim((s) => s.reducedMotion)
  const setReduced = useSim((s) => s.setReduced)

  return (
    <div className="min-h-screen overflow-auto bg-[#0c0d0f] text-[#d7d2c8]">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <h1 className="text-lg text-[#f2eee6]">About NukeSim</h1>
        <Link to="/" className="font-mono text-[11px] text-amber-400">
          ← sandbox
        </Link>
      </header>
      <main className="mx-auto max-w-2xl space-y-8 px-6 py-10">
        <p className="text-[15px] leading-relaxed text-[#c8c2b6]">{PRODUCT_BLURB}</p>
        <p className="text-[13px] leading-relaxed text-[#8a857a]">{DISCLAIMER}</p>

        <section>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-teal-400">What the numbers mean</h2>
          <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-[#c8c2b6]">
            <li>
              <strong className="text-[#f2eee6]">5 psi</strong> — usual “most buildings collapse” contour. Radius scales as the cube
              root of yield.
            </li>
            <li>
              <strong className="text-[#f2eee6]">Fireball touches ground</strong> — local fallout on. Airburst: negligible local
              fallout.
            </li>
            <li>
              <strong className="text-[#f2eee6]">H+1 fallout</strong> — Miller SFSS scaling cartoon, not a weather forecast.
            </li>
            <li>
              <strong className="text-[#f2eee6]">Fatalities / injuries</strong> — DCPA/OTA vs blast overpressure only. Fire and
              fallout are not in the headline.
            </li>
          </ul>
          <p className="mt-3 text-[12px] text-[#6a665c]">
            The full contract lives in the repo as docs/MODEL.md. Cities: docs/CITIES.md.
          </p>
        </section>

        <section>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-teal-400">Model contract</h2>
          <p className="mt-3 text-[13px] leading-relaxed text-[#c8c2b6]">
            {MODEL_VERSION}. Each effect is tagged with a confidence level, its source family, and what the field excludes.
            Use the <strong className="text-[#f2eee6]">Model</strong> button in the sandbox to inspect those limits before reading a number as a prediction.
          </p>
          <div className="mt-3 grid gap-2">
            {Object.entries(MODEL_NOTES).map(([kind, note]) => (
              <div key={kind} className="border border-white/10 p-3 text-[12px]">
                <span className="text-[#f2eee6]">{note.title}</span><span className="ml-2 font-mono text-[10px] text-teal-400">{note.confidence}</span>
                <p className="mt-1 text-[#8a857a]">{note.excludes}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-teal-400">EMP</h2>
          <p className="mt-3 text-[13px] leading-relaxed text-[#c8c2b6]">{EMP_NOTE}</p>
        </section>

        <section>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-teal-400">Sources</h2>
          <ul className="mt-3 space-y-3 text-[12px] text-[#8a857a]">
            {SOURCES.map((s) => (
              <li key={s.id}>
                <span className="text-[#c8c2b6]">{s.cite}</span> — {s.used}
              </li>
            ))}
          </ul>
        </section>

        <section className="flex items-center justify-between border border-white/10 px-4 py-3">
          <div>
            <p className="text-sm text-[#f2eee6]">Reduced motion</p>
            <p className="text-[12px] text-[#8a857a]">Skip the flash overlay and camera shake. Rings and aftermath stay.</p>
          </div>
          <button
            onClick={() => setReduced(!reduced)}
            className={`px-3 py-1.5 font-mono text-[11px] ${reduced ? 'bg-amber-500 text-black' : 'bg-white/10 text-[#d7d2c8]'}`}
          >
            {reduced ? 'On' : 'Off'}
          </button>
        </section>
      </main>
    </div>
  )
}
