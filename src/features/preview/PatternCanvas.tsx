import { useEffect, useRef } from 'react'
import type { Palette } from '@/lib/pattern/types'

export function PatternCanvas({
  cells,
  palette,
  cellSize = 12,
  showGrid = true,
}: {
  cells: number[][]
  palette: Palette
  cellSize?: number
  showGrid?: boolean
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const w = cells[0].length
    const h = cells.length
    c.width = w * cellSize
    c.height = h * cellSize
    const ctx = c.getContext('2d')!
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        ctx.fillStyle = palette.colors[cells[y][x]]?.hex ?? '#ff00ff'
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
      }
    }
    if (showGrid && cellSize >= 6) {
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'
      ctx.lineWidth = 1
      for (let x = 0; x <= w; x++) {
        ctx.beginPath()
        ctx.moveTo(x * cellSize, 0)
        ctx.lineTo(x * cellSize, h * cellSize)
        ctx.stroke()
      }
      for (let y = 0; y <= h; y++) {
        ctx.beginPath()
        ctx.moveTo(0, y * cellSize)
        ctx.lineTo(w * cellSize, y * cellSize)
        ctx.stroke()
      }
    }
  }, [cells, palette, cellSize, showGrid])
  return <canvas ref={ref} className="rounded border bg-white" />
}
