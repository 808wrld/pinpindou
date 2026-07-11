import { describe, it, expect } from 'vitest'
import { boxScale } from '@/lib/image/boxScale'

describe('boxScale', () => {
  it('downscales 4x4 solid red to 2x2 solid red', () => {
    const src = new Uint8ClampedArray(4 * 4 * 4)
    for (let i = 0; i < 16; i++) { src[i*4] = 255; src[i*4+3] = 255 }
    const out = boxScale(src, 4, 4, 2, 2)
    expect(out.length).toBe(2 * 2 * 4)
    for (let i = 0; i < 4; i++) {
      expect(out[i*4]).toBe(255)
      expect(out[i*4+1]).toBe(0)
      expect(out[i*4+2]).toBe(0)
      expect(out[i*4+3]).toBe(255)
    }
  })
  it('averages a 2x2 [black,white;white,black] to 1x1 mid-grey', () => {
    const src = new Uint8ClampedArray([
      0,0,0,255,        255,255,255,255,
      255,255,255,255,  0,0,0,255,
    ])
    const out = boxScale(src, 2, 2, 1, 1)
    expect(out[0]).toBeCloseTo(128, 0)
    expect(out[1]).toBeCloseTo(128, 0)
    expect(out[2]).toBeCloseTo(128, 0)
    expect(out[3]).toBe(255)
  })
  it('preserves pixels when src and target equal', () => {
    const src = new Uint8ClampedArray([10,20,30,255, 40,50,60,255])
    const out = boxScale(src, 2, 1, 2, 1)
    expect(Array.from(out)).toEqual([10,20,30,255, 40,50,60,255])
  })
  it('writes transparent black instead of NaN for a degenerate (zero-size) source box', () => {
    const src = new Uint8ClampedArray(0)
    const out = boxScale(src, 0, 0, 2, 2)
    expect(out.length).toBe(2 * 2 * 4)
    for (const v of out) expect(v).toBe(0)
  })
})
