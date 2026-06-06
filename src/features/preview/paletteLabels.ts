export const PALETTE_IDS = ['manyoujiang', 'perler', 'hama'] as const
export type PaletteId = (typeof PALETTE_IDS)[number]

export const PALETTE_LABELS: Record<PaletteId, { 'zh-CN': string; en: string }> = {
  manyoujiang: { 'zh-CN': '漫游酱', en: 'Manyou' },
  perler: { 'zh-CN': 'Perler', en: 'Perler' },
  hama: { 'zh-CN': 'Hama', en: 'Hama' },
}

export function ditherLabel(
  dither: 'none' | 'floyd-steinberg' | 'ordered-4x4',
  isZh: boolean,
): string {
  if (dither === 'floyd-steinberg') return 'F-S'
  if (dither === 'ordered-4x4') return 'BAYER'
  return isZh ? '无' : 'NONE'
}
