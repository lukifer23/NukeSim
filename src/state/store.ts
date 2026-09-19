import { create } from 'zustand'
import { CITIES, cityById, type CityId } from '../data/cities'
import { MUNITIONS, munitionById } from '../data/munitions'
import {
  BurstMode,
  type BurstMode as BurstModeT,
  type EffectsReport,
  type ProbeResult,
  type Shelter,
  computeEffects,
  probeAt,
  resolveHob,
  MIN_LOS_ORIGIN_M,
  type ScenarioInput,
} from '../sim'
import { generateCity } from '../city/generate'
import type { GeneratedCity } from '../city/types'
import type { BuildingClass } from '../sim/types'
import { BuildingClass as BC } from '../sim/types'
import { setAudioMuted, unlockAudio } from '../audio/unlock'
import { saveDraft, type ScenarioDraft } from './draft'
import type { SharedScenario } from '../sim/scenario'
import { LESSONS, resolvedLessonSetup } from '../data/lessons'
import {
  expectedMissionScenario,
  missionScenarioMatches,
  newMissionSession,
  type MissionRunSnapshot,
  type MissionSession,
} from '../learn/mission'
import {
  completeLessonProgress,
  emptyLessonProgress,
  loadLessonProgress,
  saveLessonProgress,
  type LessonProgressV1,
} from '../learn/progress'

export type Phase = 'title' | 'city-select' | 'bench' | 'detonate' | 'explore' | 'debrief'

/** Phases where the field is rendered and its damage state is live. */
export function isLiveField(phase: Phase): boolean {
  return phase === 'detonate' || phase === 'explore' || phase === 'debrief'
}

export type OverlayKey = 'blast' | 'thermal' | 'radiation' | 'fallout' | 'fireball'
export type Workspace = 'learn' | 'explore' | 'compare'
export type CameraMode = 'field' | 'ground-zero' | 'cloud'
export type RenderQuality = 'high' | 'balanced' | 'safe'

export type LastRunGhost = {
  rings: EffectsReport['rings']
  yieldKt: number
  hobM: number
}

export type ScenarioSnapshot = {
  label: string
  input: ScenarioInput
  report: EffectsReport
  cityId: CityId
  hobMode: BurstModeT
}

type SimState = {
  accepted: boolean
  workspace: Workspace
  cameraMode: CameraMode
  renderQuality: RenderQuality
  qualityLocked: boolean
  phase: Phase
  cityId: CityId
  city: GeneratedCity
  munitionId: string
  yieldKt: number
  hobMode: BurstModeT
  customHobM: number
  fissionFraction: number
  windSpeedMps: number
  windDirDeg: number
  visibilityKm: number
  timeOfDay: number
  reducedMotion: boolean
  simTime: number
  playing: boolean
  speed: number
  overlays: Record<OverlayKey, boolean>
  probe: ProbeResult | null
  shelter: Shelter
  hoursOut: number
  buildingClass: BuildingClass
  glossaryId: string | null
  lessonId: string | null
  mission: MissionSession | null
  lessonProgress: LessonProgressV1
  ghost: LastRunGhost | null
  runRevision: number
  comparison: ScenarioSnapshot | null
  modelOpen: boolean
  impactOffset: { x: number; z: number }
  hasRun: boolean
  showGhost: boolean
  muted: boolean
  contextLost: boolean
  report: EffectsReport
  accept: () => void
  setCameraMode: (mode: CameraMode) => void
  setRenderQuality: (quality: RenderQuality) => void
  setPhase: (p: Phase) => void
  setCity: (id: CityId) => void
  setMunition: (id: string) => void
  setYield: (kt: number) => void
  setHobMode: (m: BurstModeT) => void
  setCustomHob: (m: number) => void
  setFission: (f: number) => void
  setWind: (mps: number, deg: number) => void
  setVisibility: (km: number) => void
  setTimeOfDay: (t: number) => void
  toggleOverlay: (k: OverlayKey) => void
  setSimTime: (t: number) => void
  setPlaying: (v: boolean) => void
  setSpeed: (v: number) => void
  setProbeWorld: (x: number, z: number) => void
  clearProbe: () => void
  setShelter: (s: Shelter) => void
  setHoursOut: (h: number) => void
  setGlossary: (id: string | null) => void
  beginLesson: (id: string) => void
  submitMissionPrediction: (index: number) => void
  restoreMissionSetup: () => void
  continueMission: () => void
  completeMission: () => void
  restartMission: () => void
  exitMission: () => void
  resetLessonProgress: () => void
  applyLesson: (id: string) => void
  setReduced: (v: boolean) => void
  setBuildingClass: (c: BuildingClass) => void
  startLaunch: () => void
  skipCinema: () => void
  skipToExplore: () => void
  saveComparison: () => void
  clearComparison: () => void
  setModelOpen: (open: boolean) => void
  loadSharedScenario: (scenario: SharedScenario) => void
  applyDraft: (draft: ScenarioDraft) => void
  setShowGhost: (v: boolean) => void
  setMuted: (v: boolean) => void
  setContextLost: (v: boolean) => void
  helpOpen: boolean
  setHelpOpen: (v: boolean) => void
  toggleHelp: () => void
  scenario: () => ScenarioInput
  hobResolved: () => number
}

type SetSimState = (
  partial: Partial<SimState> | SimState | ((state: SimState) => Partial<SimState> | SimState),
  replace?: false,
) => void

function updatePhysicalScenario(
  set: SetSimState,
  get: () => SimState,
  patch: Partial<SimState>,
  options: { cityChanged?: boolean } = {},
) {
  const before = get()
  const invalidatesRun = before.hasRun || before.phase === 'detonate' || before.phase === 'explore' || before.phase === 'debrief'
  set({
    ...patch,
    playing: invalidatesRun ? false : before.playing,
    simTime: invalidatesRun ? 0 : before.simTime,
    phase: invalidatesRun ? (before.phase === 'city-select' ? 'city-select' : 'bench') : before.phase,
    hasRun: invalidatesRun ? false : before.hasRun,
    probe: null,
    ghost: options.cityChanged
      ? null
      : invalidatesRun && before.hasRun
        ? { rings: before.report.rings, yieldKt: before.report.yieldKt, hobM: before.report.hobM }
        : before.ghost,
    comparison: options.cityChanged ? null : before.comparison,
    runRevision: invalidatesRun ? before.runRevision + 1 : before.runRevision,
    qualityLocked: false,
  })
  set({ report: computeEffects(inputFrom(get())) })
  persistDraft(get())
}

function cityFor(id: CityId): GeneratedCity {
  return generateCity(cityById(id))
}

/** Persist the current physical scenario so a reload resumes the setup. */
function persistDraft(s: {
  cityId: CityId
  munitionId: string
  yieldKt: number
  hobMode: BurstModeT
  customHobM: number
  fissionFraction: number
  windSpeedMps: number
  windDirDeg: number
  visibilityKm: number
  timeOfDay: number
}): void {
  saveDraft({
    schemaVersion: 1,
    cityId: s.cityId,
    munitionId: s.munitionId,
    yieldKt: s.yieldKt,
    hobMode: s.hobMode,
    customHobM: s.customHobM,
    fissionFraction: s.fissionFraction,
    windSpeedMps: s.windSpeedMps,
    windDirDeg: s.windDirDeg,
    visibilityKm: s.visibilityKm,
    timeOfDay: s.timeOfDay,
  })
}

function inputFrom(s: {
  yieldKt: number
  hobMode: BurstModeT
  customHobM: number
  fissionFraction: number
  windSpeedMps: number
  windDirDeg: number
  visibilityKm: number
}): ScenarioInput {
  const hobM = resolveHob(s.yieldKt, s.hobMode, s.customHobM, s.visibilityKm)
  return {
    yieldKt: s.yieldKt,
    hobM,
    fissionFraction: s.fissionFraction,
    windSpeedMps: s.windSpeedMps,
    windDirDeg: s.windDirDeg,
    visibilityKm: s.visibilityKm,
  }
}

const initialCity = cityFor(CITIES[0].id)
const initialMunition = MUNITIONS[0]
const initialSlice = {
  yieldKt: initialMunition.yieldKt,
  hobMode: BurstMode.OptimizeBlast as BurstModeT,
  customHobM: 580,
  fissionFraction: initialMunition.fissionFraction,
  windSpeedMps: CITIES[0].windDefaultMps,
  windDirDeg: CITIES[0].windDefaultDeg,
  visibilityKm: CITIES[0].visibilityKm,
}

export const useSim = create<SimState>((set, get) => ({
  accepted: false,
  workspace: 'explore',
  cameraMode: 'field',
  renderQuality: 'high',
  qualityLocked: false,
  phase: 'title',
  cityId: CITIES[0].id,
  city: initialCity,
  munitionId: initialMunition.id,
  ...initialSlice,
  timeOfDay: 0.6,
  reducedMotion: false,
  simTime: 0,
  playing: false,
  speed: 1,
  overlays: { blast: true, thermal: false, radiation: false, fallout: true, fireball: true },
  probe: null,
  shelter: 'open',
  hoursOut: 24,
  buildingClass: BC.Masonry,
  glossaryId: null,
  lessonId: null,
  mission: null,
  lessonProgress: loadLessonProgress(),
  ghost: null,
  runRevision: 0,
  comparison: null,
  modelOpen: false,
  impactOffset: { ...initialCity.gz },
  hasRun: false,
  showGhost: true,
  muted: false,
  contextLost: false,
  helpOpen: false,
  report: computeEffects(inputFrom(initialSlice)),

  accept: () => set({ accepted: true, phase: 'city-select' }),
  setCameraMode: (cameraMode) => set({ cameraMode }),
  setRenderQuality: (renderQuality) => {
    if (get().qualityLocked) return
    set({ renderQuality })
  },
  setPhase: (phase) => set({ phase }),
  setCity: (id) => {
    const biome = cityById(id)
    const city = cityFor(id)
    updatePhysicalScenario(set, get, {
      cityId: id,
      city,
      visibilityKm: biome.visibilityKm,
      windSpeedMps: biome.windDefaultMps,
      windDirDeg: biome.windDefaultDeg,
      impactOffset: { ...city.gz },
    }, { cityChanged: true })
  },
  setMunition: (id) => {
    const m = munitionById(id)
    updatePhysicalScenario(set, get, {
      munitionId: id,
      yieldKt: m.yieldKt,
      hobMode: m.defaultHobMode,
      customHobM: m.defaultHobM ?? get().customHobM,
      fissionFraction: m.fissionFraction,
    })
  },
  setYield: (kt) => updatePhysicalScenario(set, get, { yieldKt: kt }),
  setHobMode: (m) => updatePhysicalScenario(set, get, { hobMode: m }),
  setCustomHob: (m) => updatePhysicalScenario(set, get, { customHobM: m, hobMode: BurstMode.Custom }),
  setFission: (f) => updatePhysicalScenario(set, get, { fissionFraction: f }),
  setWind: (mps, deg) => updatePhysicalScenario(set, get, { windSpeedMps: mps, windDirDeg: deg }),
  setVisibility: (km) => updatePhysicalScenario(set, get, { visibilityKm: km }),
  setTimeOfDay: (t) => {
    set({ timeOfDay: t })
    persistDraft(get())
  },
  toggleOverlay: (k) => set((s) => ({ overlays: { ...s.overlays, [k]: !s.overlays[k] } })),
  setSimTime: (t) => set({ simTime: t }),
  setPlaying: (v) => set({ playing: v }),
  setSpeed: (v) => set({ speed: v }),
  setProbeWorld: (x, z) => {
    const s = get()
    const hob = resolveHob(s.yieldKt, s.hobMode, s.customHobM, s.visibilityKm)
    const wx = x + s.impactOffset.x
    const wz = z + s.impactOffset.z
    const yT = s.city.heightAt(wx, wz) + 4
    const losClear = s.city.lineOfSight(s.impactOffset.x, Math.max(hob, MIN_LOS_ORIGIN_M), s.impactOffset.z, wx, yT, wz)
    set({
      probe: probeAt(inputFrom(s), x, z, {
        shelter: s.shelter,
        hoursOut: s.hoursOut,
        buildingClass: s.buildingClass,
        losClear,
      }),
    })
  },
  clearProbe: () => set({ probe: null }),
  setShelter: (shelter) => {
    set({ shelter })
    const s = get()
    if (s.probe) s.setProbeWorld(s.probe.x, s.probe.z)
  },
  setHoursOut: (hoursOut) => {
    set({ hoursOut })
    const s = get()
    if (s.probe) s.setProbeWorld(s.probe.x, s.probe.z)
  },
  setGlossary: (glossaryId) => set({ glossaryId }),
  beginLesson: (id) => {
    const lesson = LESSONS.find((item) => item.id === id)
    if (!lesson) return
    get().applyLesson(id)
    const promptLesson = lesson.observation.kind === 'prompt-vs-blast'
    const falloutLesson = lesson.observation.kind === 'blast-fallout' || lesson.observation.kind === 'fallout-switch'
    set({
      lessonId: id,
      mission: newMissionSession(id),
      workspace: 'learn',
      phase: 'bench',
      comparison: null,
      overlays: { blast: true, thermal: false, radiation: promptLesson, fallout: falloutLesson, fireball: true },
    })
  },
  submitMissionPrediction: (index) => {
    const mission = get().mission
    if (!mission || mission.step !== 'predict') return
    set({ mission: { ...mission, predictionIndex: index, step: 'configure-baseline' }, cameraMode: 'field' })
  },
  restoreMissionSetup: () => {
    const mission = get().mission
    const lesson = LESSONS.find((item) => item.id === mission?.lessonId)
    if (!mission || !lesson) return
    const comparisonStage = mission.step === 'configure-comparison' || mission.step === 'observe-comparison'
    if (!comparisonStage) {
      get().applyLesson(lesson.id)
      set({ workspace: 'learn', phase: 'bench' })
      return
    }
    get().applyLesson(lesson.id)
    if (mission.baseline) {
      set({
        comparison: {
          label: mission.baseline.label,
          input: mission.baseline.input,
          report: mission.baseline.report,
          cityId: mission.baseline.cityId,
          hobMode: mission.baseline.hobMode,
        },
      })
    }
    const expected = expectedMissionScenario(lesson, 'comparison')
    get().setYield(expected.yieldKt)
    get().setHobMode(expected.hobMode)
    if (expected.hobMode === BurstMode.Custom) get().setCustomHob(expected.customHobM)
    set({ workspace: 'learn', phase: 'bench' })
  },
  continueMission: () => {
    const mission = get().mission
    if (!mission) return
    if (mission.step === 'observe-baseline') {
      set({ mission: { ...mission, step: 'configure-comparison' } })
      get().restoreMissionSetup()
    } else if (mission.step === 'observe-comparison') {
      set({ mission: { ...mission, step: 'explain' }, phase: 'debrief', playing: false })
    }
  },
  completeMission: () => {
    const s = get()
    const mission = s.mission
    const lesson = LESSONS.find((item) => item.id === mission?.lessonId)
    if (!mission || !lesson || mission.step !== 'explain') return
    const progress = completeLessonProgress(s.lessonProgress, lesson.id, mission.predictionIndex === lesson.answer)
    saveLessonProgress(progress)
    set({ lessonProgress: progress, mission: { ...mission, step: 'complete' } })
  },
  restartMission: () => {
    const id = get().mission?.lessonId ?? get().lessonId
    if (id) get().beginLesson(id)
  },
  exitMission: () => set({ mission: null, lessonId: null, workspace: 'explore', phase: get().hasRun ? 'explore' : 'bench' }),
  resetLessonProgress: () => {
    const progress = emptyLessonProgress()
    saveLessonProgress(progress)
    set({ lessonProgress: progress })
  },
  applyLesson: (id) => {
    const lesson = LESSONS.find((item) => item.id === id)
    if (!lesson) return
    const setup = resolvedLessonSetup(lesson)
    get().setCity(setup.cityId as CityId)
    get().setMunition(setup.munitionId)
    get().setYield(setup.yieldKt)
    get().setHobMode(setup.hobMode)
    if (setup.hobM != null) get().setCustomHob(setup.hobM)
    set({ lessonId: id, accepted: true })
  },
  setReduced: (reducedMotion) => set({ reducedMotion }),
  setBuildingClass: (buildingClass) => {
    set({ buildingClass })
    const s = get()
    if (s.probe) s.setProbeWorld(s.probe.x, s.probe.z)
  },
  startLaunch: () => {
    const s = get()
    // Create/resume the audio context inside the launch gesture; the scene
    // schedules the blast once the detonation phase mounts.
    unlockAudio()
    const report = computeEffects(inputFrom(s))
    const lesson = LESSONS.find((item) => item.id === s.mission?.lessonId)
    let mission = s.mission
    if (mission && lesson) {
      const stage = mission.step === 'configure-baseline' ? 'baseline' : mission.step === 'configure-comparison' ? 'comparison' : null
      const scenario = { cityId: s.cityId, munitionId: s.munitionId, yieldKt: s.yieldKt, hobMode: s.hobMode, customHobM: s.customHobM }
      if (stage && missionScenarioMatches(lesson, stage, scenario)) {
        const snapshot: MissionRunSnapshot = {
          label: `${Math.round(report.yieldKt)} kt · ${Math.round(report.hobM)} m HOB`,
          cityId: s.cityId,
          hobMode: s.hobMode,
          input: inputFrom(s),
          report,
        }
        mission = stage === 'baseline'
          ? { ...mission, baseline: snapshot, comparison: null, step: 'observe-baseline' }
          : { ...mission, comparison: snapshot, step: 'observe-comparison' }
      }
    }
    set({
      phase: 'detonate',
      cameraMode: 'field',
      qualityLocked: true,
      simTime: 0,
      playing: true,
      hasRun: true,
      report,
      probe: null,
      mission,
      // A fresh run must reset the scene's per-instance damage counters, even
      // when the scenario inputs did not change.
      runRevision: s.runRevision + 1,
    })
  },
  skipCinema: () => {
    const s = get()
    if (s.phase !== 'detonate') return
    // Jump past the scripted detonation sequence without invalidating the run.
    set({ simTime: Math.max(s.simTime, 40) })
  },
  skipToExplore: () => {
    const s = get()
    if (!s.hasRun) return
    set({ phase: 'explore', playing: false, simTime: Math.max(s.simTime, 120) })
  },
  setShowGhost: (showGhost) => set({ showGhost }),
  setMuted: (muted) => {
    setAudioMuted(muted)
    set({ muted })
  },
  setContextLost: (contextLost) => set({ contextLost }),
  setHelpOpen: (helpOpen) => set({ helpOpen }),
  toggleHelp: () => set((s) => ({ helpOpen: !s.helpOpen })),
  saveComparison: () => {
    const s = get()
    const input = inputFrom(s)
    set({
      comparison: {
        label: `${Math.round(input.yieldKt)} kt · ${Math.round(input.hobM)} m HOB`,
        input,
        report: computeEffects(input),
        cityId: s.cityId,
        hobMode: s.hobMode,
      },
      workspace: 'compare',
    })
  },
  clearComparison: () => set({ comparison: null }),
  setModelOpen: (modelOpen) => set({ modelOpen }),
  loadSharedScenario: (scenario) => {
    const city = cityFor(scenario.cityId)
    const slice = {
      yieldKt: scenario.yieldKt,
      hobMode: BurstMode.Custom as BurstModeT,
      customHobM: scenario.hobM,
      fissionFraction: scenario.fissionFraction,
      windSpeedMps: scenario.windSpeedMps,
      windDirDeg: scenario.windDirDeg,
      visibilityKm: scenario.visibilityKm,
    }
    const report = computeEffects(inputFrom(slice))
    set({
      accepted: true,
      cityId: scenario.cityId,
      city,
      munitionId: scenario.munitionId ?? get().munitionId,
      ...slice,
      impactOffset: { ...city.gz },
      hasRun: true,
      simTime: 120,
      playing: false,
      phase: 'explore',
      cameraMode: 'field',
      qualityLocked: true,
      workspace: 'explore',
      mission: null,
      probe: null,
      comparison: null,
      ghost: null,
      runRevision: get().runRevision + 1,
      report,
    })
    persistDraft(get())
  },
  applyDraft: (draft) => {
    const city = cityFor(draft.cityId)
    set({
      cityId: draft.cityId,
      city,
      munitionId: draft.munitionId,
      yieldKt: draft.yieldKt,
      hobMode: draft.hobMode,
      customHobM: draft.customHobM,
      fissionFraction: draft.fissionFraction,
      windSpeedMps: draft.windSpeedMps,
      windDirDeg: draft.windDirDeg,
      visibilityKm: draft.visibilityKm,
      timeOfDay: draft.timeOfDay,
      impactOffset: { ...city.gz },
    })
    set({ report: computeEffects(inputFrom(get())) })
  },
  scenario: () => inputFrom(get()),
  hobResolved: () => resolveHob(get().yieldKt, get().hobMode, get().customHobM, get().visibilityKm),
}))
