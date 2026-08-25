import { MUNITIONS, YIELD_NOTCHES } from '../data/munitions'
import { BurstMode } from '../sim/types'
import { useSim } from '../state/store'
import { formatRange, formatYield, logYieldFromSlider, sliderFromLogYield } from './format'
import { cityById } from '../data/cities'
import { ScenarioShare } from './ScenarioShare'
import { LESSONS } from '../data/lessons'
import { missionScenarioMatches } from '../learn/mission'
import { Chip, Label, Slider } from './controls'
import type { Workspace } from '../state/store'

export function Bench({
  intent,
  onIntent,
  intentEnabled,
}: {
  intent: Workspace
  onIntent: (workspace: Workspace) => void
  intentEnabled: boolean
}) {
  const s = useSim()
  const m = MUNITIONS.find((x) => x.id === s.munitionId) ?? MUNITIONS[0]
  const city = cityById(s.cityId)
  const slider = sliderFromLogYield(s.yieldKt)
  const lesson = LESSONS.find((item) => item.id === s.mission?.lessonId)
  const missionStage = s.mission?.step === 'configure-comparison' ? 'comparison' : 'baseline'
  const missionConfiguring = s.mission?.step === 'configure-baseline' || s.mission?.step === 'configure-comparison'
  const missionReady = Boolean(lesson && missionConfiguring && missionScenarioMatches(lesson, missionStage, {
    cityId: s.cityId, munitionId: s.munitionId, yieldKt: s.yieldKt, hobMode: s.hobMode, customHobM: s.customHobM,
  }))
  const focusYield = Boolean(lesson && (lesson.observation.kind === 'blast-scale' || lesson.observation.kind === 'prompt-vs-blast'))
  const focusHob = Boolean(lesson && (lesson.observation.kind === 'blast-fallout' || lesson.observation.kind === 'fallout-switch'))

  return (
    <aside className="scenario-bench pointer-events-auto flex h-full w-[300px] shrink-0 flex-col border-r border-white/10 bg-panel/82 backdrop-blur-md">
      <header className="shrink-0 border-b border-white/10 px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/80">Scenario bench</p>
        <h2 className="text-lg text-paper">{city.name}</h2>
        <p className="font-mono text-[11px] text-mute">{city.climate}</p>
        <p className="ns-label mt-3">Working as</p>
        <div className="workspace-tabs mt-1" aria-label="What you are doing">
          {([
            ['learn', 'Learn'],
            ['explore', 'Investigate'],
            ['compare', 'Compare'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              className={intent === id ? 'active' : ''}
              aria-pressed={intent === id}
              disabled={!intentEnabled}
              onClick={() => onIntent(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {lesson && missionConfiguring && (
        <div className={`mission-bench-status ${missionReady ? 'ready' : 'changed'}`}>
          <span>{missionReady ? 'Lesson target ready' : 'Free-play scenario'}</span>
          <strong>{missionReady ? 'Run field to record this step.' : 'Restore the target from the Lesson panel to advance.'}</strong>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
      <section className="space-y-2 px-4 py-3">
        <Label tip="cep">Delivery context</Label>
        <div className="flex flex-wrap gap-1">
          {MUNITIONS.filter((x) => x.kind !== 'historical').map((x) => (
            <Chip key={x.id} on={s.munitionId === x.id} onClick={() => s.setMunition(x.id)}>
              {x.name}
            </Chip>
          ))}
        </div>
        <Label tip="yield">Historical reference cases</Label>
        <div className="flex flex-wrap gap-1">
          {MUNITIONS.filter((x) => x.kind === 'historical').map((x) => (
            <Chip key={x.id} on={s.munitionId === x.id} onClick={() => s.setMunition(x.id)}>
              {x.name}
            </Chip>
          ))}
        </div>
        <p className="text-[11px] leading-snug text-mute">{m.blurb}</p>
        <p className="font-mono text-[10px] text-accent/80">{m.warningLabel} · effects begin at detonation</p>
      </section>

      <section className={`space-y-2 border-t border-white/10 px-4 py-3 ${missionConfiguring && focusYield ? 'mission-control-focus' : ''}`}>
        <Slider
          label="Yield"
          tip="yield"
          ariaLabel="Yield"
          min={0}
          max={1}
          step={0.001}
          value={slider}
          onChange={(t) => s.setYield(logYieldFromSlider(t))}
          display={formatYield(s.yieldKt)}
          caption="Radius grows as the cube root, not linearly."
        />
        <div className="flex flex-wrap gap-1">
          {YIELD_NOTCHES.map((n) => (
            <button
              key={n.kt}
              onClick={() => s.setYield(n.kt)}
              className="font-mono text-[9px] text-mute hover:text-signal-hot"
            >
              {n.label}
            </button>
          ))}
        </div>
      </section>

      <section className={`space-y-2 border-t border-white/10 px-4 py-3 ${missionConfiguring && focusHob ? 'mission-control-focus' : ''}`}>
        <Label tip="hob">Height of burst</Label>
        <div className="grid grid-cols-2 gap-1">
          <Chip on={s.hobMode === BurstMode.Surface} onClick={() => s.setHobMode(BurstMode.Surface)}>
            Surface
          </Chip>
          <Chip on={s.hobMode === BurstMode.OptimizeBlast} onClick={() => s.setHobMode(BurstMode.OptimizeBlast)}>
            Optimize 5 psi
          </Chip>
          <Chip on={s.hobMode === BurstMode.OptimizeThermal} onClick={() => s.setHobMode(BurstMode.OptimizeThermal)}>
            Optimize thermal
          </Chip>
          <Chip on={s.hobMode === BurstMode.Custom} onClick={() => s.setHobMode(BurstMode.Custom)}>
            Custom
          </Chip>
        </div>
        <Slider
          label="Altitude"
          tip="hob"
          ariaLabel="Height of burst"
          min={0}
          max={Math.max(4000, s.report.optimumHob5PsiM * 3)}
          step={10}
          value={s.hobMode === BurstMode.Custom ? s.customHobM : s.hobResolved()}
          onChange={(v) => s.setCustomHob(v)}
          display={`${Math.round(s.hobResolved())} m`}
          caption={s.report.fireballTouchesGround ? 'Fireball touches ground — local fallout ON' : 'Fireball clear of ground — local fallout off'}
        />
      </section>

      <section className="space-y-2 border-t border-white/10 px-4 py-3">
        <Slider
          label="Fission fraction"
          tip="fission-fraction"
          ariaLabel="Fission fraction"
          accent="accent"
          min={0.03}
          max={1}
          step={0.01}
          value={s.fissionFraction}
          onChange={(v) => s.setFission(v)}
          display={`${Math.round(s.fissionFraction * 100)}%`}
          caption="Fallout and prompt source term."
        />
        <Slider
          label="Wind"
          ariaLabel="Wind speed"
          accent="accent"
          min={0}
          max={25}
          step={0.5}
          value={s.windSpeedMps}
          onChange={(v) => s.setWind(v, s.windDirDeg)}
          display={`${s.windSpeedMps.toFixed(1)} m/s`}
        />
        <Slider
          label="Wind direction"
          ariaLabel="Wind direction"
          accent="accent"
          min={0}
          max={359}
          step={1}
          value={s.windDirDeg}
          onChange={(v) => s.setWind(s.windSpeedMps, v)}
          display={`${s.windDirDeg}°`}
        />
        <Slider
          label="Visibility"
          ariaLabel="Meteorological visibility"
          accent="accent"
          min={2}
          max={30}
          step={0.5}
          value={s.visibilityKm}
          onChange={(v) => s.setVisibility(v)}
          display={`${s.visibilityKm.toFixed(1)} km`}
          caption="Thermal transmittance through the air."
        />
      </section>

      <section className="space-y-2 border-t border-white/10 px-4 py-3">
        <Slider
          label="Time of day"
          ariaLabel="Time of day"
          min={0}
          max={1}
          step={0.01}
          value={s.timeOfDay}
          onChange={(v) => s.setTimeOfDay(v)}
          display={timeOfDayLabel(s.timeOfDay)}
        />
        <div className="flex justify-between font-mono text-[10px] text-mute">
          <span>night</span>
          <span>dawn</span>
          <span>noon</span>
          <span>dusk</span>
        </div>
      </section>
      </div>
      <section className="shrink-0 border-t border-white/10 px-4 py-3">
        <MiniRings />
        <div className="mt-3 flex gap-2">
          <button
            className="flex-1 bg-signal py-2 text-sm font-medium text-ink hover:bg-signal-hot"
            onClick={() => {
              s.startLaunch()
            }}
          >
            {missionReady ? (missionStage === 'baseline' ? 'Run baseline' : 'Run comparison') : 'Run field'}
          </button>
          <button className="border border-white/15 px-3 py-2 text-sm text-body" onClick={() => s.setPhase('city-select')}>
            City
          </button>
          <ScenarioShare />
        </div>
        <div className="mt-2 flex gap-3 font-mono text-[10px] text-mute">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={s.showGhost} onChange={(e) => s.setShowGhost(e.target.checked)} />
            last run
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={s.muted} onChange={(e) => s.setMuted(e.target.checked)} />
            mute
          </label>
        </div>
        <p className="mt-2 text-[11px] leading-snug text-mute">{m.teaching}</p>
      </section>
    </aside>
  )
}

function timeOfDayLabel(t: number): string {
  if (t < 0.18) return 'night'
  if (t < 0.34) return 'dawn'
  if (t < 0.72) return 'day'
  return 'dusk'
}

function MiniRings() {
  const report = useSim((s) => s.report)
  const key = report.rings.filter((r) => r.kind === 'blast' && (r.psi === 5 || r.psi === 1 || r.psi === 20))
  return (
    <div className="space-y-1 font-mono text-[10px] text-body">
      {key.map((r) => (
        <div key={r.id} className="flex justify-between">
          <span className="text-mute">{r.label.split('—')[0]}</span>
          <span>{formatRange(r.radiusM)}</span>
        </div>
      ))}
      <div className="flex justify-between">
        <span className="text-mute">Fireball</span>
        <span>{formatRange(report.fireballMaxRadiusM)}</span>
      </div>
    </div>
  )
}
