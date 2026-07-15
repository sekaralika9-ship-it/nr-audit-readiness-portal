import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

function createStorageMock() {
  let values = new Map()

  return {
    getItem: (key) => values.get(String(key)) ?? null,
    setItem: (key, value) => values.set(String(key), String(value)),
    removeItem: (key) => values.delete(String(key)),
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() {
      return values.size
    },
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: createStorageMock(),
})

afterEach(() => {
  cleanup()
  globalThis.localStorage.clear()
})

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock

Object.defineProperty(globalThis.URL, 'createObjectURL', {
  configurable: true,
  value: () => 'blob:test-download',
})

Object.defineProperty(globalThis.URL, 'revokeObjectURL', {
  configurable: true,
  value: () => {},
})
