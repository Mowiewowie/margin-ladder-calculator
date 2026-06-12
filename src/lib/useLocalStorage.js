import { useEffect, useState } from 'react'

/**
 * Like useState, but persisted to localStorage under `key`.
 *
 * - On first render it loads the saved value (so users return to their entries);
 *   if nothing is stored, JSON is corrupt, or `validate` rejects it, it falls
 *   back to `defaultValue`.
 * - Writes are best-effort and guarded (private mode / quota / SSR safe).
 *
 * Only serializable *input* state should be stored here — derived values (and,
 * in this app, live prices) are recomputed on load, not persisted.
 *
 * @param {string} key
 * @param {*} defaultValue
 * @param {(parsed:*) => boolean} [validate] optional shape check
 */
export function useLocalStorageState(key, defaultValue, validate) {
  const [state, setState] = useState(() => readStored(key, defaultValue, validate))

  useEffect(() => {
    if (!hasStorage()) return
    try {
      window.localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // ignore write failures (Safari private mode, quota exceeded, etc.)
    }
  }, [key, state])

  return [state, setState]
}

function hasStorage() {
  try {
    return typeof window !== 'undefined' && !!window.localStorage
  } catch {
    return false
  }
}

function readStored(key, defaultValue, validate) {
  if (!hasStorage()) return defaultValue
  try {
    const raw = window.localStorage.getItem(key)
    if (raw == null) return defaultValue // nothing saved yet -> use defaults
    const parsed = JSON.parse(raw)
    if (typeof validate === 'function' && !validate(parsed)) return defaultValue
    return parsed
  } catch {
    return defaultValue // corrupt JSON -> use defaults
  }
}
