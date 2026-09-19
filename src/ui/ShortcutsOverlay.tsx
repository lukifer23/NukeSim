import { useSim } from '../state/store'
import { X } from 'lucide-react'

const SHORTCUTS: Array<{ keys: string; action: string }> = [
  { keys: 'Space', action: 'Play or pause the field' },
  { keys: '← / →', action: 'Scrub back / forward (pauses playback)' },
  { keys: '1 / 2 / 3', action: 'Field, ground-zero, and cloud camera' },
  { keys: 'B', action: 'Toggle the 5 psi blast ring' },
  { keys: 'T', action: 'Toggle the 3° thermal ring' },
  { keys: 'R', action: 'Toggle the 500 rem prompt ring' },
  { keys: 'F', action: 'Toggle the fallout field' },
  { keys: 'L', action: 'Toggle the fireball ring' },
  { keys: 'K', action: 'Skip the launch cinematic' },
  { keys: '?', action: 'Open or close this panel' },
  { keys: 'Esc', action: 'Close this panel' },
]

export function ShortcutsOverlay() {
  const open = useSim((s) => s.helpOpen)
  const setOpen = useSim((s) => s.setHelpOpen)
  if (!open) return null
  return (
    <div className="shortcut-scrim" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" onClick={() => setOpen(false)}>
      <div className="shortcut-card" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-signal">Keyboard shortcuts</p>
          <button className="icon-action text-mute hover:text-paper" onClick={() => setOpen(false)} aria-label="Close shortcuts">
            <X aria-hidden="true" size={16} />
          </button>
        </header>
        <dl className="mt-3">
          {SHORTCUTS.map((item) => (
            <div key={item.keys} className="shortcut-row">
              <dt className="font-mono text-[11px] text-paper">{item.keys}</dt>
              <dd className="text-[13px] text-body">{item.action}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
