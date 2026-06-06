import { rgbToLab } from '@/lib/color/lab'
import { nearestPaletteIndex } from '@/lib/color/nearest'
import type { Lab } from '@/lib/pattern/types'

const BAYER_4: readonly number[] = [
   0,  8,  2, 10,
  12,  4, 14,  6,
   3, 11,  1,  9,
  15,  7, 13,  5,
]
const BAYER_DIV = 16
const BIAS_AMPL = 12

export function orderedDither(
  pixels: Uint8ClampedArray, w: number, h: number, palette: readonly Lab[],
): number[][] {
  const cells: number[][] = Array.from({ length: h }, () => new Array(w).fill(0))
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const [L, a, b] = rgbToLab(pixels[i], pixels[i + 1], pixels[i + 2])
      const t = BAYER_4[(y % 4) * 4 + (x % 4)] / BAYER_DIV - 0.5
      const Lp = Math.max(0, Math.min(100, L + t * BIAS_AMPL))
      cells[y][x] = nearestPaletteIndex([Lp, a, b], palette)
    }
  }
  return cells
}
