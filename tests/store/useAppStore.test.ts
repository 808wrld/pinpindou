import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore, defaultState } from '@/store/useAppStore'

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState(defaultState())
    localStorage.clear()
  })

  it('default state has no image', () => {
    expect(useAppStore.getState().image).toBeNull()
  })

  it('setBrightness updates state', () => {
    useAppStore.getState().setBrightness(0.5)
    expect(useAppStore.getState().preprocess.brightness).toBe(0.5)
  })

  it('reset clears everything', () => {
    useAppStore.getState().setBrightness(0.5)
    useAppStore.getState().reset()
    expect(useAppStore.getState().preprocess.brightness).toBe(0)
  })

  it('setStep updates current step', () => {
    useAppStore.getState().setStep('tune')
    expect(useAppStore.getState().step).toBe('tune')
  })
})
