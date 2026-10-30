import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { Palette } from '@/lib/pattern/types'
import { computeBomWithTotal } from '@/features/bom/computeBom'
import { buildSymbolMap, hexLuma } from '@/features/preview/symbols'
import { hexToRgb } from '@/lib/color/lab'
import {
  A4_PORTRAIT,
  BEAD_PITCH_MM,
  HEADER_H,
  LEGEND_COLUMNS,
  LEGEND_ROW_H,
  PAGE_MARGIN,
  ROW_LABEL_W,
  planLegendPages,
  planPatternPages,
  pdfSafeText,
  type PatternTile,
} from './layout'

type Color = ReturnType<typeof rgb>

const INK = rgb(0.1, 0.09, 0.08)
const MUTED = rgb(0.4, 0.38, 0.33)
const GRID = rgb(0.72, 0.72, 0.72)
const GRID_MAJOR = rgb(0.25, 0.25, 0.25)
const DARK_SYMBOL = rgb(0.11, 0.1, 0.14)
const LIGHT_SYMBOL = rgb(1, 0.98, 0.95)

type Fonts = { regular: PDFFont; bold: PDFFont }

/**
 * Printable pattern PDF on A4 pages:
 *  - an overview page (only when the pattern needs more than one sheet),
 *  - one page per tile, cells at real bead size (1 cell = 5 mm when printed
 *    at 100%), with symbols, every-5th-cell guide lines and global row /
 *    column numbers so the sheets can be lined up,
 *  - legend page(s) listing every color with its symbol and count.
 *
 * Standard PDF fonts can't render CJK, so labels use the palette's English
 * color names and color ids regardless of the UI language.
 */
export async function buildPatternPdf(
  cells: number[][],
  palette: Palette,
  opts: { lang: 'zh-CN' | 'en'; cellSize?: number } = { lang: 'en' },
): Promise<Uint8Array> {
  const w = cells[0]?.length ?? 0
  const h = cells.length
  const layout = planPatternPages(w, h, { cellPt: opts.cellSize })
  const symbolMap = buildSymbolMap(cells)
  const { bom, total } = computeBomWithTotal(cells)
  const legendPages = planLegendPages(bom)

  const pdf = await PDFDocument.create()
  pdf.setTitle(`pinpindou pattern ${w}x${h}`)
  pdf.setCreator('pinpindou')
  const fonts: Fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  }

  const multiSheet = layout.tiles.length > 1
  const pageCount = (multiSheet ? 1 : 0) + layout.tiles.length + legendPages.length
  let pageNo = 0
  const summary = `${w} x ${h} beads | ${total} beads total | ${bom.length} colors | palette: ${palette.id}`

  if (multiSheet) {
    const page = pdf.addPage([A4_PORTRAIT.w, A4_PORTRAIT.h])
    pageNo++
    drawHeader(page, fonts, 'pinpindou pattern - overview', summary, pageNo, pageCount)
    drawOverview(page, fonts, cells, palette, layout.tiles, layout.pageCols, layout.pageRows)
  }

  for (const tile of layout.tiles) {
    const page = pdf.addPage([A4_PORTRAIT.w, A4_PORTRAIT.h])
    pageNo++
    const range =
      `columns ${tile.col0 + 1}-${tile.col0 + tile.cols}, rows ${tile.row0 + 1}-${tile.row0 + tile.rows}` +
      (multiSheet ? ` | sheet ${tile.pageRow + 1}.${tile.pageCol + 1}` : '')
    drawHeader(page, fonts, `pinpindou pattern - ${w} x ${h}`, range, pageNo, pageCount)
    drawTile(page, fonts, cells, palette, symbolMap, tile, layout.cellPt)
    drawText(
      page,
      fonts.regular,
      `Print at 100% / actual size: 1 cell = ${BEAD_PITCH_MM} mm. Check the scale with a ruler before placing beads.`,
      PAGE_MARGIN,
      PAGE_MARGIN,
      7,
      MUTED,
    )
  }

  legendPages.forEach((entries, i) => {
    const page = pdf.addPage([A4_PORTRAIT.w, A4_PORTRAIT.h])
    pageNo++
    const title =
      legendPages.length > 1 ? `Bead list (${i + 1}/${legendPages.length})` : 'Bead list'
    drawHeader(page, fonts, title, summary, pageNo, pageCount)
    drawLegend(page, fonts, entries, palette, symbolMap)
  })

  return pdf.save()
}

function drawHeader(
  page: PDFPage,
  fonts: Fonts,
  title: string,
  subtitle: string,
  pageNo: number,
  pageCount: number,
): void {
  const top = A4_PORTRAIT.h - PAGE_MARGIN
  drawText(page, fonts.bold, title, PAGE_MARGIN, top - 11, 11, INK)
  drawText(page, fonts.regular, subtitle, PAGE_MARGIN, top - 23, 8, MUTED)
  const label = `page ${pageNo}/${pageCount}`
  const width = fonts.regular.widthOfTextAtSize(label, 8)
  drawText(page, fonts.regular, label, A4_PORTRAIT.w - PAGE_MARGIN - width, top - 11, 8, MUTED)
}

function drawTile(
  page: PDFPage,
  fonts: Fonts,
  cells: number[][],
  palette: Palette,
  symbolMap: Map<number, string>,
  tile: PatternTile,
  cellPt: number,
): void {
  const left = PAGE_MARGIN + ROW_LABEL_W
  const top = A4_PORTRAIT.h - PAGE_MARGIN - HEADER_H
  const symbolSize = cellPt * 0.55

  for (let r = 0; r < tile.rows; r++) {
    for (let c = 0; c < tile.cols; c++) {
      const idx = cells[tile.row0 + r][tile.col0 + c]
      const hex = palette.colors[idx]?.hex ?? '#FF00FF'
      const x = left + c * cellPt
      const y = top - (r + 1) * cellPt
      page.drawRectangle({ x, y, width: cellPt, height: cellPt, color: toPdfColor(hex) })
      const symbol = pdfSafeText(symbolMap.get(idx) ?? '') || '?'
      const sw = fonts.bold.widthOfTextAtSize(symbol, symbolSize)
      page.drawText(symbol, {
        x: x + (cellPt - sw) / 2,
        y: y + (cellPt - symbolSize * 0.72) / 2,
        size: symbolSize,
        font: fonts.bold,
        color: hexLuma(hex) > 0.6 ? DARK_SYMBOL : LIGHT_SYMBOL,
      })
    }
  }

  // Grid: thin lines everywhere, heavier every 5 cells. Counted on the whole
  // pattern, so the guides line up across sheets.
  const gridW = tile.cols * cellPt
  const gridH = tile.rows * cellPt
  for (let c = 0; c <= tile.cols; c++) {
    const major = (tile.col0 + c) % 5 === 0 || c === 0 || c === tile.cols
    const x = left + c * cellPt
    page.drawLine({
      start: { x, y: top },
      end: { x, y: top - gridH },
      thickness: major ? 0.8 : 0.25,
      color: major ? GRID_MAJOR : GRID,
    })
  }
  for (let r = 0; r <= tile.rows; r++) {
    const major = (tile.row0 + r) % 5 === 0 || r === 0 || r === tile.rows
    const y = top - r * cellPt
    page.drawLine({
      start: { x: left, y },
      end: { x: left + gridW, y },
      thickness: major ? 0.8 : 0.25,
      color: major ? GRID_MAJOR : GRID,
    })
  }

  // Global 1-based coordinates: the tile's first cell and every 5th one.
  for (let c = 0; c < tile.cols; c++) {
    const n = tile.col0 + c + 1
    if (c !== 0 && n % 5 !== 0) continue
    const label = String(n)
    const lw = fonts.regular.widthOfTextAtSize(label, 6)
    drawText(page, fonts.regular, label, left + c * cellPt + (cellPt - lw) / 2, top + 3, 6, MUTED)
  }
  for (let r = 0; r < tile.rows; r++) {
    const n = tile.row0 + r + 1
    if (r !== 0 && n % 5 !== 0) continue
    const label = String(n)
    const lw = fonts.regular.widthOfTextAtSize(label, 6)
    drawText(
      page,
      fonts.regular,
      label,
      left - 3 - lw,
      top - (r + 1) * cellPt + (cellPt - 4.3) / 2,
      6,
      MUTED,
    )
  }
}

function drawOverview(
  page: PDFPage,
  fonts: Fonts,
  cells: number[][],
  palette: Palette,
  tiles: PatternTile[],
  pageCols: number,
  pageRows: number,
): void {
  const w = cells[0].length
  const h = cells.length
  const areaW = A4_PORTRAIT.w - 2 * PAGE_MARGIN
  const areaH = A4_PORTRAIT.h - 2 * PAGE_MARGIN - HEADER_H - 40
  const cell = Math.min(areaW / w, areaH / h)
  const left = PAGE_MARGIN + (areaW - cell * w) / 2
  const top = A4_PORTRAIT.h - PAGE_MARGIN - HEADER_H

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const hex = palette.colors[cells[y][x]]?.hex ?? '#FF00FF'
      page.drawRectangle({
        x: left + x * cell,
        y: top - (y + 1) * cell,
        width: cell,
        height: cell,
        color: toPdfColor(hex),
      })
    }
  }

  // Sheet boundaries and numbers, matching the "sheet r.c" label on each page.
  for (const tile of tiles) {
    const x = left + tile.col0 * cell
    const y = top - (tile.row0 + tile.rows) * cell
    const tileTop = y + tile.rows * cell
    page.drawRectangle({
      x,
      y,
      width: tile.cols * cell,
      height: tile.rows * cell,
      borderColor: rgb(0.9, 0.1, 0.15),
      borderWidth: 1.2,
    })
    page.drawRectangle({
      x: x + 3,
      y: tileTop - 15,
      width: 22,
      height: 12,
      color: rgb(1, 1, 1),
      opacity: 0.85,
    })
    drawText(
      page,
      fonts.bold,
      `${tile.pageRow + 1}.${tile.pageCol + 1}`,
      x + 6,
      tileTop - 12,
      8,
      INK,
    )
  }

  drawText(
    page,
    fonts.regular,
    `${pageRows} x ${pageCols} sheets. Print every page at 100% / actual size, then line the sheets up using the row and column numbers.`,
    PAGE_MARGIN,
    top - h * cell - 18,
    8,
    MUTED,
  )
}

function drawLegend(
  page: PDFPage,
  fonts: Fonts,
  entries: { index: number; count: number }[],
  palette: Palette,
  symbolMap: Map<number, string>,
): void {
  const top = A4_PORTRAIT.h - PAGE_MARGIN - HEADER_H
  const colW = (A4_PORTRAIT.w - 2 * PAGE_MARGIN) / LEGEND_COLUMNS
  const rowsPerColumn = Math.max(
    1,
    Math.floor((A4_PORTRAIT.h - 2 * PAGE_MARGIN - HEADER_H) / LEGEND_ROW_H),
  )
  entries.forEach((e, i) => {
    const col = Math.floor(i / rowsPerColumn)
    const row = i % rowsPerColumn
    const x = PAGE_MARGIN + col * colW
    const y = top - (row + 1) * LEGEND_ROW_H
    const color = palette.colors[e.index]
    const hex = color?.hex ?? '#FF00FF'
    page.drawRectangle({
      x,
      y,
      width: 13,
      height: 13,
      color: toPdfColor(hex),
      borderColor: GRID_MAJOR,
      borderWidth: 0.4,
    })
    const symbol = pdfSafeText(symbolMap.get(e.index) ?? '') || '?'
    const sw = fonts.bold.widthOfTextAtSize(symbol, 8)
    drawText(
      page,
      fonts.bold,
      symbol,
      x + (13 - sw) / 2,
      y + 3.6,
      8,
      hexLuma(hex) > 0.6 ? DARK_SYMBOL : LIGHT_SYMBOL,
    )
    const id = color ? pdfSafeText(color.id) : '?'
    const name = color ? pdfSafeText(color.name.en) : ''
    const label = truncateToWidth(`${id} ${name}`.trim(), fonts.regular, 8, colW - 60)
    drawText(page, fonts.regular, label, x + 18, y + 3.6, 8, INK)
    const count = `x ${e.count}`
    const cw = fonts.bold.widthOfTextAtSize(count, 8)
    drawText(page, fonts.bold, count, x + colW - 10 - cw, y + 3.6, 8, INK)
  })
}

function drawText(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  size: number,
  color: Color,
): void {
  const safe = pdfSafeText(text)
  if (safe) page.drawText(safe, { x, y, size, font, color })
}

function truncateToWidth(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text
  let out = text
  while (out.length > 1 && font.widthOfTextAtSize(`${out}...`, size) > maxWidth)
    out = out.slice(0, -1)
  return `${out}...`
}

function toPdfColor(hex: string): Color {
  const { r, g, b } = hexToRgb(hex)
  return rgb(r / 255, g / 255, b / 255)
}
