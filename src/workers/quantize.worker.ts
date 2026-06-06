import { floydSteinbergLab } from '@/lib/dither/floydSteinberg'
import { orderedDither } from '@/lib/dither/ordered'
import { noDither } from '@/lib/dither/none'
import type { Lab } from '@/lib/pattern/types'
import type { QuantizeRequest, QuantizeResponse } from './protocol'

self.onmessage = (e: MessageEvent<QuantizeRequest>) => {
  const req = e.data
  if (req.type !== 'quantize') return
  try {
    const n = req.paletteLab.length / 3
    const palette: Lab[] = new Array(n)
    for (let i = 0; i < n; i++) {
      palette[i] = [req.paletteLab[i*3], req.paletteLab[i*3+1], req.paletteLab[i*3+2]]
    }
    let cells: number[][]
    switch (req.ditherMode) {
      case 'floyd-steinberg':
        cells = floydSteinbergLab(req.pixels, req.width, req.height, palette); break
      case 'ordered-4x4':
        cells = orderedDither(req.pixels, req.width, req.height, palette); break
      default:
        cells = noDither(req.pixels, req.width, req.height, palette)
    }
    const res: QuantizeResponse = { type: 'quantize:result', id: req.id, cells }
    ;(self as unknown as Worker).postMessage(res)
  } catch (err) {
    const res: QuantizeResponse = {
      type: 'quantize:error',
      id: req.id,
      message: err instanceof Error ? err.message : 'quantize failed',
    }
    ;(self as unknown as Worker).postMessage(res)
  }
}
