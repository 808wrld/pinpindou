import { describe, it, expect } from 'vitest'
import { patternDims } from '@/lib/pattern/dims'

describe('patternDims', () => {
  it('keeps square crops square', () => {
    expect(patternDims(29, { w: 800, h: 800 })).toEqual({ w: 29, h: 29 })
  })

  it('uses the preset as the long side of a landscape crop', () => {
    expect(patternDims(48, { w: 1000, h: 500 })).toEqual({ w: 48, h: 24 })
  })

  it('uses the preset as the long side of a portrait crop', () => {
    expect(patternDims(64, { w: 300, h: 600 })).toEqual({ w: 32, h: 64 })
  })

  it('rounds and never returns a zero-sized side', () => {
    expect(patternDims(16, { w: 1000, h: 10 })).toEqual({ w: 16, h: 1 })
    expect(patternDims(29, { w: 3, h: 2 })).toEqual({ w: 29, h: 19 })
  })

  it('falls back to a square for degenerate crops', () => {
    expect(patternDims(16, { w: 0, h: 0 })).toEqual({ w: 16, h: 16 })
  })
})
