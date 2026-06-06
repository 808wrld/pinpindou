import { describe, it, expect } from 'vitest'
import { applyBrightnessContrast } from '@/lib/image/brightnessContrast'

describe('applyBrightnessContrast', () => {
  it('identity (b=0,c=0) preserves pixels', () => {
    const px = new Uint8ClampedArray([10, 100, 200, 255])
    applyBrightnessContrast(px, 0, 0)
    expect(Array.from(px)).toEqual([10, 100, 200, 255])
  })
  it('brightness=+1 saturates to 255', () => {
    const px = new Uint8ClampedArray([100, 100, 100, 255])
    applyBrightnessContrast(px, 1, 0)
    expect(px[0]).toBe(255)
  })
  it('brightness=-1 floors to 0', () => {
    const px = new Uint8ClampedArray([100, 100, 100, 255])
    applyBrightnessContrast(px, -1, 0)
    expect(px[0]).toBe(0)
  })
  it('contrast=+1 pushes 128 toward midline (no change) and extremes outward', () => {
    const px = new Uint8ClampedArray([0, 128, 255, 255])
    applyBrightnessContrast(px, 0, 1)
    expect(px[0]).toBe(0)
    expect(px[1]).toBeCloseTo(128, 0)
    expect(px[2]).toBe(255)
  })
  it('preserves alpha channel', () => {
    const px = new Uint8ClampedArray([100, 100, 100, 99])
    applyBrightnessContrast(px, 0.5, 0)
    expect(px[3]).toBe(99)
  })
})
