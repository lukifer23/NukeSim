import { lazy, Suspense, useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Hud } from '../ui/Hud'
import { CompactLanding } from '../ui/CompactLanding'
import { useSim } from '../state/store'
import { decodeScenario } from '../sim/scenario'

const Scene = lazy(() => import('../scene/Scene').then((module) => ({ default: module.Scene })))
const Academy = lazy(() => import('../ui/Academy').then((module) => ({ default: module.Academy })))
const About = lazy(() => import('../ui/About').then((module) => ({ default: module.About })))

export function App() {
  return (
    <Routes>
      <Route path="/academy" element={<Suspense fallback={<PageLoading />}><Academy /></Suspense>} />
      <Route path="/about" element={<Suspense fallback={<PageLoading />}><About /></Suspense>} />
      <Route path="*" element={<Sandbox />} />
    </Routes>
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
    return () => motion.removeEventListener('change', apply)
  }, [])
  if (compact) return <CompactLanding />
  return (
    <div className="relative h-full w-full">
      <Suspense fallback={<PageLoading />}><Scene /></Suspense>
      <Hud />
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
