import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { Palette } from '@/lib/pattern/types'
import { computeBomWithTotal } from '@/features/bom/computeBom'

export async function buildPatternPdf(
  cells: number[][],
  palette: Palette,
  opts: { lang: 'zh-CN' | 'en'; cellSize?: number } = { lang: 'en' },
): Promise<Uint8Array> {
  const cellSize = opts.cellSize ?? 14
  const w = cells[0].length, h = cells.length
  const margin = 36, footer = 100
  const pageW = w * cellSize + margin * 2
  const pageH = h * cellSize + margin * 2 + footer

  const pdf = await PDFDocument.create()
  const page = pdf.addPage([pageW, pageH])
  const font = await pdf.embedFont(StandardFonts.Helvetica)

  page.drawText('pinpindou pattern', { x: margin, y: pageH - margin + 6, size: 12, font, color: rgb(0.1, 0.1, 0.1) })

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const hex = palette.colors[cells[y][x]].hex
      const { r, g, b } = hexToRgb01(hex)
      page.drawRectangle({
        x: margin + x * cellSize,
        y: pageH - margin - (y + 1) * cellSize,
        width: cellSize, height: cellSize,
        color: rgb(r, g, b),
        borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 0.3,
      })
    }
  }

  for (let x = 0; x < w; x += 5) {
    page.drawText(`${x}`, { x: margin + x * cellSize, y: pageH - margin + 1, size: 6, font })
  }
  for (let y = 0; y < h; y += 5) {
    page.drawText(`${y}`, { x: margin - 12, y: pageH - margin - (y + 1) * cellSize + 2, size: 6, font })
  }

  const { bom, total } = computeBomWithTotal(cells)
  let bx = margin, by = footer - 24
  page.drawText(`BOM total ${total}`, {
    x: margin, y: footer - 8, size: 9, font, color: rgb(0.2, 0.2, 0.2),
  })
  for (const e of bom) {
    const c = palette.colors[e.index]
    const { r, g, b } = hexToRgb01(c.hex)
    page.drawRectangle({ x: bx, y: by - 1, width: 8, height: 8, color: rgb(r, g, b), borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 0.3 })
    // Helvetica doesn't support CJK glyphs — strip non-ASCII from labels for v1.
    // (Future task: embed a CJK font like Noto Sans CJK for full character support.)
    const label = `${c.id} ${c.name[opts.lang].replace(/[^\x20-\x7E]/g, '')} x${e.count}`
    page.drawText(label, { x: bx + 12, y: by, size: 7, font })
    bx += 12 + label.length * 4
    if (bx > pageW - margin) { bx = margin; by -= 12 }
    if (by < 8) break
  }

  return pdf.save()
}

function hexToRgb01(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  }
}
