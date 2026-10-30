import type { Palette } from '@/lib/pattern/types'
import { downloadBlob } from '@/lib/download'

export async function downloadPatternPdf(cells: number[][], palette: Palette, lang: 'zh-CN' | 'en'): Promise<void> {
  const { buildPatternPdf } = await import('@/lib/pdf/buildPdf')
  const bytes = await buildPatternPdf(cells, palette, { lang })
  const w = cells[0].length, h = cells.length
  downloadBlob(new Blob([bytes as BlobPart], { type: 'application/pdf' }), `pinpindou-${w}x${h}.pdf`)
}
