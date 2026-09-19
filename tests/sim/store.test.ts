import { beforeEach, describe, expect, it } from 'vitest'
import { useSim } from '../../src/state/store'

describe('simulation run state', () => {
  beforeEach(() => {
    useSim.setState(useSim.getInitialState(), true)
    useSim.setState({ muted: true })
  })

  it('defaults to free investigation with a readable overlay set', () => {
    const s = useSim.getState()
    expect(s.workspace).toBe('explore')
    expect(s.overlays).toEqual({ blast: true, thermal: false, radiation: false, fallout: true, fireball: true })
    expect(s.cameraMode).toBe('field')
    expect(s.renderQuality).toBe('high')
  })

  it('keeps camera intent stable while scrubbing and locks quality for a run', () => {
    const s = useSim.getState()
    s.accept()
    useSim.getState().setPhase('bench')
    useSim.getState().setCameraMode('cloud')
    useSim.getState().setSimTime(90)
    expect(useSim.getState().cameraMode).toBe('cloud')
    useSim.getState().setRenderQuality('balanced')
    useSim.getState().startLaunch()
    expect(useSim.getState().cameraMode).toBe('field')
    expect(useSim.getState().qualityLocked).toBe(true)
    useSim.getState().setRenderQuality('safe')
    expect(useSim.getState().renderQuality).toBe('balanced')
    useSim.getState().setYield(1000)
    expect(useSim.getState().qualityLocked).toBe(false)
  })

  it('bumps the field revision on every launch so a re-run resets the scene', () => {
    const s = useSim.getState()
    s.accept()
    useSim.getState().setPhase('bench')
    const before = useSim.getState().runRevision
    useSim.getState().startLaunch()
    const afterFirst = useSim.getState().runRevision
    expect(afterFirst).toBe(before + 1)
    useSim.getState().startLaunch()
    expect(useSim.getState().runRevision).toBe(afterFirst + 1)
  })

  it('invalidates a completed run and clears a stale probe when physics inputs change', () => {
    const s = useSim.getState()
    s.accept()
    useSim.getState().setPhase('bench')
    useSim.getState().startLaunch()
    useSim.getState().setProbeWorld(300, 0)
    const revision = useSim.getState().runRevision

    useSim.getState().setYield(1000)
    const next = useSim.getState()

    expect(next.phase).toBe('bench')
    expect(next.playing).toBe(false)
    expect(next.simTime).toBe(0)
    expect(next.hasRun).toBe(false)
    expect(next.probe).toBeNull()
    expect(next.report.yieldKt).toBe(1000)
    expect(next.runRevision).toBe(revision + 1)
  })

  it('shows the previous completed run as the ghost on the next launch', () => {
    const s = useSim.getState()
    s.accept()
    useSim.getState().setPhase('bench')
    useSim.getState().startLaunch()
    expect(useSim.getState().ghost).toBeNull()

    useSim.getState().setYield(1000)
    expect(useSim.getState().ghost?.yieldKt).toBe(10)
    expect(useSim.getState().hasRun).toBe(false)
    useSim.getState().startLaunch()

    expect(useSim.getState().ghost?.yieldKt).toBe(10)
    expect(useSim.getState().report.yieldKt).toBe(1000)

    useSim.getState().setCity('saddle')
    expect(useSim.getState().ghost).toBeNull()
  })

  it('clears city-specific probe and comparison state on city changes', () => {
    const s = useSim.getState()
    s.accept()
    useSim.getState().setPhase('bench')
    useSim.getState().setProbeWorld(300, 0)
    useSim.getState().saveComparison()
    expect(useSim.getState().comparison).not.toBeNull()

    useSim.getState().setCity('saddle')

    expect(useSim.getState().probe).toBeNull()
    expect(useSim.getState().comparison).toBeNull()
    expect(useSim.getState().ghost).toBeNull()
  })

  it('keeps the city picker open while replacing a completed run city', () => {
    const s = useSim.getState()
    s.accept()
    useSim.getState().setPhase('bench')
    useSim.getState().startLaunch()
    useSim.getState().setPhase('city-select')

    useSim.getState().setCity('dune')

    expect(useSim.getState().phase).toBe('city-select')
    expect(useSim.getState().hasRun).toBe(false)
  })

  it('advances a mission only when the declared scenarios actually run', () => {
    useSim.getState().beginLesson('cube-root')
    useSim.getState().submitMissionPrediction(2)
    useSim.getState().setYield(2)
    useSim.getState().startLaunch()
    expect(useSim.getState().mission?.step).toBe('configure-baseline')

    useSim.getState().restoreMissionSetup()
    useSim.getState().startLaunch()
    expect(useSim.getState().mission?.step).toBe('observe-baseline')
    expect(useSim.getState().mission?.baseline?.report.yieldKt).toBe(1)

    useSim.getState().continueMission()
    expect(useSim.getState().mission?.step).toBe('configure-comparison')
    expect(useSim.getState().yieldKt).toBe(1000)
    useSim.getState().startLaunch()
    expect(useSim.getState().mission?.step).toBe('observe-comparison')
    expect(useSim.getState().mission?.comparison?.report.yieldKt).toBe(1000)

    useSim.getState().continueMission()
    expect(useSim.getState().phase).toBe('debrief')
    expect(useSim.getState().mission?.step).toBe('explain')
    useSim.getState().completeMission()
    expect(useSim.getState().mission?.step).toBe('complete')
    expect(useSim.getState().lessonProgress.records['cube-root']?.predictionCorrect).toBe(true)
  })

  it('shared scenarios leave no active guided mission', () => {
    useSim.getState().beginLesson('knee')
    useSim.getState().loadSharedScenario({
      cityId: 'dune', yieldKt: 15, hobM: 0, fissionFraction: 1, windSpeedMps: 4, windDirDeg: 180, visibilityKm: 12,
    })
    expect(useSim.getState().mission).toBeNull()
  })

  it('covers free-play controls, probe recomputation, and comparison lifecycle', () => {
    const s = useSim.getState()
    s.accept()
    useSim.getState().setPhase('bench')
    useSim.getState().setMunition('little-boy')
    useSim.getState().setCustomHob(300)
    useSim.getState().setFission(0.5)
    useSim.getState().setWind(8, 220)
    useSim.getState().setVisibility(20)
    useSim.getState().setTimeOfDay(0.2)
    useSim.getState().toggleOverlay('thermal')
    useSim.getState().setSimTime(5)
    useSim.getState().setPlaying(true)
    useSim.getState().setSpeed(3)
    useSim.getState().setReduced(true)
    useSim.getState().setModelOpen(true)
    useSim.getState().setShowGhost(false)
    useSim.getState().setMuted(false)
    expect(useSim.getState().scenario()).toMatchObject({ yieldKt: 15, hobM: 300, fissionFraction: 0.5 })
    expect(useSim.getState().hobResolved()).toBe(300)

    useSim.getState().setProbeWorld(200, 100)
    const firstProbe = useSim.getState().probe
    expect(firstProbe).not.toBeNull()
    useSim.getState().setShelter('basement')
    useSim.getState().setHoursOut(48)
    useSim.getState().setBuildingClass('wood')
    expect(useSim.getState().probe).not.toBe(firstProbe)
    useSim.getState().clearProbe()
    expect(useSim.getState().probe).toBeNull()

    useSim.getState().saveComparison()
    expect(useSim.getState().comparison).not.toBeNull()
    useSim.getState().clearComparison()
    expect(useSim.getState().comparison).toBeNull()
  })

  it('handles lesson escape, restart, comparison helper, and guarded actions', () => {
    useSim.getState().skipToExplore()
    expect(useSim.getState().phase).toBe('title')
    useSim.getState().beginLesson('missing')
    expect(useSim.getState().mission).toBeNull()
    useSim.getState().beginLesson('knee')
    useSim.getState().submitMissionPrediction(1)
    useSim.getState().submitMissionPrediction(2)
    expect(useSim.getState().mission?.predictionIndex).toBe(1)
    useSim.getState().restartMission()
    expect(useSim.getState().mission?.step).toBe('predict')
    useSim.getState().exitMission()
    expect(useSim.getState().mission).toBeNull()
    useSim.getState().resetLessonProgress()
    expect(useSim.getState().lessonProgress.records).toEqual({})
  })

  it('restores the free-play defaults with resetScenario', () => {
    const defaults = useSim.getInitialState()
    const s = useSim.getState()
    s.accept()
    s.setCity('dune')
    s.setMunition('icbm-mm3')
    s.setYield(300)
    s.setWind(12, 200)
    s.toggleOverlay('thermal')
    s.startLaunch()
    expect(useSim.getState().hasRun).toBe(true)

    useSim.getState().resetScenario()
    const after = useSim.getState()
    expect(after.cityId).toBe(defaults.cityId)
    expect(after.munitionId).toBe(defaults.munitionId)
    expect(after.yieldKt).toBe(defaults.yieldKt)
    expect(after.hobMode).toBe(defaults.hobMode)
    expect(after.customHobM).toBe(defaults.customHobM)
    expect(after.windSpeedMps).toBe(defaults.windSpeedMps)
    expect(after.windDirDeg).toBe(defaults.windDirDeg)
    expect(after.visibilityKm).toBe(defaults.visibilityKm)
    expect(after.timeOfDay).toBe(defaults.timeOfDay)
    expect(after.overlays).toEqual(defaults.overlays)
    expect(after.hasRun).toBe(false)
    expect(after.phase).toBe('bench')
    expect(after.simTime).toBe(0)
    expect(after.report.yieldKt).toBe(defaults.yieldKt)
  })
})
