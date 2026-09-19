export type BlastSound = {
  size: number
  rumbleLenS: number
  rumbleF0Hz: number
  rumbleF1Hz: number
  rumbleGain: number
  crackGain: number
  whooshGain: number
  whooshF0Hz: number
  whooshF1Hz: number
  whooshLenS: number
  subF0Hz: number
  subGain: number
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

/**
 * Yield → blast soundscape parameters. Larger yields read as longer, lower and
 * heavier; small bursts are a short sharp crack. Kept pure so the scaling can
 * be unit-tested without a browser audio stack.
 */
export function blastSound(yieldKt: number): BlastSound {
  const size = clamp(0.45 + 0.42 * Math.log10(Math.max(yieldKt, 0.05) + 1), 0.45, 2.2)
  return {
    size,
    rumbleLenS: 3 + 5 * size,
    rumbleF0Hz: 52 / size,
    rumbleF1Hz: 14 / size + 8,
    rumbleGain: 0.12 * size,
    crackGain: 0.09 * size,
    whooshGain: 0.05 + 0.05 * size,
    whooshF0Hz: 1400,
    whooshF1Hz: 180,
    whooshLenS: 0.9 + 0.6 * size,
    subF0Hz: 34 / size,
    subGain: 0.07 * size,
  }
}
