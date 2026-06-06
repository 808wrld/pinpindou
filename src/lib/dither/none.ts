import { rgbToLab } from '@/lib/color/lab'
import { nearestPaletteIndex } from '@/lib/color/nearest'
import type { Lab } from '@/lib/pattern/types'

export function noDither(
  pixels: Uint8ClampedArray, w: number, h: number, palette: readonly Lab[],
): number[][] {
  const cells: number[][] = Array.from({ length: h }, () => new Array(w).fill(0))
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      cells[y][x] = nearestPaletteIndex(rgbToLab(pixels[i], pixels[i+1], pixels[i+2]), palette)
    }
  }
  return cells
}
