import type { Palette } from '@/lib/pattern/types'

export async function downloadPatternPng(
  cells: number[][], palette: Palette, opts: { cellSize?: number; showGrid?: boolean; filename?: string } = {},
): Promise<void> {
  const cellSize = opts.cellSize ?? 20
  const showGrid = opts.showGrid ?? true
  const w = cells[0].length, h = cells.length
  const canvas = document.createElement('canvas')
  canvas.width = w * cellSize; canvas.height = h * cellSize
  const ctx = canvas.getContext('2d')!
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      ctx.fillStyle = palette.colors[cells[y][x]].hex
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
    }
  }
  if (showGrid) {
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'
    for (let x = 0; x <= w; x++) {
      ctx.beginPath(); ctx.moveTo(x * cellSize, 0); ctx.lineTo(x * cellSize, h * cellSize); ctx.stroke()
    }
    for (let y = 0; y <= h; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * cellSize); ctx.lineTo(w * cellSize, y * cellSize); ctx.stroke()
    }
  }
  const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), 'image/png'))
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = opts.filename ?? `pinpindou-${w}x${h}.png`
  a.click()
  URL.revokeObjectURL(url)
}
