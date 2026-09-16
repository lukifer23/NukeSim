import { BurstMode, type BurstMode as BurstModeT } from '../sim/types'

export type Lesson = {
  id: string
  title: string
  minutes: number
  hook: string
  setup: {
    cityId: string
    munitionId: string
    yieldKt: number
    hobMode: 'surface' | 'optimize-5psi' | 'optimize-thermal' | 'custom'
    hobM?: number
  }
  compare?: {
    yieldKt?: number
    hobMode?: 'surface' | 'optimize-5psi' | 'custom'
    hobM?: number
  }
  beats: string[]
  question: string
  options: string[]
  answer: number
  explain: string
  observation: {
    kind: 'blast-scale' | 'blast-fallout' | 'fallout-switch' | 'prompt-vs-blast'
    takeaway: string
  }
}

export function hobModeFromLesson(mode: string): BurstModeT {
  if (mode === 'surface') return BurstMode.Surface
  if (mode === 'optimize-5psi') return BurstMode.OptimizeBlast
  if (mode === 'optimize-thermal') return BurstMode.OptimizeThermal
  return BurstMode.Custom
}

export function resolvedLessonSetup(lesson: Lesson) {
  return {
    cityId: lesson.setup.cityId,
    munitionId: lesson.setup.munitionId,
    yieldKt: lesson.setup.yieldKt,
    hobMode: hobModeFromLesson(lesson.setup.hobMode),
    hobM: lesson.setup.hobM ?? null,
  }
}

export const LESSONS: Lesson[] = [
  {
    id: 'cube-root',
    title: 'Cube-root day',
    minutes: 5,
    hook: 'A 1,000× bomb is not a 1,000× city-killer. Watch the radius.',
    setup: { cityId: 'harbor', munitionId: 'gravity-b61', yieldKt: 1, hobMode: 'optimize-5psi' },
    compare: { yieldKt: 1000 },
    beats: [
      'Run 1 kt, then compare it directly with 1,000 kt on Port Meridian.',
      'The 5 psi ring grows by about 2.15× each time yield jumps 10×.',
      'Area — people affected — grows faster (W^{2/3}), which is still not linear in yield.',
    ],
    question: 'If you multiply yield by 1,000, the 5 psi radius multiplies by about…',
    options: ['1,000×', '100×', '10×', '2×'],
    answer: 2,
    explain: 'Volume holds the energy, so radius scales as W^{1/3}. 1000^{1/3} = 10.',
    observation: {
      kind: 'blast-scale',
      takeaway: 'A thousandfold increase in yield produces roughly ten times the severe-blast radius, not a thousand times.',
    },
  },
  {
    id: 'knee',
    title: 'The knee',
    minutes: 5,
    hook: 'Same bomb, two heights. The ground range is not monotonic.',
    setup: { cityId: 'harbor', munitionId: 'icbm-mm3', yieldKt: 300, hobMode: 'surface' },
    compare: { hobMode: 'optimize-5psi' },
    beats: [
      'Detonate 300 kt on the surface. Note the 5 psi ring and the fallout plume.',
      'Re-run optimized for 5 psi. The ring grows; local fallout vanishes.',
      'That bulge is Mach reflection — the reason airbursts exist.',
    ],
    question: 'Which burst produces significant local fallout?',
    options: ['The optimized airburst', 'The surface burst', 'Both equally', 'Neither'],
    answer: 1,
    explain: 'Local fallout requires the fireball to touch the ground and lift dirt.',
    observation: {
      kind: 'blast-fallout',
      takeaway: 'The optimized airburst expands the 5 psi ground range while clearing the ground and switching local fallout off.',
    },
  },
  {
    id: 'switch',
    title: 'The fallout switch',
    minutes: 5,
    hook: 'One boolean dominates residual radiation: does the fireball touch?',
    setup: { cityId: 'dune', munitionId: 'castle-bravo', yieldKt: 15000, hobMode: 'surface' },
    compare: { hobMode: 'optimize-5psi' },
    beats: [
      'Castle Bravo on the sand. The Miller plume is the point.',
      'Raise it until the fireball clears. The plume dies.',
      'This model is a scaling cartoon (H+1), not a weather forecast.',
    ],
    question: 'An airburst whose fireball does not touch the ground produces…',
    options: [
      'The same local fallout, just higher',
      'Negligible local fallout',
      'No radioactivity of any kind',
      'More fallout because the cloud is larger',
    ],
    answer: 1,
    explain: 'Fine fission products stay aloft until they have decayed. Local acute fallout is a surface-burst story.',
    observation: {
      kind: 'fallout-switch',
      takeaway: 'In this model, raising the fireball clear of the ground removes the acute local fallout field.',
    },
  },
  {
    id: 'small-dirty',
    title: 'Small and dirty vs large and high',
    minutes: 5,
    hook: '10 kt on the ground vs 300 kt in the air are different *kinds* of events.',
    setup: { cityId: 'foundry', munitionId: 'gravity-b61', yieldKt: 10, hobMode: 'surface' },
    compare: { yieldKt: 300, hobMode: 'optimize-5psi' },
    beats: [
      '10 kt surface: prompt 500 rem can outrange 5 psi, and fallout is on.',
      '300 kt airburst: blast and thermal dominate; prompt sits inside the rubble.',
      'Tactical yield is not “less nuclear.” It is a different mix of effects.',
    ],
    question: 'At which yield is prompt radiation more likely to outrange severe blast?',
    options: ['300 kt airburst', '1 Mt airburst', '10 kt surface', 'They always match'],
    answer: 2,
    explain: 'Prompt dose falls exponentially in air. Blast only as a cube root. Low yield lets radiation win.',
    observation: {
      kind: 'prompt-vs-blast',
      takeaway: 'Prompt radiation can outrange severe blast at low yield, while blast dominates at larger optimized airburst yields.',
    },
  },
]
