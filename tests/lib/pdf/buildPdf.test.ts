import { describe, it, expect } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { buildPatternPdf } from '@/lib/pdf/buildPdf'
import { hexToLab } from '@/lib/color/lab'
import type { Palette } from '@/lib/pattern/types'

const palette: Palette = {
  id: 't', name: { 'zh-CN': 't', en: 't' }, version: 'v', source: '',
  colors: [
    { id: 'C01', name: { 'zh-CN': '白', en: 'W' }, hex: '#FFFFFF', lab: hexToLab('#FFFFFF') },
    { id: 'C02', name: { 'zh-CN': '黑', en: 'B' }, hex: '#000000', lab: hexToLab('#000000') },
    { id: 'C03', name: { 'zh-CN': '咖啡', en: 'Café' }, hex: '#6F4E37', lab: hexToLab('#6F4E37') },
  ],
}

function grid(w: number, h: number): number[][] {
  return Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => (x + y) % 3))
}

async function pageCount(cells: number[][]): Promise<number> {
  const bytes = await buildPatternPdf(cells, palette, { lang: 'zh-CN' })
  return (await PDFDocument.load(bytes)).getPageCount()
}

describe('buildPatternPdf', () => {
  it('produces a non-empty PDF byte array with %PDF magic', async () => {
    const cells = [[0, 1], [1, 0]]
    const bytes = await buildPatternPdf(cells, palette, { lang: 'en' })
    expect(bytes.length).toBeGreaterThan(500)
    const head = String.fromCharCode(...bytes.slice(0, 4))
    expect(head).toBe('%PDF')
  })

  it('puts a small pattern on one sheet plus a legend page', async () => {
    expect(await pageCount(grid(29, 29))).toBe(2)
  })

  it('tiles a 64x64 pattern over A4 sheets with an overview page', async () => {
    // overview + 2x2 sheets + legend
    expect(await pageCount(grid(64, 64))).toBe(6)
  })

  it('handles non-square patterns', async () => {
    // 48x24: two sheets side by side, plus overview and legend
    expect(await pageCount(grid(48, 24))).toBe(4)
  })
})
