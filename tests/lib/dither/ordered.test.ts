import { describe, it, expect } from 'vitest'
import { orderedDither } from '@/lib/dither/ordered'
import { noDither } from '@/lib/dither/none'
import type { Lab } from '@/lib/pattern/types'

const palette: Lab[] = [[100, 0, 0], [0, 0, 0]]

function grey(w: number, h: number, v = 128): Uint8ClampedArray {
  const out = new Uint8ClampedArray(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    out[i * 4] = v; out[i * 4 + 1] = v; out[i * 4 + 2] = v; out[i * 4 + 3] = 255
  }
  return out
}

describe('orderedDither', () => {
  it('mixes white + black on grey input', () => {
    const cells = orderedDither(grey(8, 8), 8, 8, palette)
    const flat = cells.flat()
    expect(flat.includes(0) && flat.includes(1)).toBe(true)
    expect(flat.length).toBe(64)
  })
  it('uniform white input → all whites', () => {
    const cells = orderedDither(grey(4, 4, 255), 4, 4, palette)
    for (const row of cells) for (const c of row) expect(c).toBe(0)
  })
})

describe('noDither', () => {
  it('all grey → all whites (closest)', () => {
    const cells = noDither(grey(4, 4), 4, 4, palette)
    // grey (128,128,128) → L≈53.6, ΔL to white(100)=46.4, ΔL to black(0)=53.6 → white wins
    for (const row of cells) for (const c of row) expect(c).toBe(0)
  })
  it('all near-black grey → all blacks (closest)', () => {
    const cells = noDither(grey(4, 4, 32), 4, 4, palette)
    for (const row of cells) for (const c of row) expect(c).toBe(1)
  })
})
