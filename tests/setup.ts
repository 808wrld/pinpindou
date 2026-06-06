import '@testing-library/jest-dom/vitest'

// jsdom 29 does not provide Web Storage by default. Polyfill localStorage / sessionStorage
// so persistence-aware code (e.g. zustand persist middleware) can run under jsdom.
class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length(): number {
    return this.store.size
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  clear(): void {
    this.store.clear()
  }
}

function installStorage(name: 'localStorage' | 'sessionStorage') {
  const g = globalThis as unknown as Record<string, unknown>
  const w = (typeof window !== 'undefined' ? window : undefined) as unknown as
    | Record<string, unknown>
    | undefined
  const existing = (w?.[name] ?? g[name]) as Storage | undefined
  if (existing && typeof existing.setItem === 'function') return
  const instance = new MemoryStorage()
  if (w) w[name] = instance
  g[name] = instance
}

installStorage('localStorage')
installStorage('sessionStorage')
