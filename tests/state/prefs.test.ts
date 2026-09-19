import { describe, expect, it } from 'vitest'
import { PREFS_KEY, loadPrefs, parsePrefs, savePrefs } from '../../src/state/prefs'

describe('ui preferences', () => {
  it('defaults on missing or malformed data', () => {
    expect(parsePrefs(null)).toEqual({ helpSeen: false })
    expect(parsePrefs('not json')).toEqual({ helpSeen: false })
    expect(parsePrefs('{}')).toEqual({ helpSeen: false })
    expect(parsePrefs('{"helpSeen":"yes"}')).toEqual({ helpSeen: false })
    expect(parsePrefs('{"helpSeen":true}')).toEqual({ helpSeen: true })
  })

  it('reads and writes through storage', () => {
    const store = new Map<string, string>()
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
    }
    expect(loadPrefs(storage)).toEqual({ helpSeen: false })
    savePrefs({ helpSeen: true }, storage)
    expect(store.get(PREFS_KEY)).toContain('true')
    expect(loadPrefs(storage)).toEqual({ helpSeen: true })
  })

  it('no-ops without storage', () => {
    expect(loadPrefs(null)).toEqual({ helpSeen: false })
    expect(() => savePrefs({ helpSeen: true }, null)).not.toThrow()
  })
})
