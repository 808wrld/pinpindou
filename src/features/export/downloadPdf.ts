import type { Palette } from '@/lib/pattern/types'

export async function downloadPatternPdf(cells: number[][], palette: Palette, lang: 'zh-CN' | 'en'): Promise<void> {
  const { buildPatternPdf } = await import('@/lib/pdf/buildPdf')
  const bytes = await buildPatternPdf(cells, palette, { lang })
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const w = cells[0].length, h = cells.length
  a.href = url; a.download = `pinpindou-${w}x${h}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
