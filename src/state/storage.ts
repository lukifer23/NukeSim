/**
 * `window.localStorage` throws a SecurityError in browsers that block site
 * data. Reaching it during module init would blank the page before any error
 * boundary can catch it, so callers get `null` and fall back gracefully.
 */
export function safeStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}
