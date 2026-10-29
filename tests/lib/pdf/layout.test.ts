import { describe, it, expect } from 'vitest'
import { planLegendPages, planPatternPages, pdfSafeText, PT_PER_MM } from '@/lib/pdf/layout'

describe('planPatternPages', () => {
  it('uses a real 5 mm cell', () => {
    expect(planPatternPages(10, 10).cellPt).toBeCloseTo(5 * PT_PER_MM, 5)
  })

  it('fits a 29x29 pegboard on one A4 sheet', () => {
    const layout = planPatternPages(29, 29)
    expect(layout.tiles).toEqual([{ col0: 0, row0: 0, cols: 29, rows: 29, pageCol: 0, pageRow: 0 }])
  })

  it('splits 64x64 into 2x2 even sheets', () => {
    const layout = planPatternPages(64, 64)
    expect([layout.pageCols, layout.pageRows]).toEqual([2, 2])
    expect(layout.tiles.map((t) => [t.col0, t.row0, t.cols, t.rows])).toEqual([
      [0, 0, 32, 32],
      [32, 0, 32, 32],
      [0, 32, 32, 32],
      [32, 32, 32, 32],
    ])
  })

  it('covers every cell exactly once for odd sizes', () => {
    const w = 58
    const h = 23
    const layout = planPatternPages(w, h)
    const seen = new Set<string>()
    for (const t of layout.tiles) {
      for (let r = 0; r < t.rows; r++) {
        for (let c = 0; c < t.cols; c++) seen.add(`${t.col0 + c},${t.row0 + r}`)
      }
    }
    expect(seen.size).toBe(w * h)
    expect(layout.tiles.reduce((n, t) => n + t.cols * t.rows, 0)).toBe(w * h)
  })
})

describe('planLegendPages', () => {
  it('never drops entries', () => {
    const entries = Array.from({ length: 400 }, (_, i) => i)
    const pages = planLegendPages(entries)
    expect(pages.length).toBeGreaterThan(1)
    expect(pages.flat()).toEqual(entries)
  })

  it('returns one (empty) page for no entries', () => {
    expect(planLegendPages([])).toEqual([[]])
  })
})

describe('pdfSafeText', () => {
  it('keeps printable ASCII only', () => {
    expect(pdfSafeText('M01 白 White')).toBe('M01  White')
    expect(pdfSafeText('●')).toBe('')
  })
})
