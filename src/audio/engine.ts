import { blastSound } from './design'
import { scheduleRumble } from './rumble'
import { masterGain, unlockAudio } from './unlock'

let noise: AudioBuffer | null = null
let sources: AudioScheduledSourceNode[] = []

function noiseBuffer(context: AudioContext): AudioBuffer {
  if (!noise) {
    const length = Math.floor(context.sampleRate)
    const buffer = context.createBuffer(1, length, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
    noise = buffer
  }
  return noise
}

function track(node: AudioScheduledSourceNode): void {
  sources.push(node)
  if (sources.length > 32) sources.splice(0, sources.length - 32)
}

/** Stops any sound still scheduled from a previous run. */
export function cancelBlast(): void {
  for (const node of sources) {
    try {
      node.stop()
    } catch {
      // Already stopped or never started.
    }
  }
  sources = []
}

/**
 * Schedules the full blast soundscape so its peak lands on `arrivalS`, the
 * shock's travel time from ground zero to the observer.
 */
export function armBlast(arrivalS: number, yieldKt: number): void {
  const context = unlockAudio()
  const bus = masterGain()
  if (!context || !bus) return
  cancelBlast()

  const sound = blastSound(yieldKt)
  const t0 = context.currentTime + Math.max(0.02, arrivalS)

  const crack = context.createBufferSource()
  crack.buffer = noiseBuffer(context)
  const crackFilter = context.createBiquadFilter()
  crackFilter.type = 'highpass'
  crackFilter.frequency.value = 1600
  const crackGain = context.createGain()
  crackGain.gain.setValueAtTime(0.0001, t0)
  crackGain.gain.exponentialRampToValueAtTime(sound.crackGain, t0 + 0.006)
  crackGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16)
  crack.connect(crackFilter).connect(crackGain).connect(bus)
  crack.start(t0)
  crack.stop(t0 + 0.2)
  track(crack)

  const whoosh = context.createBufferSource()
  whoosh.buffer = noiseBuffer(context)
  const whooshFilter = context.createBiquadFilter()
  whooshFilter.type = 'bandpass'
  whooshFilter.Q.value = 0.8
  whooshFilter.frequency.setValueAtTime(sound.whooshF0Hz, t0)
  whooshFilter.frequency.exponentialRampToValueAtTime(sound.whooshF1Hz, t0 + sound.whooshLenS)
  const whooshGain = context.createGain()
  whooshGain.gain.setValueAtTime(0.0001, t0)
  whooshGain.gain.exponentialRampToValueAtTime(sound.whooshGain, t0 + 0.05)
  whooshGain.gain.exponentialRampToValueAtTime(0.0001, t0 + sound.whooshLenS)
  whoosh.connect(whooshFilter).connect(whooshGain).connect(bus)
  whoosh.start(t0)
  whoosh.stop(t0 + sound.whooshLenS + 0.1)
  track(whoosh)

  const sub = context.createOscillator()
  sub.type = 'sine'
  sub.frequency.setValueAtTime(sound.subF0Hz, t0)
  sub.frequency.exponentialRampToValueAtTime(Math.max(12, sound.subF0Hz * 0.4), t0 + sound.rumbleLenS)
  const subGain = context.createGain()
  subGain.gain.setValueAtTime(0.0001, t0)
  subGain.gain.exponentialRampToValueAtTime(sound.subGain, t0 + 0.12)
  subGain.gain.exponentialRampToValueAtTime(0.0001, t0 + sound.rumbleLenS)
  sub.connect(subGain).connect(bus)
  sub.start(t0)
  sub.stop(t0 + sound.rumbleLenS + 0.2)
  track(sub)

  scheduleRumble(context, bus, t0, sound, track, noiseBuffer)
}

/** Short UI tone when a probe lands. Pitch rises slightly with each call. */
let blipNote = 0
export function blip(): void {
  const context = unlockAudio()
  const bus = masterGain()
  if (!context || !bus) return
  const t0 = context.currentTime + 0.01
  const frequency = 660 * 2 ** ((blipNote % 4) / 12)
  blipNote += 1
  const osc = context.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(frequency, t0)
  osc.frequency.exponentialRampToValueAtTime(frequency * 0.6, t0 + 0.12)
  const gain = context.createGain()
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(0.05, t0 + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14)
  osc.connect(gain).connect(bus)
  osc.start(t0)
  osc.stop(t0 + 0.16)
  track(osc)
}
