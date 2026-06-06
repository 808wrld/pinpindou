import { applyBrightnessContrast } from '@/lib/image/brightnessContrast'
import { boxScale } from '@/lib/image/boxScale'
import type { PreprocessRequest, PreprocessResponse } from './protocol'

self.onmessage = (e: MessageEvent<PreprocessRequest>) => {
  const req = e.data
  if (req.type !== 'preprocess') return
  try {
    const cropped = cropPixels(req.pixels, req.width, req.height, req.crop)
    applyBrightnessContrast(cropped, req.brightness, req.contrast)
    const scaled = boxScale(cropped, req.crop.w, req.crop.h, req.targetW, req.targetH)
    const res: PreprocessResponse = {
      type: 'preprocess:result',
      id: req.id,
      pixels: scaled,
      w: req.targetW,
      h: req.targetH,
    }
    ;(self as unknown as Worker).postMessage(res, [scaled.buffer])
  } catch (err) {
    const res: PreprocessResponse = {
      type: 'preprocess:error',
      id: req.id,
      message: err instanceof Error ? err.message : 'preprocess failed',
    }
    ;(self as unknown as Worker).postMessage(res)
  }
}

function cropPixels(
  src: Uint8ClampedArray, sw: number, _sh: number,
  crop: { x: number; y: number; w: number; h: number },
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(crop.w * crop.h * 4)
  for (let y = 0; y < crop.h; y++) {
    const sy = crop.y + y
    for (let x = 0; x < crop.w; x++) {
      const sx = crop.x + x
      const si = (sy * sw + sx) * 4
      const di = (y * crop.w + x) * 4
      out[di] = src[si]; out[di+1] = src[si+1]; out[di+2] = src[si+2]; out[di+3] = src[si+3]
    }
  }
  return out
}
