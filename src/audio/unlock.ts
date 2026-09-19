let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = false

/**
 * Creates (or resumes) the single audio context. Must be called from a user
 * gesture the first time — browsers block audio that starts on its own.
 */
export function unlockAudio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    try {
      ctx = new AudioContext()
      master = ctx.createGain()
      master.gain.value = muted ? 0 : 1
      master.connect(ctx.destination)
    } catch {
      ctx = null
      master = null
      return null
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {
    // Autoplay policy can still refuse; the visual model does not depend on audio.
  })
  return ctx
}

/** Master mute for every scheduled sound. Applies even before the first run. */
export function setAudioMuted(value: boolean): void {
  muted = value
  if (ctx && master) master.gain.setTargetAtTime(value ? 0 : 1, ctx.currentTime, 0.04)
}

export function audioContext(): AudioContext | null {
  return ctx
}

export function masterGain(): GainNode | null {
  return master
}

export function audioMuted(): boolean {
  return muted
}
