import { useEffect, useState } from 'react'
import { useSim } from '../state/store'
import { formatYield } from './format'
import { cityById } from '../data/cities'
import { munitionLabel } from '../data/munitions'
import { Title } from './Title'
import { CitySelect } from './CitySelect'
import { Bench } from './Bench'
import { Timeline } from './Timeline'
import { Probe } from './Probe'
import { Glossary } from './Glossary'
import { Link } from 'react-router-dom'
import { GuidedPanel, MissionChip } from './GuidedPanel'
import { ComparePanel } from './ComparePanel'
import { ModelDrawer } from './ModelDrawer'
import { FieldLegend } from './FieldLegend'
import { Debrief } from './Debrief'
import type { Workspace } from '../state/store'
import { BookOpen, Building2, ClipboardList, Cloud, Crosshair, Search, Telescope } from 'lucide-react'
import type { CameraMode } from '../state/store'

type FieldPanel = 'setup' | 'experience' | 'inspector' | null

export function Hud() {
  const phase = useSim((s) => s.phase)
  const report = useSim((s) => s.report)
  const city = cityById(useSim((s) => s.cityId))
  const munitionId = useSim((s) => s.munitionId)
  const workspace = useSim((s) => s.workspace)
  const setModelOpen = useSim((s) => s.setModelOpen)
  const overlays = useSim((s) => s.overlays)
  const probe = useSim((s) => s.probe)
  const mission = useSim((s) => s.mission)
  const playing = useSim((s) => s.playing)
  const simTime = useSim((s) => s.simTime)
  const [panel, setPanel] = useState<FieldPanel>('setup')
  const blast = report.rings.find((r) => r.psi === 5)
  const fieldTag = overlays.blast && blast ? blast.confidence : report.fireballTouchesGround ? 'heuristic' : 'interpolated'
  const cinemaDone = simTime >= 28 || !playing
  const watching = phase === 'detonate' && !cinemaDone
  const inspectReady = phase === 'explore' || phase === 'debrief' || (phase === 'detonate' && cinemaDone)
  const fieldPhase = phase === 'bench' || phase === 'detonate' || phase === 'explore' || phase === 'debrief'
  const debriefing = phase === 'debrief'

  useEffect(() => {
    if (phase === 'bench') {
      if (mission?.step === 'predict') setPanel('experience')
      else setPanel('setup')
    }
    else if (phase === 'detonate') setPanel(null)
    else if (phase === 'explore' && mission && mission.step.startsWith('observe-')) setPanel('experience')
    else if (phase === 'explore' || phase === 'debrief') setPanel('inspector')
  }, [phase, mission])

  useEffect(() => {
    if (phase === 'explore' && probe) setPanel('inspector')
  }, [phase, probe])

  return (
    <div className={`pointer-events-none absolute inset-0 z-10 flex flex-col ${watching ? 'watch-dim' : ''}`}>
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
          </div>
        </nav>
      </header>

      <div className="flex min-h-0 flex-1">
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
          {fieldPhase && panel === 'inspector' && inspectReady && (
            <div className="right-stack pointer-events-none absolute right-4 top-4">
              <Probe />
              <FieldLegend />
            </div>
          )}
          {fieldPhase && workspace !== 'explore' && !watching && !debriefing && panel === 'experience' && (
            <div className="experience-panel pointer-events-none absolute left-4 top-4 z-10">
              {workspace === 'learn' ? <GuidedPanel /> : workspace === 'compare' ? <ComparePanel /> : null}
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
        {debriefing && <Debrief />}
      </div>
      <Glossary />
      <ModelDrawer />
    </div>
  )
}

function ViewDock() {
  const mode = useSim((s) => s.cameraMode)
  const setMode = useSim((s) => s.setCameraMode)
  const views: Array<[CameraMode, string, typeof Telescope]> = [
    ['field', 'Field', Telescope],
    ['ground-zero', 'Ground zero', Building2],
    ['cloud', 'Cloud', Cloud],
  ]
  return (
    <div className="view-tools pointer-events-auto" aria-label="Camera view">
      {views.map(([id, label, Icon]) => (
        <button key={id} aria-pressed={mode === id} onClick={() => setMode(id)}>
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
