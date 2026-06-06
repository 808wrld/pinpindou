import { rgbToLab } from '@/lib/color/lab'
import { nearestPaletteIndex } from '@/lib/color/nearest'
import type { Lab } from '@/lib/pattern/types'

const W7 = 7 / 16, W3 = 3 / 16, W5 = 5 / 16, W1 = 1 / 16

export function floydSteinbergLab(
  pixels: Uint8ClampedArray,
  w: number,
  h: number,
  palette: readonly Lab[],
): number[][] {
  const lab: Float32Array = new Float32Array(w * h * 3)
  for (let i = 0; i < w * h; i++) {
    const [L, a, b] = rgbToLab(pixels[i * 4], pixels[i * 4 + 1], pixels[i * 4 + 2])
    lab[i * 3] = L; lab[i * 3 + 1] = a; lab[i * 3 + 2] = b
  }

  const cells: number[][] = Array.from({ length: h }, () => new Array(w).fill(0))

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 3
      const oldLab: Lab = [lab[idx], lab[idx + 1], lab[idx + 2]]
      const pIdx = nearestPaletteIndex(oldLab, palette)
      cells[y][x] = pIdx
      const newLab = palette[pIdx]
      const eL = oldLab[0] - newLab[0]
      const ea = oldLab[1] - newLab[1]
      const eb = oldLab[2] - newLab[2]
      propagate(lab, w, h, x + 1, y,     eL, ea, eb, W7)
      propagate(lab, w, h, x - 1, y + 1, eL, ea, eb, W3)
      propagate(lab, w, h, x,     y + 1, eL, ea, eb, W5)
      propagate(lab, w, h, x + 1, y + 1, eL, ea, eb, W1)
    }
  }
  return cells
}

function propagate(
  lab: Float32Array, w: number, h: number,
  x: number, y: number,
  eL: number, ea: number, eb: number, weight: number,
): void {
  if (x < 0 || x >= w || y < 0 || y >= h) return
  const i = (y * w + x) * 3
  lab[i] += eL * weight
  lab[i + 1] += ea * weight
  lab[i + 2] += eb * weight
}
