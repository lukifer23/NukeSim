import { useEffect } from 'react'
import { useSim } from '../state/store'
import { MAX_SIM_TIME_S } from '../sim/timeline'

function scrub(t: number, mul: number): number {
  return Math.min(MAX_SIM_TIME_S, Math.max(1e-4, t * mul))
}

/** Global playback and inspection shortcuts. */
export function useHotkeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const s = useSim.getState()
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault()
        s.toggleHelp()
        return
      }
      if (e.key === 'Escape') {
        if (s.helpOpen) s.setHelpOpen(false)
        return
      }
      if (s.helpOpen) return
      switch (e.key) {
        case ' ':
        case 'Spacebar':
          if (s.phase === 'detonate' || s.phase === 'explore') {
            e.preventDefault()
            s.setPlaying(!s.playing)
          }
          break
        case 'ArrowLeft':
          if (s.hasRun) {
            e.preventDefault()
            s.setPlaying(false)
            s.setSimTime(scrub(s.simTime, 0.8))
          }
          break
        case 'ArrowRight':
          if (s.hasRun) {
            e.preventDefault()
            s.setPlaying(false)
            s.setSimTime(scrub(s.simTime, 1.25))
          }
          break
        case '1':
          if (s.hasRun) s.setCameraMode('field')
          break
        case '2':
          if (s.hasRun) s.setCameraMode('ground-zero')
          break
        case '3':
          if (s.hasRun) s.setCameraMode('cloud')
          break
        case 'b':
          s.toggleOverlay('blast')
          break
        case 't':
          s.toggleOverlay('thermal')
          break
        case 'r':
          s.toggleOverlay('radiation')
          break
        case 'f':
          s.toggleOverlay('fallout')
          break
        case 'l':
          s.toggleOverlay('fireball')
          break
        case 'k':
          s.skipCinema()
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
