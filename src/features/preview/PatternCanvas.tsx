import { useEffect, useRef } from 'react'
import type { Palette } from '@/lib/pattern/types'
import { hexLuma } from './symbols'

export function PatternCanvas({
  cells,
  palette,
  cellSize = 14,
  showGrid = true,
  showSymbols = false,
  symbolMap,
}: {
  cells: number[][]
  palette: Palette
  cellSize?: number
  showGrid?: boolean
  showSymbols?: boolean
  symbolMap?: Map<number, string>
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
    const fontPx = Math.max(7, Math.floor(cellSize * 0.55))
    ctx.font = `${fontPx}px ui-monospace, "JetBrains Mono", monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = cells[y][x]
        const hex = palette.colors[idx]?.hex ?? '#ff00ff'
        ctx.fillStyle = hex
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
        if (showSymbols && symbolMap && cellSize >= 10) {
          const luma = hexLuma(hex)
          ctx.fillStyle = luma > 0.6 ? '#1d1a23' : '#fffaf1'
          const sym = symbolMap.get(idx) ?? ''
          if (sym) ctx.fillText(sym, x * cellSize + cellSize / 2, y * cellSize + cellSize / 2 + 0.5)
        }
      }
    }
    if (showGrid && cellSize >= 6) {
      ctx.strokeStyle = 'rgba(26,24,21,0.18)'
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
  }, [cells, palette, cellSize, showGrid, showSymbols, symbolMap])
  return <canvas ref={ref} className="block max-w-full h-auto" style={{ imageRendering: 'pixelated' }} />
}

// Re-export for callers that already import from this module path.
export { hexLuma, SYMBOLS, buildSymbolMap } from './symbols'
