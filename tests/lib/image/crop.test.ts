import { describe, it, expect } from 'vitest'
import {
  aspectRatio,
  clampCrop,
  cropForAspect,
  cropZoom,
  maxCropSize,
  moveCrop,
  MAX_CROP_ZOOM,
} from '@/lib/image/crop'

describe('crop helpers', () => {
  it('maxCropSize fits the aspect inside the image', () => {
    expect(maxCropSize(1000, 600, 1)).toEqual({ w: 600, h: 600 })
    expect(maxCropSize(1000, 600, 2)).toEqual({ w: 1000, h: 500 })
    expect(maxCropSize(1000, 600, 0.5)).toEqual({ w: 300, h: 600 })
  })

  it('cropForAspect centres the crop by default', () => {
    expect(cropForAspect(1000, 600, 1)).toEqual({ x: 200, y: 0, w: 600, h: 600 })
  })

  it('cropForAspect zooms around the given centre and stays inside the image', () => {
    expect(cropForAspect(1000, 600, 1, 2, { x: 100, y: 100 })).toEqual({
      x: 0,
      y: 0,
      w: 300,
      h: 300,
    })
    expect(cropForAspect(1000, 600, 1, 2, { x: 500, y: 300 })).toEqual({
      x: 350,
      y: 150,
      w: 300,
      h: 300,
    })
  })

  it('cropForAspect caps the zoom', () => {
    const c = cropForAspect(1000, 600, 1, 100)
    expect(c.w).toBe(Math.floor(600 / MAX_CROP_ZOOM))
  })

  it('cropZoom is the inverse of cropForAspect', () => {
    const c = cropForAspect(1000, 600, aspectRatio('2_1'), 2.5)
    expect(cropZoom(c, 1000, 600, aspectRatio('2_1'))).toBeCloseTo(2.5, 1)
  })

  it('moveCrop clamps at the image edges', () => {
    const c = { x: 100, y: 100, w: 200, h: 200 }
    expect(moveCrop(c, -500, 0, 1000, 600)).toEqual({ x: 0, y: 100, w: 200, h: 200 })
    expect(moveCrop(c, 0, 900, 1000, 600)).toEqual({ x: 100, y: 400, w: 200, h: 200 })
  })

  it('clampCrop shrinks crops larger than the image', () => {
    expect(clampCrop({ x: -10, y: -10, w: 2000, h: 50 }, 1000, 600)).toEqual({
      x: 0,
      y: 0,
      w: 1000,
      h: 50,
    })
  })
})
