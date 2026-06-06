import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/useAppStore'
import { PatternCanvas } from '@/features/preview/PatternCanvas'
import { BomTable } from '@/features/bom/BomTable'
import { downloadPatternPng } from './downloadPng'
import { downloadPatternPdf } from './downloadPdf'
import { loadPalette } from '@/lib/pattern/loadPalette'
import type { Palette } from '@/lib/pattern/types'
import { CornerMarks } from '@/components/decor/CornerMarks'
import { SpecLabel } from '@/components/decor/SpecLabel'
import { computeBomWithTotal } from '@/features/bom/computeBom'

const PALETTE_LABELS = {
  manyoujiang: { 'zh-CN': '漫游酱', en: 'Manyou' },
  perler: { 'zh-CN': 'Perler', en: 'Perler' },
  hama: { 'zh-CN': 'Hama', en: 'Hama' },
} as const

export function ExportStep() {
  const { t, i18n } = useTranslation()
  const cells = useAppStore((s) => s.cells)
  const tune = useAppStore((s) => s.tune)
  const image = useAppStore((s) => s.image)
  const [palette, setPalette] = useState<Palette | null>(null)
  const [view, setView] = useState<'pattern' | 'original'>('pattern')
  const lang: 'zh-CN' | 'en' = i18n.language.startsWith('zh') ? 'zh-CN' : 'en'

  useEffect(() => {
    void loadPalette(tune.paletteId).then(setPalette)
  }, [tune.paletteId])

  if (!cells || !palette || !image) return null

  const { total } = computeBomWithTotal(cells)
  const ditherLabel =
    tune.dither === 'floyd-steinberg' ? 'F-S' : tune.dither === 'ordered-4x4' ? 'BAYER' : 'NONE'
  const paletteLabel = PALETTE_LABELS[tune.paletteId][lang]

  return (
    <div className="space-y-8 animate-specimen-in">
      <div className="grid gap-10 md:grid-cols-[1fr_320px]">
        <div>
          <div className="flex items-center gap-1 mb-4 border border-ink w-fit">
            <button
              onClick={() => setView('pattern')}
              className={`font-mono text-[10px] uppercase tracking-label px-3 py-1.5 ${
                view === 'pattern' ? 'bg-ink text-paper' : 'text-mute hover:text-ink'
              }`}
            >
              PATTERN
            </button>
            <button
              onClick={() => setView('original')}
              className={`font-mono text-[10px] uppercase tracking-label px-3 py-1.5 ${
                view === 'original' ? 'bg-ink text-paper' : 'text-mute hover:text-ink'
              }`}
            >
              ORIGINAL
            </button>
          </div>

          <div className="relative bg-paper-2 border border-ink p-5 md:p-8 inline-block max-w-full">
            <CornerMarks inset={-1} size={14} />
            {view === 'pattern' ? (
              <div className="overflow-auto">
                <PatternCanvas
                  cells={cells}
                  palette={palette}
                  cellSize={Math.max(8, Math.floor(560 / cells[0].length))}
                />
              </div>
            ) : (
              <img src={image.dataUrl} className="max-h-[60vh] block" alt="" />
            )}
          </div>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-label text-ink-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>SPEC №001</span>
            <span className="text-rule">·</span>
            <span>
              {tune.targetW} × {tune.targetH}
            </span>
            <span className="text-rule">·</span>
            <span>{paletteLabel}</span>
            <span className="text-rule">·</span>
            <span>{ditherLabel}</span>
            <span className="text-rule">·</span>
            <span>
              {total} {isCount(lang)}
            </span>
          </p>
        </div>

        {/* ORDER FORM */}
        <div className="relative border border-ink bg-paper-2 p-6">
          <CornerMarks inset={-1} size={12} />
          <SpecLabel>ORDER FORM</SpecLabel>
          <dl className="mt-5 space-y-3 font-mono text-xs text-ink-2">
            <RowKV k="DIMENSIONS" v={`${tune.targetW} × ${tune.targetH}`} />
            <RowKV k="PALETTE" v={paletteLabel} />
            <RowKV k="DITHER" v={ditherLabel} />
            <RowKV k="BEADS" v={`${total}`} />
          </dl>
          <div className="mt-7 space-y-2">
            <button
              onClick={() => downloadPatternPdf(cells, palette, lang)}
              className="w-full bg-accent text-paper border border-ink py-3 font-mono text-xs uppercase tracking-label hover:bg-accent-2 flex items-center justify-between px-4"
            >
              <span>{t('export.download.pdf')}</span>
              <span>→</span>
            </button>
            <button
              onClick={() => downloadPatternPng(cells, palette)}
              className="w-full bg-paper text-ink border border-ink py-3 font-mono text-xs uppercase tracking-label hover:bg-paper-3 flex items-center justify-between px-4"
            >
              <span>{t('export.download.png')}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      <BomTable cells={cells} palette={palette} />
    </div>
  )
}

function RowKV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-dashed border-rule pb-1.5">
      <dt className="uppercase tracking-label text-mute">{k}</dt>
      <dd className="font-display text-base font-semibold text-ink">{v}</dd>
    </div>
  )
}
function isCount(lang: 'zh-CN' | 'en') {
  return lang === 'zh-CN' ? '颗' : 'beads'
}
