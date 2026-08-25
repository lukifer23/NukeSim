import { GLOSSARY } from '../data/glossary'
import { useSim } from '../state/store'

export function Glossary() {
  const id = useSim((s) => s.glossaryId)
  const set = useSim((s) => s.setGlossary)
  const entry = GLOSSARY.find((g) => g.id === id)
  if (!entry) return null
  return (
    <div className="glossary-card pointer-events-auto absolute bottom-32 left-4 z-20 w-[min(380px,calc(100vw-2rem))] border border-signal/30 bg-card p-4 shadow-xl md:left-[360px]">
      <div className="flex justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-signal">Glossary</p>
        <button className="text-mute" onClick={() => set(null)}>
          ×
        </button>
      </div>
      <h3 className="mt-1 text-lg text-paper">{entry.term}</h3>
      <p className="mt-1 text-[13px] text-body">{entry.short}</p>
      <p className="mt-2 text-[12px] leading-relaxed text-mute">{entry.body}</p>
      <p className="mt-2 font-mono text-[10px] text-faint">{entry.source}</p>
    </div>
  )
}
