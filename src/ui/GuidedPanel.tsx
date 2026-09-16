import { LESSONS } from '../data/lessons'
import { MODEL_VERSION } from '../data/model'
import { expectedMissionScenario, missionChangedInputs, missionObservation, missionScenarioMatches } from '../learn/mission'
import { useSim } from '../state/store'
import { formatYield } from './format'
import { useEffect, useRef } from 'react'

const STEP_INDEX = {
  predict: 0,
  'configure-baseline': 1,
  'observe-baseline': 2,
  'configure-comparison': 3,
  'observe-comparison': 4,
  explain: 5,
  complete: 5,
} as const

export function MissionChip({ onOpen }: { onOpen: () => void }) {
  const mission = useSim((s) => s.mission)
  const advance = useSim((s) => s.continueMission)
  const lesson = LESSONS.find((item) => item.id === mission?.lessonId)
  if (!mission || !lesson) return null
  const observation =
    mission.baseline && mission.comparison
      ? missionObservation(lesson, mission.baseline, mission.comparison)
      : null
  let line = 'Watch the field, then open the lesson to continue.'
  let action: string | null = 'Open lesson'
  if (mission.step === 'observe-baseline' && mission.baseline) {
    line = `Baseline recorded · ${mission.baseline.report.fireballTouchesGround ? 'surface-coupled' : 'airburst'}. Next: change one variable.`
    action = 'Prepare comparison'
  } else if (mission.step === 'observe-comparison' && observation) {
    line = observation.headline
    action = 'Explain the result'
  } else if (mission.step === 'configure-baseline' || mission.step === 'configure-comparison') {
    line = 'The target is loaded in Setup. Review it, then run the field.'
    action = 'Open setup'
  } else if (mission.step === 'explain' || mission.step === 'complete') {
    line = observation?.headline ?? 'Mission result is ready.'
    action = null
  }
  const go = () => {
    if (mission.step === 'observe-baseline' || mission.step === 'observe-comparison') advance()
    else onOpen()
  }
  return (
    <div className="lesson-chip pointer-events-auto">
      <p><strong>{lesson.title}.</strong> {line}</p>
      {action && (
        <button type="button" onClick={go}>
          {action}
        </button>
      )}
    </div>
  )
}

export function GuidedPanel() {
  const mission = useSim((s) => s.mission)
  const beginLesson = useSim((s) => s.beginLesson)
  if (!mission) {
    return (
      <section className="guide-card pointer-events-auto">
        <div className="guide-eyebrow">Guided missions</div>
        <h2>Predict, run, explain</h2>
        <p className="guide-hook">Choose one idea. The field will compare what you expected with what the model actually produced.</p>
        <div className="mission-picker">
          {LESSONS.map((lesson) => (
            <button key={lesson.id} onClick={() => beginLesson(lesson.id)}>
              <span>{lesson.minutes} min</span>
              <strong>{lesson.title}</strong>
            </button>
          ))}
        </div>
        <p className="model-stamp">Model {MODEL_VERSION} · educational field, not emergency guidance</p>
      </section>
    )
  }
  return <ActiveMission lessonId={mission.lessonId} />
}

function ActiveMission({ lessonId }: { lessonId: string }) {
  const lesson = LESSONS.find((item) => item.id === lessonId) ?? LESSONS[0]
  const mission = useSim((s) => s.mission)!
  const cityId = useSim((s) => s.cityId)
  const munitionId = useSim((s) => s.munitionId)
  const yieldKt = useSim((s) => s.yieldKt)
  const hobMode = useSim((s) => s.hobMode)
  const customHobM = useSim((s) => s.customHobM)
  const submit = useSim((s) => s.submitMissionPrediction)
  const restore = useSim((s) => s.restoreMissionSetup)
  const advance = useSim((s) => s.continueMission)
  const restart = useSim((s) => s.restartMission)
  const exit = useSim((s) => s.exitMission)
  const stage = mission.step === 'configure-comparison' ? 'comparison' : 'baseline'
  const matches = missionScenarioMatches(lesson, stage, { cityId, munitionId, yieldKt, hobMode, customHobM })
  const expected = expectedMissionScenario(lesson, stage)
  const progress = STEP_INDEX[mission.step]
  const panel = useRef<HTMLElement>(null)
  useEffect(() => { panel.current?.focus() }, [mission.step])

  return (
    <section ref={panel} tabIndex={-1} className="guide-card mission-card pointer-events-auto" aria-live="polite">
      <div className="mission-heading">
        <div><div className="guide-eyebrow">Guided mission · {progress + 1}/6</div><h2>{lesson.title}</h2></div>
        <button className="mission-exit" onClick={exit} aria-label="Exit guided mission">×</button>
      </div>
      <div className="mission-progress" role="progressbar" aria-label="Lesson progress" aria-valuemin={1} aria-valuemax={6} aria-valuenow={progress + 1}>
        {Array.from({ length: 6 }, (_, index) => <i key={index} className={index <= progress ? 'done' : ''} />)}
      </div>

      {mission.step === 'predict' && (
        <>
          <p className="mission-kicker">Predict before the spectacle</p>
          <p className="guide-hook">{lesson.question}</p>
          <div className="guide-options">
            {lesson.options.map((option, index) => <button key={option} onClick={() => submit(index)}>{option}</button>)}
          </div>
          <p className="mission-help">Your prediction is recorded before the run. You will see the explanation after observing both fields.</p>
        </>
      )}

      {(mission.step === 'configure-baseline' || mission.step === 'configure-comparison') && (
        <>
          <p className="mission-kicker">{stage === 'baseline' ? 'Configure the baseline' : 'Change the comparison'}</p>
          <p className="guide-hook">Target: {formatYield(expected.yieldKt)} · {expected.hobMode === 'surface' ? 'surface burst' : expected.hobMode.replaceAll('-', ' ')}.</p>
          <div className={`mission-status ${matches ? 'ready' : 'changed'}`}>
            <strong>{matches ? 'Scenario ready' : 'Scenario changed'}</strong>
            <span>{matches ? 'The target is loaded. Open Setup and run the field.' : 'This run remains free-play unless you restore the lesson target.'}</span>
          </div>
          {!matches && <div className="guide-actions"><button onClick={restore}>Restore lesson setup</button></div>}
          <p className="mission-help">Controls stay unlocked. The mission advances only when the declared scenario actually runs.</p>
        </>
      )}

      {mission.step === 'observe-baseline' && mission.baseline && (
        <>
          <p className="mission-kicker">Observe the baseline</p>
          <p className="guide-hook">{mission.baseline.label} is captured. Watch the flash and shock, then compare it with the changed scenario.</p>
          <div className="mission-capture"><span>Baseline recorded</span><strong>{mission.baseline.report.fireballTouchesGround ? 'surface-coupled' : 'airburst'}</strong></div>
          <div className="guide-actions"><button onClick={advance}>Prepare comparison</button></div>
        </>
      )}

      {mission.step === 'observe-comparison' && mission.baseline && mission.comparison && (() => {
        const observation = missionObservation(lesson, mission.baseline, mission.comparison)
        const changed = missionChangedInputs(mission.baseline, mission.comparison)
        return (
          <>
            <p className="mission-kicker">Observe what changed</p>
            <h3 className="mission-result">{observation.headline}</h3>
            <div className="mission-values">
              <div><span>Baseline</span><strong>{observation.baselineValue}</strong></div>
              <div><span>Comparison</span><strong>{observation.comparisonValue}</strong></div>
            </div>
            <p className="mission-help">Direct change: {changed.join(', ') || 'none'}. Optimized HOB movement is derived, not counted as another direct variable.</p>
            <div className="guide-actions"><button onClick={advance}>Explain the result</button></div>
          </>
        )
      })()}

      {mission.step === 'complete' && (
        <>
          <p className="mission-kicker">Mission complete</p>
          <p className="guide-hook">This result is saved locally for model {MODEL_VERSION}.</p>
          <div className="guide-actions"><button onClick={restart}>Run it again</button><button className="quiet" onClick={exit}>Explore freely</button></div>
        </>
      )}
      <p className="model-stamp">Model {MODEL_VERSION} · educational field, not emergency guidance</p>
    </section>
  )
}
