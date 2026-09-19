import { safeStorage } from './draft'

export const PREFS_KEY = 'nukesim.prefs.v1'

export type Prefs = { helpSeen: boolean }

const DEFAULT_PREFS: Prefs = { helpSeen: false }

/** Parse stored UI preferences, falling back to defaults on any malformed value. */
export function parsePrefs(raw: string | null): Prefs {
  if (!raw) return { ...DEFAULT_PREFS }
  try {
    const value = JSON.parse(raw) as Partial<Prefs>
    return { helpSeen: value.helpSeen === true }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function loadPrefs(storage: Pick<Storage, 'getItem'> | null = safeStorage()): Prefs {
  if (!storage) return { ...DEFAULT_PREFS }
  return parsePrefs(storage.getItem(PREFS_KEY))
}

export function savePrefs(prefs: Prefs, storage: Pick<Storage, 'setItem'> | null = safeStorage()): void {
  if (!storage) return
  try {
    storage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // Private browsing can reject writes; the hint simply shows again next time.
  }
}
