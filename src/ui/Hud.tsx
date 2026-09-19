import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSim } from '../state/store'
import { ringByPsi } from '../sim'
import { loadPrefs, savePrefs } from '../state/prefs'
import { formatYield } from './format'
import { cityById } from '../data/cities'
import { munitionLabel } from '../data/munitions'
import { Title } from './Title'
import { CitySelect } from './CitySelect'
import { Bench } from './Bench'
import { Timeline } from './Timeline'
import { Link } from 'react-router-dom'
import { GuidedPanel, MissionChip } from './GuidedPanel'
import { FieldLegend } from './FieldLegend'
import { ErrorBoundary } from './ErrorBoundary'
import type { Phase, Workspace } from '../state/store'
import { BookOpen, Building2, ClipboardList, Cloud, Crosshair, Keyboard, Search, Telescope } from 'lucide-react'
import type { CameraMode } from '../state/store'
import { useHotkeys } from './useHotkeys'

type FieldPanel = 'setup' | 'experience' | 'inspector' | null

// On-demand only, so they stay out of the main bundle.
const ShortcutsOverlay = lazy(() => import('./ShortcutsOverlay').then((m) => ({ default: m.ShortcutsOverlay })))
const Debrief = lazy(() => import('./Debrief').then((m) => ({ default: m.Debrief })))
const ModelDrawer = lazy(() => import('./ModelDrawer').then((m) => ({ default: m.ModelDrawer })))
const Glossary = lazy(() => import('./Glossary').then((m) => ({ default: m.Glossary })))
const Probe = lazy(() => import('./Probe').then((m) => ({ default: m.Probe })))
const ComparePanel = lazy(() => import('./ComparePanel').then((m) => ({ default: m.ComparePanel })))

export function Hud() {
  const phase = useSim((s) => s.phase)
  const report = useSim((s) => s.report)
  const city = cityById(useSim((s) => s.cityId))
  const munitionId = useSim((s) => s.munitionId)
  const workspace = useSim((s) => s.workspace)
  const setModelOpen = useSim((s) => s.setModelOpen)
  const modelOpen = useSim((s) => s.modelOpen)
  const glossaryId = useSim((s) => s.glossaryId)
  const overlays = useSim((s) => s.overlays)
  const probe = useSim((s) => s.probe)
  const mission = useSim((s) => s.mission)
  const playing = useSim((s) => s.playing)
  const simTime = useSim((s) => s.simTime)
  const contextLost = useSim((s) => s.contextLost)
  const helpOpen = useSim((s) => s.helpOpen)
  const [panel, setPanelState] = useState<FieldPanel>('setup')
  const panelMemory = useRef<Partial<Record<Phase, FieldPanel>>>({})
  const setPanel = useCallback((next: FieldPanel) => {
    panelMemory.current[useSim.getState().phase] = next
    setPanelState(next)
  }, [])
  const [hintSeen, setHintSeen] = useState(() => loadPrefs().helpSeen)
  const dismissHint = useCallback(() => {
    setHintSeen(true)
    savePrefs({ helpSeen: true })
  }, [])
  const blast = ringByPsi(report, 5)
  const fieldTag = overlays.blast && blast ? blast.confidence : report.fireballTouchesGround ? 'heuristic' : 'interpolated'
  const cinemaDone = simTime >= 40 || !playing
  const watching = phase === 'detonate' && !cinemaDone
  const inspectReady = phase === 'explore' || phase === 'debrief' || (phase === 'detonate' && cinemaDone)
  const fieldPhase = phase === 'bench' || phase === 'detonate' || phase === 'explore' || phase === 'debrief'
  const debriefing = phase === 'debrief'
  useHotkeys()

  useEffect(() => {
    if (mission?.step === 'predict' || mission?.step.startsWith('observe-')) {
      setPanelState('experience')
      return
    }
    if (phase === 'detonate') {
      setPanelState(null)
      return
    }
    setPanelState(panelMemory.current[phase] ?? (phase === 'bench' ? 'setup' : 'inspector'))
  }, [phase, mission])

  useEffect(() => {
    if (phase === 'explore' && probe) setPanelState('inspector')
  }, [phase, probe])

  useEffect(() => {
    if (helpOpen && !hintSeen) dismissHint()
  }, [helpOpen, hintSeen, dismissHint])

  return (
    <div className={`pointer-events-none absolute inset-0 z-10 flex flex-col ${watching ? 'watch-dim' : ''}`}>
      {fieldPhase && !watching && !debriefing && (
        <a
          className="skip-link"
          href="#setup-controls"
          onClick={(event) => {
            event.preventDefault()
            setPanel('setup')
            requestAnimationFrame(() => document.getElementById('setup-controls')?.focus())
          }}
        >
          Skip to setup controls
        </a>
      )}
      <header className="app-header pointer-events-auto flex items-center justify-between border-b border-white/10 bg-ink/55 px-4 py-2 backdrop-blur-md">
        <div className="flex min-w-0 items-baseline gap-3">
          <Link to="/" className="font-semibold tracking-tight text-paper">
            NukeSim
          </Link>
          <span className="scenario-readout font-mono text-[11px] text-mute">
            {city.name} · {munitionLabel(munitionId, report.yieldKt)} · {formatYield(report.yieldKt)} · HOB {Math.round(report.hobM)} m
          </span>
          <span className="confidence-readout font-mono text-[10px] uppercase tracking-wider text-faint">
            {report.fireballTouchesGround ? 'surface-coupled' : 'airburst'} · {fieldTag}
          </span>
        </div>
        <nav className="top-nav flex items-center gap-3 font-mono text-[11px]">
          <div className="overflow-docs flex items-center gap-3">
            <Link className="text-body hover:text-signal-hot" to="/academy">
              Academy
            </Link>
            <Link className="text-body hover:text-signal-hot" to="/about">
              About
            </Link>
            <button className="text-body hover:text-signal-hot" onClick={() => setModelOpen(true)}>
              Model
            </button>
            <button
              className="flex items-center gap-1.5 text-body hover:text-signal-hot"
              onClick={() => useSim.getState().toggleHelp()}
              aria-label="Keyboard shortcuts"
              aria-keyshortcuts="?"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard aria-hidden="true" size={14} />
              <span className="overflow-docs">Shortcuts</span>
            </button>
          </div>
        </nav>
      </header>

      <main className="flex min-h-0 flex-1">
        {fieldPhase && panel === 'setup' && !watching && !debriefing && (
          <Bench />
        )}
        <div className="relative min-w-0 flex-1">
          {phase === 'title' && <Title />}
          {phase === 'city-select' && <CitySelect />}
          {fieldPhase && (inspectReady || phase === 'bench') && (
            <ToolDock panel={panel} workspace={workspace} onChange={setPanel} debriefing={debriefing} />
          )}
          {fieldPhase && inspectReady && !debriefing && <ViewDock />}
          {fieldPhase && inspectReady && (
            <div className="right-stack pointer-events-none absolute right-4 top-16">
              {panel === 'inspector' && (
                <Suspense fallback={null}>
                  <Probe />
                </Suspense>
              )}
              <FieldLegend />
            </div>
          )}
          {fieldPhase && workspace !== 'explore' && !watching && !debriefing && panel === 'experience' && (
            <div className="experience-panel pointer-events-none absolute left-4 top-4 z-10">
              {workspace === 'learn' ? <GuidedPanel /> : workspace === 'compare' ? (
                <Suspense fallback={null}>
                  <ComparePanel />
                </Suspense>
              ) : null}
            </div>
          )}
          {fieldPhase && workspace === 'learn' && mission && (watching || (inspectReady && panel !== 'experience')) && (
            <div className="pointer-events-none absolute bottom-28 left-4 z-10">
              <MissionChip onOpen={() => setPanel('experience')} />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-4">
            <Timeline compact={watching} />
          </div>
        </div>
        {debriefing && (
          <Suspense fallback={null}>
            <ErrorBoundary label="debrief" renderFallback={() => <DebriefFallback />}>
              <Debrief />
            </ErrorBoundary>
          </Suspense>
        )}
      </main>
      {!hintSeen && phase === 'bench' && !watching && (
        <div className="first-run-hint pointer-events-auto" role="note">
          <p>New here? Press <kbd>?</kbd> any time for keyboard and field controls.</p>
          <button type="button" onClick={dismissHint}>Got it</button>
        </div>
      )}
      {glossaryId && (
        <Suspense fallback={null}>
          <ErrorBoundary label="glossary" renderFallback={() => null}>
            <Glossary />
          </ErrorBoundary>
        </Suspense>
      )}
      {modelOpen && (
        <Suspense fallback={null}>
          <ErrorBoundary label="model" renderFallback={() => null}>
            <ModelDrawer />
          </ErrorBoundary>
        </Suspense>
      )}
      {helpOpen && (
        <Suspense fallback={null}>
          <ErrorBoundary label="shortcuts" renderFallback={() => null}>
            <ShortcutsOverlay />
          </ErrorBoundary>
        </Suspense>
      )}
      {contextLost && (
        <div className="pointer-events-auto absolute inset-x-0 top-16 z-30 flex justify-center px-4">
          <div className="ctx-lost" role="status">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-signal">Graphics context lost</p>
            <p className="mt-1 text-sm text-body">The GPU dropped the 3D view. It restores automatically; reload if it stays blank.</p>
            <button className="mt-3 border border-white/15 px-3 py-1.5 text-sm text-body" onClick={() => window.location.reload()}>
              Reload field
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DebriefFallback() {
  return (
    <div className="debrief-sheet pointer-events-auto">
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-signal">After-action</p>
        <p className="mt-2 text-[14px] text-mute">
          The debrief panel failed to load. The field, timeline, and controls still work.
        </p>
        <button className="mt-4 border border-white/15 px-4 py-2 text-sm" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    </div>
  )
}

function ViewDock() {
  const mode = useSim((s) => s.cameraMode)
  const setMode = useSim((s) => s.setCameraMode)
  const views: Array<[CameraMode, string, typeof Telescope, string]> = [
    ['field', 'Field', Telescope, '1'],
    ['ground-zero', 'Ground zero', Building2, '2'],
    ['cloud', 'Cloud', Cloud, '3'],
  ]
  return (
    <div className="view-tools pointer-events-auto" aria-label="Camera view">
      {views.map(([id, label, Icon, shortcut]) => (
        <button
          key={id}
          aria-pressed={mode === id}
          aria-keyshortcuts={shortcut}
          title={`${label} view (${shortcut})`}
          onClick={() => setMode(id)}
        >
          <Icon aria-hidden="true" size={15} strokeWidth={1.8} />{label}
        </button>
      ))}
    </div>
  )
}

function ToolDock({
  panel,
  workspace,
  onChange,
  debriefing,
}: {
  panel: FieldPanel
  workspace: Workspace
  onChange: (panel: FieldPanel) => void
  debriefing: boolean
}) {
  const toggle = (next: Exclude<FieldPanel, null>) => onChange(panel === next ? null : next)
  return (
    <div className="hud-tools pointer-events-auto" aria-label="Field workflow">
      {!debriefing && (
        <button aria-pressed={panel === 'setup'} onClick={() => toggle('setup')}>
          <ClipboardList aria-hidden="true" size={15} strokeWidth={1.8} />
          Setup
        </button>
      )}
      {!debriefing && workspace !== 'explore' && (
        <button aria-pressed={panel === 'experience'} onClick={() => toggle('experience')}>
          {workspace === 'learn' ? <BookOpen aria-hidden="true" size={15} strokeWidth={1.8} /> : <Crosshair aria-hidden="true" size={15} strokeWidth={1.8} />}
          {workspace === 'learn' ? 'Lesson' : 'Compare'}
        </button>
      )}
      <button aria-pressed={panel === 'inspector'} onClick={() => toggle('inspector')}>
        <Search aria-hidden="true" size={15} strokeWidth={1.8} />
        Inspect
      </button>
    </div>
  )
}
