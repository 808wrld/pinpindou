import { describe, it, expect } from 'vitest'
import { floydSteinbergLab } from '@/lib/dither/floydSteinberg'
import type { Lab } from '@/lib/pattern/types'

const palette: Lab[] = [
  [100, 0, 0], // white
  [0, 0, 0],   // black
]

function makeSolidGrey(w: number, h: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    out[i * 4] = 128
    out[i * 4 + 1] = 128
    out[i * 4 + 2] = 128
    out[i * 4 + 3] = 255
  }
  return out
}

describe('floydSteinbergLab', () => {
  it('maps a uniform-grey 8x8 to mix of white and black', () => {
    const cells = floydSteinbergLab(makeSolidGrey(8, 8), 8, 8, palette)
    let whites = 0, blacks = 0
    for (const row of cells) for (const c of row) {
      if (c === 0) whites++; else if (c === 1) blacks++
    }
    expect(whites).toBeGreaterThan(0)
    expect(blacks).toBeGreaterThan(0)
    expect(whites + blacks).toBe(64)
  })
  it('returns row-major cells with correct dimensions', () => {
    const cells = floydSteinbergLab(makeSolidGrey(3, 2), 3, 2, palette)
    expect(cells.length).toBe(2)
    expect(cells[0].length).toBe(3)
  })
  it('all-white input → all whites (no error to propagate)', () => {
    const px = new Uint8ClampedArray(4 * 4 * 4)
    for (let i = 0; i < 16; i++) { px[i*4] = 255; px[i*4+1] = 255; px[i*4+2] = 255; px[i*4+3] = 255 }
    const cells = floydSteinbergLab(px, 4, 4, palette)
    for (const row of cells) for (const c of row) expect(c).toBe(0)
  })
})
