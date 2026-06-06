import { describe, it, expect } from 'vitest'
import { applyBrightnessContrast } from '@/lib/image/brightnessContrast'
import { boxScale } from '@/lib/image/boxScale'

describe('preprocess pipeline', () => {
  it('crop → bc → scale produces expected dims', () => {
    const sw = 4, sh = 4
    const src = new Uint8ClampedArray(sw * sh * 4)
    for (let i = 0; i < sw * sh; i++) {
      src[i*4] = 100; src[i*4+1] = 100; src[i*4+2] = 100; src[i*4+3] = 255
    }
    applyBrightnessContrast(src, 0.1, 0)
    const out = boxScale(src, sw, sh, 2, 2)
    expect(out.length).toBe(2 * 2 * 4)
    expect(out[0]).toBeGreaterThan(100)
  })
})
