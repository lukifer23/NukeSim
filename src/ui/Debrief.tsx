import { useState } from 'react'
import { useSim } from '../state/store'
import { sampleCasualties } from '../sim'
import { encodeScenario } from '../sim/scenario'
import { formatNum, formatRange, formatYield } from './format'
import { SOURCES } from '../data/sources'
import { cityById } from '../data/cities'
import { LESSONS } from '../data/lessons'
import { MODEL_VERSION } from '../data/model'
import { missionChangedInputs, missionObservation } from '../learn/mission'
import { Link } from 'react-router-dom'

export function Debrief() {
  const s = useSim()
  if (s.phase !== 'debrief') return null
  const stats = sampleCasualties(
    s.yieldKt,
    s.hobResolved(),
    s.city.densityAt,
    s.city.biome.extentM * 0.55,
    s.report.fireballMaxRadiusM,
    s.impactOffset,
  )
  const city = cityById(s.cityId)
  const lesson = LESSONS.find((item) => item.id === s.mission?.lessonId)
  if (lesson && s.mission?.baseline && s.mission.comparison && (s.mission.step === 'explain' || s.mission.step === 'complete')) {
    return <MissionDebrief />
  }
  const ring5 = s.report.rings.find((r) => r.psi === 5)
  const ring1 = s.report.rings.find((r) => r.psi === 1)

  return (
    <div className="debrief-sheet pointer-events-auto">
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-signal">After-action</p>
        <h2 className="mt-2 text-3xl text-paper">
          {formatYield(s.yieldKt)} over {city.name}
        </h2>
        <p className="mt-2 text-[14px] text-mute">
          Blast fatalities and injuries below use DCPA/OTA overpressure fractions only. Fire, fallout, and
          hospital collapse are not in the headline number.
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-4 font-mono text-sm">
          <Stat k="5 psi radius" v={formatRange(ring5?.radiusM ?? 0)} />
          <Stat k="1 psi radius" v={formatRange(ring1?.radiusM ?? 0)} />
          <Stat k="Fireball" v={formatRange(s.report.fireballMaxRadiusM)} />
          <Stat k="HOB" v={`${Math.round(s.report.hobM)} m`} />
          <Stat k="Ambient pop sampled" v={formatNum(stats.population)} />
          <Stat k="Est. fatalities (blast)" v={formatNum(stats.fatalities)} />
          <Stat k="Est. injuries (blast)" v={formatNum(stats.injuries)} />
          <Stat k="Local fallout" v={s.report.fireballTouchesGround ? 'yes (Miller SFSS)' : 'negligible'} />
          <Stat k="Fire (not in headline)" v="excluded — heuristic only" />
          <Stat k="Fallout deaths (not in headline)" v="excluded — H+1 cartoon" />
        </dl>
        <div className="mt-8 space-y-2 text-[12px] text-faint">
          {SOURCES.map((src) => (
            <p key={src.id}>
              <span className="text-mute">{src.cite}</span> — {src.used}
            </p>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <button className="bg-signal px-4 py-2 text-sm text-ink" onClick={() => s.setPhase('bench')}>
            Change one variable
          </button>
          <button className="border border-white/15 px-4 py-2 text-sm" onClick={() => s.setPhase('explore')}>
            Walk the wreckage
          </button>
          <CopySummary text={summary(s, stats, ring5?.radiusM, ring1?.radiusM)} />
        </div>
      </div>
    </div>
  )
}

function MissionDebrief() {
  const s = useSim()
  const mission = s.mission!
  const lesson = LESSONS.find((item) => item.id === mission.lessonId)!
  const baseline = mission.baseline!
  const comparison = mission.comparison!
  const observation = missionObservation(lesson, baseline, comparison)
  const changed = missionChangedInputs(baseline, comparison)
  const correct = mission.predictionIndex === lesson.answer
  const complete = mission.step === 'complete'
  const next = LESSONS[(LESSONS.indexOf(lesson) + 1) % LESSONS.length]
  return (
    <div className="mission-debrief debrief-sheet mission pointer-events-auto">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-teal-400">Mission result · {complete ? 'complete' : 'explain'}</p>
        <h2>{observation.headline}</h2>
        <p className="mission-debrief-lead">{observation.detail}</p>
        <div className="mission-debrief-grid">
          <article><span>Baseline</span><strong>{observation.baselineValue}</strong><small>{baseline.label}</small></article>
          <article><span>Comparison</span><strong>{observation.comparisonValue}</strong><small>{comparison.label}</small></article>
        </div>
        <section className="mission-prediction">
          <span>Your prediction</span>
          <strong>{lesson.options[mission.predictionIndex ?? 0]}</strong>
          <b className={correct ? 'correct' : 'revised'}>{correct ? 'Matched the model' : 'Revise it with the observed result'}</b>
          <p>{lesson.explain}</p>
        </section>
        <section className="mission-boundary">
          <span>What changed directly</span><strong>{changed.join(', ') || 'none'}</strong>
          <p>Optimized height of burst may move as a consequence of yield. That derived movement is shown separately, not presented as an independent cause.</p>
          <small>Model {MODEL_VERSION}. These are educational scaling relationships, not a local forecast.</small>
        </section>
        {!complete ? (
          <div className="mission-debrief-actions">
            <button onClick={s.completeMission}>Complete mission</button>
            <button onClick={s.restartMission}>Retry from prediction</button>
          </div>
        ) : (
          <div className="mission-debrief-actions">
            <button onClick={() => s.beginLesson(next.id)}>Next: {next.title}</button>
            <button onClick={s.restartMission}>Run again</button>
            <Link to="/academy">Academy progress</Link>
            <button onClick={s.exitMission}>Explore freely</button>
          </div>
        )}
      </div>
    </div>
  )
}

function CopySummary({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className="border border-white/15 px-4 py-2 text-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 2200)
        } catch {
          // Clipboard access can be denied; the field still works.
        }
      }}
    >
      {copied ? 'Copied' : 'Copy results'}
    </button>
  )
}

function summary(
  s: ReturnType<typeof useSim.getState>,
  stats: { fatalities: number; injuries: number; population: number },
  ring5?: number,
  ring1?: number,
): string {
  const url = new URL(window.location.href)
  url.search = encodeScenario({ ...s.scenario(), cityId: s.cityId, munitionId: s.munitionId })
  const prompt = s.report.rings.find((ring) => ring.id === 'rad-500')
  return [
    `NukeSim — ${formatYield(s.report.yieldKt)} over ${cityById(s.cityId).name}`,
    `HOB ${Math.round(s.report.hobM)} m · ${s.report.fireballTouchesGround ? 'surface-coupled' : 'airburst'}`,
    `5 psi ${formatRange(ring5 ?? 0)} · 1 psi ${formatRange(ring1 ?? 0)} · fireball ${formatRange(s.report.fireballMaxRadiusM)}`,
    `Prompt 500 rem ${formatRange(prompt?.radiusM ?? 0)} · local fallout ${s.report.fireballTouchesGround ? 'yes' : 'negligible'}`,
    `Est. blast fatalities ${formatNum(stats.fatalities)} · injuries ${formatNum(stats.injuries)}`,
    `Model ${MODEL_VERSION}. Educational scaling laws, not a forecast or targeting tool.`,
    url.toString(),
  ].join('\n')
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="border border-white/10 p-3">
      <dt className="text-[10px] uppercase tracking-wider text-mute">{k}</dt>
      <dd className="mt-1 text-lg text-paper">{v}</dd>
    </div>
  )
}
