import type { BlastSound } from './design'

/**
 * Low rumble: a descending sine body plus a lowpass-adjacent noise wash.
 * Scheduled relative to `t0` (shock arrival) on the shared master bus.
 */
export function scheduleRumble(
  context: AudioContext,
  bus: AudioNode,
  t0: number,
  sound: BlastSound,
  track: (node: AudioScheduledSourceNode) => void,
  noiseBuffer: (context: AudioContext) => AudioBuffer,
): void {
  const osc = context.createOscillator()
  const gain = context.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(sound.rumbleF0Hz, t0)
  osc.frequency.exponentialRampToValueAtTime(sound.rumbleF1Hz, t0 + sound.rumbleLenS)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(sound.rumbleGain, t0 + 0.08)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + sound.rumbleLenS)
  osc.connect(gain).connect(bus)
  osc.start(t0)
  osc.stop(t0 + sound.rumbleLenS + 0.2)
  track(osc)

  const noise = context.createBufferSource()
  noise.buffer = noiseBuffer(context)
  const ng = context.createGain()
  ng.gain.setValueAtTime(0.0001, t0)
  ng.gain.exponentialRampToValueAtTime(sound.rumbleGain * 0.5, t0 + 0.02)
  ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5)
  noise.connect(ng).connect(bus)
  noise.start(t0)
  noise.stop(t0 + 0.55)
  track(noise)
}
