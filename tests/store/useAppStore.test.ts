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

  it('setCells records which palette the cells belong to', () => {
    useAppStore.getState().setCells([[0]], 'perler')
    expect(useAppStore.getState().cellsPaletteId).toBe('perler')
    useAppStore.getState().setCells(null, 'perler')
    expect(useAppStore.getState().cellsPaletteId).toBeNull()
  })

  it('reset clears the generating flag', () => {
    useAppStore.getState().setGenerating(true)
    useAppStore.getState().reset()
    expect(useAppStore.getState().generating).toBe(false)
  })

  it('setStep updates current step', () => {
    useAppStore.getState().setStep('tune')
    expect(useAppStore.getState().step).toBe('tune')
  })
})
