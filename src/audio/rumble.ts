/** Delayed blast rumble. Call from a user-gesture path (Launch). */
let ctx: AudioContext | null = null

export function armRumble(delayS: number, muted: boolean) {
  if (muted || typeof window === 'undefined') return
  try {
    ctx ??= new AudioContext()
    const t0 = ctx.currentTime + Math.max(0.05, delayS)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(38, t0)
    osc.frequency.exponentialRampToValueAtTime(18, t0 + 4)
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 6)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t0)
    osc.stop(t0 + 6.2)

    const noise = ctx.createBufferSource()
    const nbuf = ctx.createBuffer(1, ctx.sampleRate * 0.35, ctx.sampleRate)
    const data = nbuf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    noise.buffer = nbuf
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(0.0001, t0)
    ng.gain.exponentialRampToValueAtTime(0.08, t0 + 0.02)
    ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32)
    noise.connect(ng)
    ng.connect(ctx.destination)
    noise.start(t0)
    noise.stop(t0 + 0.35)

    const crack = ctx.createOscillator()
    const cg = ctx.createGain()
    crack.type = 'square'
    crack.frequency.setValueAtTime(180, t0)
    crack.frequency.exponentialRampToValueAtTime(40, t0 + 0.18)
    cg.gain.setValueAtTime(0.0001, t0)
    cg.gain.exponentialRampToValueAtTime(0.12, t0 + 0.01)
    cg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22)
    crack.connect(cg)
    cg.connect(ctx.destination)
    crack.start(t0)
    crack.stop(t0 + 0.25)
  } catch {
    // Autoplay policies — ignore.
  }
}
