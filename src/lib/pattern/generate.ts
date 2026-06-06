import { runPreprocess } from '@/lib/workers/runPreprocess'
import { runQuantize } from '@/lib/workers/runQuantize'
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
  return { cells: q.cells }
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
  ctx.drawImage(img, 0, 0)
  return ctx.getImageData(0, 0, w, h).data
}
