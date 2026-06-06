import { runPreprocess } from '@/lib/workers/runPreprocess'
import { runQuantize } from '@/lib/workers/runQuantize'
import { ciede2000 } from '@/lib/color/ciede2000'
import type { Palette } from './types'

export async function generatePattern(args: {
  imageDataUrl: string
  srcW: number
  srcH: number
  crop: { x: number; y: number; w: number; h: number }
  brightness: number
  contrast: number
  targetW: number
  targetH: number
  palette: Palette
  ditherMode: 'none' | 'floyd-steinberg' | 'ordered-4x4'
  colorCap?: number | null
}): Promise<{ cells: number[][] } | { error: string }> {
  const pixels = await loadPixels(args.imageDataUrl, args.srcW, args.srcH)
  const pre = await runPreprocess({
    pixels,
    width: args.srcW,
    height: args.srcH,
    crop: args.crop,
    brightness: args.brightness,
    contrast: args.contrast,
    targetW: args.targetW,
    targetH: args.targetH,
  })
  if (pre.type === 'preprocess:error') return { error: pre.message }
  const paletteLab = new Float32Array(args.palette.colors.length * 3)
  for (let i = 0; i < args.palette.colors.length; i++) {
    const [L, a, b] = args.palette.colors[i].lab
    paletteLab[i * 3] = L
    paletteLab[i * 3 + 1] = a
    paletteLab[i * 3 + 2] = b
  }
  const q = await runQuantize({
    pixels: pre.pixels,
    width: pre.w,
    height: pre.h,
    paletteLab,
    ditherMode: args.ditherMode,
  })
  if (q.type === 'quantize:error') return { error: q.message }

  const cells =
    args.colorCap && args.colorCap > 0
      ? applyColorCap(q.cells, args.palette, args.colorCap)
      : q.cells

  return { cells }
}

/**
 * Limit the pattern to at most `cap` distinct colors. Strategy:
 *   1. Count usage of each palette index in `cells`.
 *   2. Keep the top-`cap` by frequency.
 *   3. Any cell using a dropped color is re-mapped to the nearest kept color
 *      via CIEDE2000 in Lab space.
 *
 * This is the key knob for clean output on flat / cartoon inputs. Without it,
 * F-S / Bayer diffuse error across visually-similar palette entries (e.g.
 * three near-whites) and produce salt-and-pepper noise on uniform regions.
 */
function applyColorCap(cells: number[][], palette: Palette, cap: number): number[][] {
  const counts = new Map<number, number>()
  for (const row of cells) for (const idx of row) counts.set(idx, (counts.get(idx) ?? 0) + 1)
  if (counts.size <= cap) return cells

  const keep = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, cap)
    .map(([idx]) => idx)
  const keepSet = new Set(keep)

  // Memoize the remap (dropped index → nearest kept index) so we only
  // compute CIEDE2000 once per dropped color, not once per cell.
  const remap = new Map<number, number>()
  function nearestKept(droppedIdx: number): number {
    const cached = remap.get(droppedIdx)
    if (cached !== undefined) return cached
    const droppedLab = palette.colors[droppedIdx].lab
    let bestIdx = keep[0]
    let bestDe = Infinity
    for (const k of keep) {
      const de = ciede2000(droppedLab, palette.colors[k].lab)
      if (de < bestDe) {
        bestDe = de
        bestIdx = k
      }
    }
    remap.set(droppedIdx, bestIdx)
    return bestIdx
  }

  return cells.map((row) => row.map((idx) => (keepSet.has(idx) ? idx : nearestKept(idx))))
}

async function loadPixels(dataUrl: string, w: number, h: number): Promise<Uint8ClampedArray> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image()
    i.onload = () => res(i)
    i.onerror = rej
    i.src = dataUrl
  })
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  // Pre-fill white so transparent PNG pixels are treated as white instead of
  // black-with-alpha-0 (which would otherwise diffuse into background noise).
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0)
  return ctx.getImageData(0, 0, w, h).data
}
