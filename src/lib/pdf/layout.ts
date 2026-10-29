/**
 * Page layout for the printable PDF: A4 portrait pages, one bead per cell at
 * real size (5 mm pitch for midi beads), split into tiles when the pattern
 * doesn't fit on one sheet. Pure functions — no pdf-lib here — so the
 * layout can be unit-tested.
 */

export const PT_PER_MM = 72 / 25.4
export const A4_PORTRAIT = { w: 595.28, h: 841.89 } as const
/** Midi beads (Perler / Hama midi / most Taobao brands) sit on a 5 mm grid. */
export const BEAD_PITCH_MM = 5

export const PAGE_MARGIN = 28 // ≈ 10 mm, inside most printers' printable area
export const HEADER_H = 40 // title line + column numbers
export const FOOTER_H = 20 // print-scale note
export const ROW_LABEL_W = 18 // row numbers left of the grid

export type PageSize = { w: number; h: number }

export type PatternTile = {
  /** First column / row of the pattern on this page (0-based). */
  col0: number
  row0: number
  cols: number
  rows: number
  /** Position of this page in the assembled sheet (0-based). */
  pageCol: number
  pageRow: number
}

export type PatternLayout = {
  cellPt: number
  pageCols: number
  pageRows: number
  tiles: PatternTile[]
}

/** Split a w × h pattern into page tiles; columns / rows are spread evenly over the pages. */
export function planPatternPages(
  w: number,
  h: number,
  opts: { page?: PageSize; cellPt?: number } = {},
): PatternLayout {
  const page = opts.page ?? A4_PORTRAIT
  const cellPt = opts.cellPt ?? BEAD_PITCH_MM * PT_PER_MM
  const usableW = page.w - 2 * PAGE_MARGIN - ROW_LABEL_W
  const usableH = page.h - 2 * PAGE_MARGIN - HEADER_H - FOOTER_H
  const maxCols = Math.max(1, Math.floor(usableW / cellPt))
  const maxRows = Math.max(1, Math.floor(usableH / cellPt))
  const pageCols = Math.max(1, Math.ceil(w / maxCols))
  const pageRows = Math.max(1, Math.ceil(h / maxRows))
  const colsPer = Math.ceil(w / pageCols)
  const rowsPer = Math.ceil(h / pageRows)

  const tiles: PatternTile[] = []
  for (let pageRow = 0; pageRow < pageRows; pageRow++) {
    for (let pageCol = 0; pageCol < pageCols; pageCol++) {
      const col0 = pageCol * colsPer
      const row0 = pageRow * rowsPer
      tiles.push({
        col0,
        row0,
        cols: Math.min(colsPer, w - col0),
        rows: Math.min(rowsPer, h - row0),
        pageCol,
        pageRow,
      })
    }
  }
  return { cellPt, pageCols, pageRows, tiles }
}

export const LEGEND_ROW_H = 18
export const LEGEND_COLUMNS = 3

/** Split legend entries over as many pages as needed — nothing is ever dropped. */
export function planLegendPages<T>(entries: readonly T[], page: PageSize = A4_PORTRAIT): T[][] {
  const usableH = page.h - 2 * PAGE_MARGIN - HEADER_H
  const rowsPerColumn = Math.max(1, Math.floor(usableH / LEGEND_ROW_H))
  const perPage = rowsPerColumn * LEGEND_COLUMNS
  const pages: T[][] = []
  for (let i = 0; i < entries.length; i += perPage) pages.push(entries.slice(i, i + perPage))
  return pages.length ? pages : [[]]
}

/** Standard PDF fonts only cover WinAnsi; keep printable ASCII and drop the rest. */
export function pdfSafeText(s: string): string {
  return s.replace(/[^\x20-\x7E]/g, '').trim()
}
