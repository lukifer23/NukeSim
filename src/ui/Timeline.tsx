import { formatTime } from '../sim/units'
import { MAX_SIM_TIME_S, playbackRate } from '../sim/timeline'
import { useSim } from '../state/store'
import { fieldMoment } from './fieldMoment'
import { Slider } from './controls'
import { Activity, CircleStop, Gauge, Pause, Play, RotateCcw } from 'lucide-react'

const MARKS = [
  { t: 0.001, label: '1 ms' },
  { t: 1, label: '1 s' },
  { t: 10, label: '10 s' },
  { t: 60, label: '1 min' },
  { t: 3600, label: '1 h' },
  { t: MAX_SIM_TIME_S, label: '48 h' },
]

function toSlider(t: number): number {
  const lo = Math.log(1e-4)
  const hi = Math.log(MAX_SIM_TIME_S)
  return (Math.log(Math.max(t, 1e-4)) - lo) / (hi - lo)
}
function fromSlider(u: number): number {
  const lo = Math.log(1e-4)
  const hi = Math.log(MAX_SIM_TIME_S)
  return Math.exp(lo + (hi - lo) * u)
}

export function Timeline({ compact = false }: { compact?: boolean }) {
  const simTime = useSim((s) => s.simTime)
  const playing = useSim((s) => s.playing)
  const setSimTime = useSim((s) => s.setSimTime)
  const setPlaying = useSim((s) => s.setPlaying)
  const skipToExplore = useSim((s) => s.skipToExplore)
  const setPhase = useSim((s) => s.setPhase)
  const hasRun = useSim((s) => s.hasRun)
  const speed = useSim((s) => s.speed)
  const setSpeed = useSim((s) => s.setSpeed)
  const phase = useSim((s) => s.phase)
  const skipCinema = useSim((s) => s.skipCinema)
  const falloutActive = useSim((s) => s.report.fireballTouchesGround)
  if (phase === 'title' || phase === 'city-select') return null
  const moment = fieldMoment(simTime, falloutActive)
  const effectiveRate = playbackRate(simTime, speed)

  return (
    <div className={`timeline-panel ${compact ? 'compact' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p key={moment.label} className="timeline-caption timeline-fade">{moment.label}</p>
          {!compact && <p key={moment.detail} className="timeline-detail timeline-fade">{moment.detail}</p>}
        </div>
        <span className="shrink-0 font-mono text-[12px] text-signal-hot">{formatTime(simTime)}</span>
      </div>
      {!compact && (
        <>
          <Slider
            label="Scrub"
            ariaLabel="Simulation time"
            min={0}
            max={1}
            step={0.0005}
            value={toSlider(simTime)}
            onChange={(u) => {
              setSimTime(fromSlider(u))
              setPlaying(false)
            }}
            display={formatTime(simTime)}
            showValue={false}
          />
          <div className="mt-1 flex justify-between font-mono text-[9px] text-faint">
            {MARKS.map((m) => (
              <button key={m.t} onClick={() => setSimTime(m.t)} className="hover:text-signal-hot">
                {m.label}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="timeline-toolbar">
        <button className="timeline-primary" onClick={() => setPlaying(!playing)}>
          {playing ? <Pause aria-hidden="true" size={15} fill="currentColor" /> : <Play aria-hidden="true" size={15} fill="currentColor" />}
          {playing ? 'Pause' : 'Play'}
        </button>
        {compact && (
          <button className="timeline-jump" onClick={skipCinema} title="Skip the launch sequence (K)">
            Skip
          </button>
        )}
        {!compact && (
          <>
            <button className="timeline-jump" onClick={() => setSimTime(0)}>
              <RotateCcw aria-hidden="true" size={14} /> Flash
            </button>
            <button className="timeline-jump" onClick={() => setSimTime(4)}>
              <Activity aria-hidden="true" size={14} /> Shock
            </button>
            <button className="timeline-jump" onClick={() => setSimTime(90)}>
              <CircleStop aria-hidden="true" size={14} /> Stabilize
            </button>
          </>
        )}
        <button className="px-2 py-1 text-xs text-accent" onClick={skipToExplore} disabled={!hasRun}>
          Explore
        </button>
        <button
          className="px-2 py-1 text-xs text-body"
          onClick={() => hasRun && setPhase('debrief')}
          disabled={!hasRun}
        >
          Debrief
        </button>
        <span className="ml-auto flex items-center gap-1 font-mono text-[11px] text-mute" title={`Effective rate ${effectiveRate}× (accelerates as the timeline advances)`}>
          <Gauge aria-hidden="true" size={14} /> {effectiveRate < 10 ? effectiveRate.toFixed(1) : Math.round(effectiveRate)}×
        </span>
        {[0.5, 1, 3].map((v) => (
          <button
            key={v}
            onClick={() => setSpeed(v)}
            aria-pressed={speed === v}
            aria-label={`Base speed ${v} times`}
            className={`px-1.5 font-mono text-[10px] ${speed === v ? 'text-signal-hot' : 'text-mute'}`}
          >
            {v}×
          </button>
        ))}
      </div>
    </div>
  )
}
