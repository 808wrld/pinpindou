import { describe, it, expect } from 'vitest'
import { nearestPaletteIndex } from '@/lib/color/nearest'

const palette: Array<[number, number, number]> = [
  [100, 0, 0], // white
  [0, 0, 0], // black
  [53.24, 80.09, 67.2], // red
]

describe('nearestPaletteIndex', () => {
  it('returns 0 for white-ish input', () => {
    expect(nearestPaletteIndex([99, 1, 1], palette)).toBe(0)
  })
  it('returns 1 for black-ish input', () => {
    expect(nearestPaletteIndex([5, 0, 0], palette)).toBe(1)
  })
  it('returns 2 for red-ish input', () => {
    expect(nearestPaletteIndex([54, 80, 67], palette)).toBe(2)
  })
  it('returns 0 on empty residual (white exact)', () => {
    expect(nearestPaletteIndex([100, 0, 0], palette)).toBe(0)
  })
})
