import { lazy, Suspense, useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Hud } from '../ui/Hud'
import { CompactLanding } from '../ui/CompactLanding'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import { useSim } from '../state/store'
import { loadDraft } from '../state/draft'
import { decodeScenario } from '../sim/scenario'

const Scene = lazy(() => import('../scene/Scene').then((module) => ({ default: module.Scene })))
const Academy = lazy(() => import('../ui/Academy').then((module) => ({ default: module.Academy })))
const About = lazy(() => import('../ui/About').then((module) => ({ default: module.About })))

export function App() {
  return (
    <ErrorBoundary label="app">
      <Routes>
        <Route path="/academy" element={<Suspense fallback={<PageLoading />}><Academy /></Suspense>} />
        <Route path="/about" element={<Suspense fallback={<PageLoading />}><About /></Suspense>} />
        <Route path="*" element={<Sandbox />} />
      </Routes>
    </ErrorBoundary>
  )
}

function Sandbox() {
  const compact = useCompactSandbox()
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => useSim.getState().setReduced(motion.matches)
    apply()
    motion.addEventListener('change', apply)
    const shared = decodeScenario(window.location.search)
    if (shared) useSim.getState().loadSharedScenario(shared)
    else {
      // Resume the last setup, but keep the safety gate: the draft restores
      // controls only, so the disclaimer still stands between a reload and a run.
      const draft = loadDraft()
      if (draft) useSim.getState().applyDraft(draft)
    }
    return () => motion.removeEventListener('change', apply)
  }, [])
  if (compact) return <CompactLanding />
  return (
    <div className="relative h-full w-full">
      <ErrorBoundary label="field" renderFallback={(reset) => <FieldFallback onRetry={reset} />}>
        <Suspense fallback={<PageLoading />}><Scene /></Suspense>
      </ErrorBoundary>
      <Hud />
    </div>
  )
}

function FieldFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-ink p-6">
      <div className="max-w-md border border-white/10 bg-card p-6 text-body">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-signal">3D field unavailable</p>
        <h1 className="mt-2 text-xl text-paper">The learning field did not start.</h1>
        <p className="mt-3 text-sm leading-relaxed text-mute">
          The scenario controls, model card, comparison, and debrief still work without the walkable city.
        </p>
        <div className="mt-4 flex gap-2">
          <button className="bg-signal px-3 py-2 text-sm text-ink" onClick={onRetry}>Try again</button>
          <button className="border border-white/15 px-3 py-2 text-sm text-body" onClick={() => window.location.reload()}>Reload</button>
        </div>
      </div>
    </div>
  )
}

function useCompactSandbox() {
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const update = () => setCompact(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return compact
}

function PageLoading() {
  return <div className="flex h-full w-full items-center justify-center bg-[#0c0d0f] font-mono text-[11px] uppercase tracking-[0.2em] text-[#8a857a]">Loading field</div>
}
