import { describe, it, expect, afterEach } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import { useLocalStorageState } from './useLocalStorage.js'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

const KEY = 'test:key'

describe('useLocalStorageState', () => {
  it('uses the default when nothing is stored', () => {
    const { result } = renderHook(() => useLocalStorageState(KEY, { a: 1 }))
    expect(result.current[0]).toEqual({ a: 1 })
  })

  it('persists updates to localStorage', () => {
    const { result } = renderHook(() => useLocalStorageState(KEY, { a: 1 }))
    act(() => result.current[1]({ a: 2 }))
    expect(result.current[0]).toEqual({ a: 2 })
    expect(JSON.parse(window.localStorage.getItem(KEY))).toEqual({ a: 2 })
  })

  it('restores a previously stored value on init', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ a: 42 }))
    const { result } = renderHook(() => useLocalStorageState(KEY, { a: 1 }))
    expect(result.current[0]).toEqual({ a: 42 })
  })

  it('falls back to the default when stored JSON is corrupt', () => {
    window.localStorage.setItem(KEY, '{not valid json')
    const { result } = renderHook(() => useLocalStorageState(KEY, { a: 1 }))
    expect(result.current[0]).toEqual({ a: 1 })
  })

  it('falls back to the default when validate rejects the stored shape', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ wrong: true }))
    const validate = (v) => typeof v.a === 'number'
    const { result } = renderHook(() => useLocalStorageState(KEY, { a: 1 }, validate))
    expect(result.current[0]).toEqual({ a: 1 })
  })
})
