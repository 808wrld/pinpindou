import { runPreprocess } from '@/lib/workers/runPreprocess'
import { runQuantize } from '@/lib/workers/runQuantize'
import type { Palette } from './types'

/**
 * Two-pass pattern generation (mirrors the proven approach in
 * bad-superman/perler-pattern-generator):
 *
 *   1. PRESELECT — quantize against the full palette with NO dither, just
 *      to learn which colors actually appear. Count frequencies, take top-N
 *      (N = colorCap). The full palette has many near-duplicates (3 whites,
 *      2 greys, etc.); we don't want the dither to flicker between them.
 *
 *   2. RENDER — quantize again against ONLY the top-N reduced palette, this
 *      time with the user's chosen dither. With fewer candidates and no
 *      near-duplicates, F-S / Bayer stop producing salt-pepper noise on
 *      uniform regions, and `none` mode yields perfectly clean blocks.
 *
 * The returned cells contain indices into the ORIGINAL palette (we remap
 * the reduced indices back) so BOM and rendering Just Work downstream.
 */
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

  const fullPaletteLab = buildLabArray(args.palette, args.palette.colors.map((_, i) => i))
  const paletteSize = args.palette.colors.length
  const cap = args.colorCap && args.colorCap > 0 ? Math.min(args.colorCap, paletteSize) : paletteSize

  // Keep an unowned copy of the preprocessed pixels for the second pass —
  // postMessage with transfer detaches the buffer after the first call.
  const pixelsCopy = new Uint8ClampedArray(pre.pixels)

  // Pass 1: full palette, no dither, just to count frequencies.
  const q1 = await runQuantize({
    pixels: pre.pixels,
    width: pre.w,
    height: pre.h,
    paletteLab: fullPaletteLab,
    ditherMode: 'none',
  })
  if (q1.type === 'quantize:error') return { error: q1.message }

  // Optimization: if the cap covers everything AND user picked no dither,
  // pass 1 already IS the answer.
  if (cap >= paletteSize && args.ditherMode === 'none') {
    return { cells: q1.cells }
  }

  const counts = new Map<number, number>()
  for (const row of q1.cells) for (const c of row) counts.set(c, (counts.get(c) ?? 0) + 1)
  const topOrig = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, cap)
    .map(([idx]) => idx)

  // Pass 2: reduced palette + user's chosen dither.
  const reducedLab = buildLabArray(args.palette, topOrig)
  const q2 = await runQuantize({
    pixels: pixelsCopy,
    width: pre.w,
    height: pre.h,
    paletteLab: reducedLab,
    ditherMode: args.ditherMode,
  })
  if (q2.type === 'quantize:error') return { error: q2.message }

  // q2.cells indices are 0..topOrig.length-1 (into reduced palette).
  // Remap back to original palette indices so BOM / preview use the full color metadata.
  const cells = q2.cells.map((row) => row.map((idx) => topOrig[idx]))
  return { cells }
}

function buildLabArray(palette: Palette, indices: readonly number[]): Float32Array {
  const out = new Float32Array(indices.length * 3)
  for (let i = 0; i < indices.length; i++) {
    const [L, a, b] = palette.colors[indices[i]].lab
    out[i * 3] = L
    out[i * 3 + 1] = a
    out[i * 3 + 2] = b
  }
  return out
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
