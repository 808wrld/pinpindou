import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/useAppStore'
import { PatternCanvas } from '@/features/preview/PatternCanvas'
import { BomTable } from '@/features/bom/BomTable'
import { downloadPatternPng } from './downloadPng'
import { downloadPatternPdf } from './downloadPdf'
import { loadPalette } from '@/lib/pattern/loadPalette'
import type { Palette } from '@/lib/pattern/types'

export function ExportStep() {
  const { t, i18n } = useTranslation()
  const cells = useAppStore(s => s.cells)
  const tune = useAppStore(s => s.tune)
  const image = useAppStore(s => s.image)
  const [palette, setPalette] = useState<Palette | null>(null)
  const [showOriginal, setShowOriginal] = useState(false)
  const lang: 'zh-CN' | 'en' = i18n.language.startsWith('zh') ? 'zh-CN' : 'en'

  useEffect(() => { void loadPalette(tune.paletteId).then(setPalette) }, [tune.paletteId])

  if (!cells || !palette || !image) return null

  return (
    <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        <button
          onClick={() => setShowOriginal(s => !s)}
          className="text-xs text-slate-500 hover:text-slate-900"
        >
          {t('export.compare')}
        </button>
        {showOriginal ? (
          <img src={image.dataUrl} className="max-h-[60vh] rounded border" />
        ) : (
          <PatternCanvas cells={cells} palette={palette} />
        )}
        <div className="flex gap-2">
          <button
            onClick={() => downloadPatternPng(cells, palette)}
            className="rounded bg-slate-900 px-4 py-2 text-sm text-white"
          >
            {t('export.download.png')}
          </button>
          <button
            onClick={() => downloadPatternPdf(cells, palette, lang)}
            className="rounded border px-4 py-2 text-sm"
          >
            {t('export.download.pdf')}
          </button>
        </div>
      </div>
      <BomTable cells={cells} palette={palette} />
    </div>
  )
}
