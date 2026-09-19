import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

class FakeParam {
  value = 0
  setValueAtTime = vi.fn()
  exponentialRampToValueAtTime = vi.fn()
  linearRampToValueAtTime = vi.fn()
  setTargetAtTime = vi.fn()
}

let starts = 0

class FakeNode {
  connect = vi.fn((destination: unknown) => destination)
  disconnect = vi.fn()
  start = vi.fn(() => {
    starts += 1
  })
  stop = vi.fn()
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = []
  currentTime = 0
  sampleRate = 48_000
  state = 'running'
  destination = new FakeNode()
  resume = vi.fn()
  constructor() {
    FakeAudioContext.instances.push(this)
  }
  createGain() {
    return Object.assign(new FakeNode(), { gain: new FakeParam() })
  }
  createOscillator() {
    return Object.assign(new FakeNode(), { type: 'sine', frequency: new FakeParam() })
  }
  createBufferSource() {
    return Object.assign(new FakeNode(), { buffer: null })
  }
  createBiquadFilter() {
    return Object.assign(new FakeNode(), { type: 'lowpass', frequency: new FakeParam(), Q: new FakeParam() })
  }
  createBuffer(_channels: number, length: number) {
    return { getChannelData: () => new Float32Array(length) }
  }
}

const originalWindow = (globalThis as { window?: unknown }).window
const originalAudioContext = (globalThis as { AudioContext?: unknown }).AudioContext

beforeEach(() => {
  vi.resetModules()
  starts = 0
  FakeAudioContext.instances = []
  ;(globalThis as { window?: unknown }).window = globalThis
  ;(globalThis as { AudioContext?: unknown }).AudioContext = FakeAudioContext
})

afterEach(() => {
  ;(globalThis as { window?: unknown }).window = originalWindow
  ;(globalThis as { AudioContext?: unknown }).AudioContext = originalAudioContext
})

describe('audio unlock and mute', () => {
  it('creates one context and mutes through the master gain', async () => {
    const unlock = await import('../../src/audio/unlock')
    const first = unlock.unlockAudio()
    const second = unlock.unlockAudio()
    expect(first).toBe(second)
    expect(FakeAudioContext.instances).toHaveLength(1)
    expect(unlock.audioMuted()).toBe(false)
    unlock.setAudioMuted(true)
    expect(unlock.audioMuted()).toBe(true)
    unlock.setAudioMuted(false)
    expect(unlock.audioMuted()).toBe(false)
  })

  it('returns null without a browser window', async () => {
    ;(globalThis as { window?: unknown }).window = undefined
    const unlock = await import('../../src/audio/unlock')
    expect(unlock.unlockAudio()).toBeNull()
    expect(unlock.audioContext()).toBeNull()
    unlock.setAudioMuted(true)
    expect(unlock.audioMuted()).toBe(true)
  })
})

describe('blast scheduling', () => {
  it('arms crack, whoosh, sub and rumble sources', async () => {
    const engine = await import('../../src/audio/engine')
    engine.armBlast(1.5, 10)
    // crack + whoosh + sub + rumble sine + rumble noise
    expect(starts).toBe(5)
  })

  it('replaces a previous run and cancels cleanly', async () => {
    const engine = await import('../../src/audio/engine')
    engine.armBlast(2, 1000)
    engine.armBlast(2, 10)
    expect(starts).toBe(10)
    engine.cancelBlast()
    engine.cancelBlast()
    expect(() => engine.blip()).not.toThrow()
    expect(starts).toBe(11)
  })

  it('is a no-op without a window', async () => {
    ;(globalThis as { window?: unknown }).window = undefined
    const engine = await import('../../src/audio/engine')
    expect(() => engine.armBlast(1, 10)).not.toThrow()
    expect(() => engine.blip()).not.toThrow()
    engine.cancelBlast()
    expect(starts).toBe(0)
  })
})
