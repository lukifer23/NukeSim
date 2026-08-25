import { MODEL_NOTES, MODEL_VERSION } from '../data/model'
import { useSim } from '../state/store'
import { useEffect, useRef } from 'react'

export function ModelDrawer() {
  const open = useSim((s) => s.modelOpen)
  const setOpen = useSim((s) => s.setModelOpen)
  const closeButton = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (!open) return
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusFrame = requestAnimationFrame(() => closeButton.current?.focus())
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      cancelAnimationFrame(focusFrame)
      window.removeEventListener('keydown', closeOnEscape)
      const trigger = returnFocus.current
      requestAnimationFrame(() => trigger?.focus())
    }
  }, [open, setOpen])
  if (!open) return null
  return (
    <aside className="model-drawer pointer-events-auto" role="dialog" aria-labelledby="model-drawer-title">
      <header><div><span className="guide-eyebrow">Model card</span><h2 id="model-drawer-title">What this field can and cannot say</h2></div><button ref={closeButton} onClick={() => setOpen(false)} aria-label="Close model card">×</button></header>
      <p className="model-intro">{MODEL_VERSION}. Values show defensible educational relationships, not a local forecast, targeting analysis, or emergency instruction.</p>
      <div className="model-list">
        {Object.entries(MODEL_NOTES).map(([kind, note]) => (
          <article key={kind}>
            <div className="model-title"><h3>{note.title}</h3><span>{note.confidence}</span></div>
            <p><b>Confidence:</b> {note.uncertainty}</p>
            <p><b>Changes with:</b> {note.changesWith}</p>
            <p><b>Not modeled:</b> {note.excludes}</p>
            <small>{note.source}</small>
          </article>
        ))}
      </div>
    </aside>
  )
}
