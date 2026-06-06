import { describe, it, expect } from 'vitest'
import { buildPatternPdf } from '@/lib/pdf/buildPdf'
import { hexToLab } from '@/lib/color/lab'
import type { Palette } from '@/lib/pattern/types'

const palette: Palette = {
  id: 't', name: { 'zh-CN': 't', en: 't' }, version: 'v', source: '',
  colors: [
    { id: 'C01', name: { 'zh-CN': '白', en: 'W' }, hex: '#FFFFFF', lab: hexToLab('#FFFFFF') },
    { id: 'C02', name: { 'zh-CN': '黑', en: 'B' }, hex: '#000000', lab: hexToLab('#000000') },
  ],
}

describe('buildPatternPdf', () => {
  it('produces a non-empty PDF byte array with %PDF magic', async () => {
    const cells = [[0, 1], [1, 0]]
    const bytes = await buildPatternPdf(cells, palette, { lang: 'en' })
    expect(bytes.length).toBeGreaterThan(500)
    const head = String.fromCharCode(...bytes.slice(0, 4))
    expect(head).toBe('%PDF')
  })
})
