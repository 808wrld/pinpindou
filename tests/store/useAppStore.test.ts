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

  it('drops the pattern when the image, crop, brightness or contrast change', () => {
    const s = () => useAppStore.getState()
    const seed = () => {
      s().setCells([[0]], 'perler')
      s().setGenerating(true)
    }
    const expectDropped = () => {
      expect(s().cells).toBeNull()
      expect(s().cellsPaletteId).toBeNull()
      expect(s().generating).toBe(false)
    }

    s().setCrop({ x: 0, y: 0, w: 10, h: 10 })
    seed()
    s().setCrop({ x: 0, y: 0, w: 10, h: 10 }) // same crop: pattern is still valid
    expect(s().cells).toEqual([[0]])
    s().setCrop({ x: 1, y: 0, w: 10, h: 10 })
    expectDropped()

    seed()
    s().setBrightness(0) // unchanged
    expect(s().cells).toEqual([[0]])
    s().setBrightness(0.2)
    expectDropped()

    seed()
    s().setContrast(-0.1)
    expectDropped()

    seed()
    s().setImage({ dataUrl: 'data:,', width: 1, height: 1, name: 'b.png' })
    expectDropped()
  })

  it('keeps the pattern when only tune settings change', () => {
    useAppStore.getState().setCells([[0]], 'perler')
    useAppStore.getState().setTune({ dither: 'floyd-steinberg' })
    expect(useAppStore.getState().cells).toEqual([[0]])
  })

  it('setStep updates current step', () => {
    useAppStore.getState().setStep('tune')
    expect(useAppStore.getState().step).toBe('tune')
  })
})
