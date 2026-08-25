import { useSim } from '../state/store'
import { sampleCasualties } from '../sim'
import { formatNum, formatRange, formatYield } from './format'
import { SOURCES } from '../data/sources'
import { cityById } from '../data/cities'
import { LESSONS } from '../data/lessons'
import { MODEL_VERSION } from '../data/model'
import { missionChangedInputs, missionObservation } from '../learn/mission'
import { Link } from 'react-router-dom'

export function Debrief() {
  const s = useSim()
  const stats = sampleCasualties(
    s.yieldKt,
    s.hobResolved(),
    s.city.densityAt,
    s.city.biome.extentM * 0.55,
    s.report.fireballMaxRadiusM,
    s.impactOffset,
  )
  if (s.phase !== 'debrief') return null
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

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="border border-white/10 p-3">
      <dt className="text-[10px] uppercase tracking-wider text-mute">{k}</dt>
      <dd className="mt-1 text-lg text-paper">{v}</dd>
    </div>
  )
}
