import { describe, it, expect } from 'vitest'
import { rgbToLab } from '@/lib/color/lab'

describe('rgbToLab', () => {
  it('white sRGB → L=100, a=0, b=0', () => {
    const [l, a, b] = rgbToLab(255, 255, 255)
    expect(l).toBeCloseTo(100, 1)
    expect(a).toBeCloseTo(0, 1)
    expect(b).toBeCloseTo(0, 1)
  })
  it('black sRGB → L=0', () => {
    const [l, a, b] = rgbToLab(0, 0, 0)
    expect(l).toBeCloseTo(0, 1)
    expect(a).toBeCloseTo(0, 1)
    expect(b).toBeCloseTo(0, 1)
  })
  it('red sRGB #FF0000 → known Lab', () => {
    const [l, a, b] = rgbToLab(255, 0, 0)
    expect(l).toBeCloseTo(53.24, 1)
    expect(a).toBeCloseTo(80.09, 1)
    expect(b).toBeCloseTo(67.20, 1)
  })
  it('green sRGB #00FF00 → known Lab', () => {
    const [l, a, b] = rgbToLab(0, 255, 0)
    expect(l).toBeCloseTo(87.74, 1)
    expect(a).toBeCloseTo(-86.18, 1)
    expect(b).toBeCloseTo(83.18, 1)
  })
})
